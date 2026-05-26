from pydantic import BaseModel, ConfigDict, Field


class NoteUpsert(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    content: str = Field(min_length=1, max_length=5000)


class NoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    note_id: int
    user_id: int
    route_id: int
    content: str
    updated_at: str
