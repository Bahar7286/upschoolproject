from collections.abc import Callable
from typing import TypeVar

T = TypeVar('T')
_CACHE: dict[str, object] = {}


async def get_or_set_cache(*, key: str, loader: Callable[[], T]) -> T:
    if key in _CACHE:
        return _CACHE[key]  # type: ignore[return-value]

    value = loader()
    _CACHE[key] = value
    return value
