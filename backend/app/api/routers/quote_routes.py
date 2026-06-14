from fastapi import APIRouter, HTTPException

router = APIRouter()

_GONE_DETAIL = {
    'detail': 'Quotes API deprecated. Use /trip-requests instead.',
    'successor': '/trip-requests',
}


def _gone() -> None:
    raise HTTPException(status_code=410, detail=_GONE_DETAIL)


@router.post('')
async def create_quote() -> None:
    _gone()


@router.get('/sent')
async def list_sent_quotes() -> None:
    _gone()


@router.get('/inbox')
async def list_inbox_quotes() -> None:
    _gone()


@router.patch('/{quote_id}/respond')
async def respond_to_quote(quote_id: int) -> None:
    _gone()
