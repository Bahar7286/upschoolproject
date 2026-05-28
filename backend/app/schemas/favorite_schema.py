from pydantic import BaseModel, ConfigDict, Field

from app.schemas.place_schema import PlaceResponse


class FavoriteCreate(BaseModel):
    entity_type: str = Field(pattern='^(place|route)$')
    entity_id: int = Field(ge=1)


class FavoriteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    entity_type: str
    entity_id: int
    created_at: str
    place: PlaceResponse | None = None

