"""Unit tests for narration_context helpers."""

from app.services.narration_context import (
    build_bilingual_contexts,
    has_turkish,
    split_description_by_language,
)


def test_has_turkish() -> None:
    assert has_turkish('Anıtkabir, Çankaya')
    assert not has_turkish('Colonnaded tomb for Kemal Ataturk')


def test_split_description_by_language() -> None:
    desc = (
        'Colonnaded tomb for the former president, Kemal Ataturk.\n'
        'Mebusevleri, Anıttepe, 06570 Çankaya/Ankara, Türkiye'
    )
    tr_part, en_part = split_description_by_language(desc)
    assert 'Colonnaded' in en_part
    assert 'Colonnaded' not in tr_part
    assert 'Çankaya' in tr_part


def test_build_bilingual_contexts() -> None:
    tr_ctx, en_ctx = build_bilingual_contexts(
        description='Short English summary from Google.',
        wiki_tr='Anıtkabir, Mustafa Kemal Atatürk için yapılmış anıt mezardır.',
        wiki_en='Anıtkabir is the mausoleum of Mustafa Kemal Atatürk.',
        title='Anıtkabir',
        city='Ankara',
        district='Çankaya',
    )
    assert 'anıt mezar' in tr_ctx
    assert 'Short English' not in tr_ctx
    assert 'mausoleum' in en_ctx
    assert 'anıt mezar' not in en_ctx
