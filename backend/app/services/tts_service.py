import base64
import tempfile
from pathlib import Path

_VOICE = {
    'tr': 'tr-TR-EmelNeural',
    'en': 'en-US-JennyNeural',
    'de': 'de-DE-KatjaNeural',
}


async def synthesize_mp3_base64(text: str, lang: str = 'tr') -> str | None:
    """edge-tts ile MP3 üretir; uzun metinleri parçalayıp birleştirir. Paket yoksa None."""
    cleaned = (text or '').strip()
    if not cleaned:
        return None
    try:
        import edge_tts
    except ImportError:
        return None

    code = lang.lower()[:2] if lang else 'tr'
    voice = _VOICE.get(code, _VOICE['tr'])
    chunks = _split_for_tts(cleaned, max_len=900)
    mp3_bytes: list[bytes] = []

    with tempfile.TemporaryDirectory() as tmp:
        for idx, snippet in enumerate(chunks[:5]):
            out = Path(tmp) / f'narration_{idx}.mp3'
            communicate = edge_tts.Communicate(snippet, voice)
            await communicate.save(str(out))
            if out.is_file():
                mp3_bytes.append(out.read_bytes())
        if not mp3_bytes:
            return None
        combined = b''.join(mp3_bytes)
        return base64.b64encode(combined).decode('ascii')


def _split_for_tts(text: str, *, max_len: int) -> list[str]:
    if len(text) <= max_len:
        return [text]
    parts: list[str] = []
    buf = ''
    for sentence in text.replace('\n', ' ').split('. '):
        piece = (sentence.strip() + '. ') if sentence.strip() else ''
        if len(buf) + len(piece) > max_len and buf:
            parts.append(buf.strip())
            buf = piece
        else:
            buf += piece
    if buf.strip():
        parts.append(buf.strip())
    return parts or [text[:max_len]]
