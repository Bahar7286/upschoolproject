from app.schemas.guide_schema import GuideEarningsResponse, GuidePayoutRequest

_GUIDE_EARNINGS: dict[int, GuideEarningsResponse] = {
    101: GuideEarningsResponse(guide_id=101, monthly_earnings=1230.5, route_sales=88),
    102: GuideEarningsResponse(guide_id=102, monthly_earnings=875.0, route_sales=54),
}


async def get_guide_earnings(guide_id: int) -> GuideEarningsResponse:
    return _GUIDE_EARNINGS.get(guide_id, GuideEarningsResponse(guide_id=guide_id, monthly_earnings=0, route_sales=0))


async def create_payout(payload: GuidePayoutRequest) -> dict[str, str]:
    return {
        'status': 'queued',
        'message': f'Payout of {payload.amount:.2f} queued for guide {payload.guide_id}',
    }
