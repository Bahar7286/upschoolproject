import base64
import tempfile
from pathlib import Path

_VOICE = {
    'tr': 'tr-TR-EmelNeural',
    'en': 'en-US-JennyNeural',
    'de': 'de-DE-KatjaNeural',
}


async def synthesize_mp3_base64(text: str, lang: str = 'tr') -> str | None:
    """edge-tts ile MP3 üretir; base64 döner. Paket yoksa None."""
    cleaned = (text or '').strip()
    if not cleaned:
        return None
    try:
        import edge_tts
    except ImportError:
        return None

    code = lang.lower()[:2] if lang else 'tr'
    voice = _VOICE.get(code, _VOICE['tr'])
    snippet = cleaned[:1200]

    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / 'narration.mp3'
        communicate = edge_tts.Communicate(snippet, voice)
        await communicate.save(str(out))
        if not out.is_file():
            return None
        return base64.b64encode(out.read_bytes()).decode('ascii')
