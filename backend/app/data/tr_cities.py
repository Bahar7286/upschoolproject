import json
from pathlib import Path


def _load() -> list[dict]:
    path = Path(__file__).with_name('tr-cities.json')
    return json.loads(path.read_text(encoding='utf-8'))


TR_CITIES: list[dict] = _load()

import json
from pathlib import Path


def _load() -> list[dict]:
    path = Path(__file__).with_name('tr-cities.json')
    return json.loads(path.read_text(encoding='utf-8'))


TR_CITIES: list[dict] = _load()

