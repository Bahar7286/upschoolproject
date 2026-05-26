from pydantic import BaseModel, ConfigDict, Field


class PurchaseCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    user_id: int = Field(gt=0)
    route_id: int = Field(gt=0)
    amount: float = Field(gt=0)
    currency: str = Field(default='USD', min_length=3, max_length=3)


class PurchaseUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    amount: float | None = Field(default=None, gt=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    status: str | None = Field(default=None, pattern='^(pending|confirmed|failed|refunded)$')


class CheckoutCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    user_id: int = Field(gt=0)
    amount: float = Field(gt=0)
    currency: str = Field(default='TRY', min_length=3, max_length=3)
    route_id: int | None = Field(default=None, gt=0)
    offer_id: int | None = Field(default=None, gt=0)
    trip_request_id: int | None = Field(default=None, gt=0)
    payment_method: str = Field(default='card', pattern='^(card|wallet)$')
    card_holder: str = Field(default='Demo User', min_length=2, max_length=120)
    card_last4: str = Field(default='4242', min_length=4, max_length=4, pattern=r'^\d{4}$')
    success_url: str | None = Field(default=None, max_length=500)
    cancel_url: str | None = Field(default=None, max_length=500)


class PaymentConfigResponse(BaseModel):
    stripe_enabled: bool
    publishable_key: str | None = None


class StripeCheckoutResponse(BaseModel):
    purchase_id: int
    checkout_url: str
    mode: str = 'stripe'


class CheckoutConfirm(BaseModel):
    purchase_id: int = Field(gt=0)
    accept_offer: bool = Field(
        default=False,
        description='Teklif ödemesinde true ise teklif kabul edilir',
    )
    stripe_session_id: str | None = Field(default=None, max_length=255)


class PurchaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    purchase_id: int
    user_id: int
    route_id: int
    amount: float
    currency: str
    status: str
    transaction_ref: str = ''
    payment_method: str = 'card'
    offer_id: int | None = None
    trip_request_id: int | None = None
    stripe_session_id: str | None = None
