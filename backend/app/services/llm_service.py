"""OpenRouter / Gemini üzerinden LLM çağrıları (httpx)."""

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
    """Tek giriş noktası: OpenRouter (varsayılan) veya Google Gemini."""

    def __init__(self) -> None:
        self.provider = settings.llm_provider
        self.enabled = settings.llm_enabled

    async def complete_text(self, *, system: str, user: str, temperature: float = 0.5) -> str:
        if not self.enabled:
            raise LLMServiceError('LLM yapılandırılmamış')
        if self.provider == 'gemini':
            return await self._gemini_complete(system, user, temperature=temperature, json_mode=False)
        return await self._openrouter_complete(system, user, temperature=temperature, json_mode=False)

    async def complete_json(self, *, system: str, user: str, temperature: float = 0.35) -> Any:
        if not self.enabled:
            raise LLMServiceError('LLM yapılandırılmamış')
        raw = (
            await self._gemini_complete(system, user, temperature=temperature, json_mode=True)
            if self.provider == 'gemini'
            else await self._openrouter_complete(system, user, temperature=temperature, json_mode=True)
        )
        try:
            return _extract_json(raw)
        except json.JSONDecodeError as exc:
            raise LLMServiceError(f'LLM JSON ayrıştırılamadı: {raw[:200]}') from exc

    async def _openrouter_complete(
        self,
        system: str,
        user: str,
        *,
        temperature: float,
        json_mode: bool,
    ) -> str:
        payload: dict[str, Any] = {
            'model': settings.openrouter_model,
            'messages': [
                {'role': 'system', 'content': system},
                {'role': 'user', 'content': user},
            ],
            'temperature': temperature,
        }
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

    async def _gemini_complete(
        self,
        system: str,
        user: str,
        *,
        temperature: float,
        json_mode: bool,
    ) -> str:
        model = settings.gemini_model
        url = (
            f'https://generativelanguage.googleapis.com/v1beta/models/'
            f'{model}:generateContent'
        )
        body: dict[str, Any] = {
            'systemInstruction': {'parts': [{'text': system}]},
            'contents': [{'role': 'user', 'parts': [{'text': user}]}],
            'generationConfig': {'temperature': temperature},
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
