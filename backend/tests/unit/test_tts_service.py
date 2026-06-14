"""TTS text chunking tests."""

from app.services.tts_service import _split_for_tts


def test_split_for_tts_short_text() -> None:
    assert _split_for_tts('Hello world.', max_len=900) == ['Hello world.']


def test_split_for_tts_long_text() -> None:
    text = '. '.join([f'Sentence number {i}' for i in range(80)]) + '.'
    chunks = _split_for_tts(text, max_len=120)
    assert len(chunks) > 1
    assert all(len(c) <= 130 for c in chunks)
