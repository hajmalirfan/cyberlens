from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, create_refresh_token, get_password_hash, verify_password
from app.repositories.user import UserRepository
from app.schemas.user import UserCreate, UserLogin


class AuthService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)

    def register(self, data: UserCreate):
        if self.user_repo.get_by_email(data.email):
            raise HTTPException(status_code=400, detail="Email already registered")
        if self.user_repo.get_by_username(data.username):
            raise HTTPException(status_code=400, detail="Username already taken")

        user = self.user_repo.create(
            email=data.email,
            username=data.username,
            full_name=data.full_name or data.username,
            hashed_password=get_password_hash(data.password),
            role="analyst",
        )

        access_token = create_access_token(user.id, user.role)
        refresh_token = create_refresh_token(user.id)

        return {
            "user": user,
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    def login(self, data: UserLogin):
        user = self.user_repo.get_by_username(data.username)
        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is disabled")

        access_token = create_access_token(user.id, user.role)
        refresh_token = create_refresh_token(user.id)

        return {
            "user": user,
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    def refresh_token(self, user_id: int):
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "access_token": create_access_token(user.id, user.role),
            "refresh_token": create_refresh_token(user.id),
        }
