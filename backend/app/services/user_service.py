from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_model import User
from app.schemas.user_schema import UserCreate, UserResponse, UserUpdate


class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_users(self) -> list[UserResponse]:
        result = await self.db.execute(select(User).order_by(User.user_id.asc()))
        return [UserResponse.model_validate(user) for user in result.scalars().all()]

    async def create_user(self, payload: UserCreate) -> UserResponse:
        user = User(
            full_name=payload.full_name,
            email=str(payload.email),
            role=payload.role,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return UserResponse.model_validate(user)

    async def get_user_by_id(self, user_id: int) -> UserResponse | None:
        user = await self.db.get(User, user_id)
        return UserResponse.model_validate(user) if user else None

    async def update_user(self, user_id: int, payload: UserUpdate) -> UserResponse | None:
        user = await self.db.get(User, user_id)
        if not user:
            return None

        update_data = payload.model_dump(exclude_unset=True)
        if not update_data:
            return UserResponse.model_validate(user)

        if 'full_name' in update_data:
            user.full_name = update_data['full_name']
        if 'email' in update_data:
            user.email = str(update_data['email'])
        if 'role' in update_data:
            user.role = update_data['role']

        await self.db.commit()
        await self.db.refresh(user)
        return UserResponse.model_validate(user)

    async def delete_user(self, user_id: int) -> bool:
        user = await self.db.get(User, user_id)
        if not user:
            return False

        await self.db.delete(user)
        await self.db.commit()
        return True
