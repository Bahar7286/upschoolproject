"""OpenRouter, Hugging Face veya Google Gemini API üzerinden LLM (httpx)."""

from __future__ import annotations

import json
import logging
import re
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class LLMServiceError(Exception):
    """LLM sağlayıcı hatası veya geçersiz yanıt."""


def _extract_json(text: str) -> Any:
    cleaned = text.strip()
    fence = re.search(r'```(?:json)?\s*([\s\S]*?)```', cleaned)
    if fence:
        cleaned = fence.group(1).strip()
    return json.loads(cleaned)


class LLMService:
    """OpenRouter (varsayılan), Hugging Face veya LLM_PROVIDER=gemini / huggingface."""

    def __init__(self) -> None:
        self.provider = settings.llm_provider
        self.enabled = settings.llm_enabled

    async def complete_text(
        self,
        *,
        system: str,
        user: str,
        temperature: float = 0.5,
        max_tokens: int | None = None,
    ) -> str:
        if not self.enabled:
            raise LLMServiceError('LLM yapılandırılmamış')
        try:
            return await self._primary_text(
                system, user, temperature=temperature, max_tokens=max_tokens
            )
        except LLMServiceError as exc:
            if settings.huggingface_fallback_enabled and self.provider != 'huggingface':
                logger.warning('Birincil LLM başarısız, Hugging Face deneniyor: %s', exc)
                return await self._huggingface_complete(
                    system,
                    user,
                    temperature=temperature,
                    json_mode=False,
                    max_tokens=max_tokens,
                )
            raise

    async def complete_json(
        self,
        *,
        system: str,
        user: str,
        temperature: float = 0.35,
        max_tokens: int | None = None,
    ) -> Any:
        if not self.enabled:
            raise LLMServiceError('LLM yapılandırılmamış')
        try:
            raw = await self._primary_json(
                system, user, temperature=temperature, max_tokens=max_tokens
            )
        except LLMServiceError as exc:
            if settings.huggingface_fallback_enabled and self.provider != 'huggingface':
                logger.warning('Birincil LLM JSON başarısız, Hugging Face deneniyor: %s', exc)
                raw = await self._huggingface_complete(
                    system,
                    user,
                    temperature=temperature,
                    json_mode=True,
                    max_tokens=max_tokens,
                )
            else:
                raise
        try:
            return _extract_json(raw)
        except json.JSONDecodeError as exc:
            raise LLMServiceError(f'LLM JSON ayrıştırılamadı: {raw[:200]}') from exc

    async def _primary_text(
        self,
        system: str,
        user: str,
        *,
        temperature: float,
        max_tokens: int | None,
    ) -> str:
        if self.provider == 'gemini':
            return await self._gemini_complete(
                system, user, temperature=temperature, json_mode=False, max_tokens=max_tokens
            )
        if self.provider == 'huggingface':
            return await self._huggingface_complete(
                system, user, temperature=temperature, json_mode=False, max_tokens=max_tokens
            )
        return await self._openrouter_complete(
            system, user, temperature=temperature, json_mode=False, max_tokens=max_tokens
        )

    async def _primary_json(
        self,
        system: str,
        user: str,
        *,
        temperature: float,
        max_tokens: int | None,
    ) -> str:
        if self.provider == 'gemini':
            return await self._gemini_complete(
                system, user, temperature=temperature, json_mode=True, max_tokens=max_tokens
            )
        if self.provider == 'huggingface':
            return await self._huggingface_complete(
                system, user, temperature=temperature, json_mode=True, max_tokens=max_tokens
            )
        return await self._openrouter_complete(
            system, user, temperature=temperature, json_mode=True, max_tokens=max_tokens
        )

    async def _openrouter_complete(
        self,
        system: str,
        user: str,
        *,
        temperature: float,
        json_mode: bool,
        max_tokens: int | None = None,
    ) -> str:
        payload: dict[str, Any] = {
            'model': settings.openrouter_model,
            'messages': [
                {'role': 'system', 'content': system},
                {'role': 'user', 'content': user},
            ],
            'temperature': temperature,
        }
        if max_tokens is not None:
            payload['max_tokens'] = max_tokens
        if json_mode:
            payload['response_format'] = {'type': 'json_object'}

        headers = {
            'Authorization': f'Bearer {settings.openrouter_api_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': settings.frontend_url,
            'X-Title': 'Historial-GO',
        }
        async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
            response = await client.post(
                f'{settings.openrouter_base_url.rstrip("/")}/chat/completions',
                headers=headers,
                json=payload,
            )
        if response.status_code >= 400:
            raise LLMServiceError(f'OpenRouter {response.status_code}: {response.text[:300]}')
        data = response.json()
        try:
            return data['choices'][0]['message']['content']
        except (KeyError, IndexError, TypeError) as exc:
            raise LLMServiceError('OpenRouter yanıt formatı beklenmiyor') from exc

    async def _huggingface_complete(
        self,
        system: str,
        user: str,
        *,
        temperature: float,
        json_mode: bool,
        max_tokens: int | None = None,
    ) -> str:
        payload: dict[str, Any] = {
            'model': settings.huggingface_model,
            'messages': [
                {'role': 'system', 'content': system},
                {'role': 'user', 'content': user},
            ],
            'temperature': temperature,
            'max_tokens': max_tokens if max_tokens is not None else 1200,
        }
        if json_mode:
            payload['response_format'] = {'type': 'json_object'}

        headers = {
            'Authorization': f'Bearer {settings.huggingface_api_key}',
            'Content-Type': 'application/json',
        }
        async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
            response = await client.post(
                f'{settings.huggingface_base_url}/chat/completions',
                headers=headers,
                json=payload,
            )
        if response.status_code >= 400:
            raise LLMServiceError(f'Hugging Face {response.status_code}: {response.text[:300]}')
        data = response.json()
        try:
            return data['choices'][0]['message']['content']
        except (KeyError, IndexError, TypeError) as exc:
            raise LLMServiceError('Hugging Face yanıt formatı beklenmiyor') from exc

    async def _gemini_complete(
        self,
        system: str,
        user: str,
        *,
        temperature: float,
        json_mode: bool,
        max_tokens: int | None = None,
    ) -> str:
        model = settings.gemini_model
        url = (
            f'https://generativelanguage.googleapis.com/v1beta/models/'
            f'{model}:generateContent'
        )
        gen_config: dict[str, Any] = {'temperature': temperature}
        if max_tokens is not None:
            gen_config['maxOutputTokens'] = max_tokens
        body: dict[str, Any] = {
            'systemInstruction': {'parts': [{'text': system}]},
            'contents': [{'role': 'user', 'parts': [{'text': user}]}],
            'generationConfig': gen_config,
        }
        if json_mode:
            body['generationConfig']['responseMimeType'] = 'application/json'

        async with httpx.AsyncClient(timeout=settings.llm_timeout_seconds) as client:
            response = await client.post(
                url,
                params={'key': settings.gemini_api_key},
                json=body,
            )
        if response.status_code >= 400:
            raise LLMServiceError(f'Gemini {response.status_code}: {response.text[:300]}')
        data = response.json()
        try:
            return data['candidates'][0]['content']['parts'][0]['text']
        except (KeyError, IndexError, TypeError) as exc:
            raise LLMServiceError('Gemini yanıt formatı beklenmiyor') from exc


llm_service = LLMService()
