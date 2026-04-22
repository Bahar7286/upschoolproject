from fastapi import APIRouter, HTTPException

from app.schemas.guide_schema import GuideEarningsResponse, GuidePayoutRequest
from app.services.guide_service import create_payout, get_guide_earnings

router = APIRouter()


@router.get('/{guide_id}/earnings', response_model=GuideEarningsResponse)
async def get_earnings(guide_id: int) -> GuideEarningsResponse:
    if guide_id <= 0:
        raise HTTPException(status_code=400, detail='Invalid guide id')
    return await get_guide_earnings(guide_id)


@router.post('/payout')
async def request_payout(payload: GuidePayoutRequest) -> dict[str, str]:
    return await create_payout(payload)
