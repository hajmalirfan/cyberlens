from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserLogin, UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=dict)
async def register(data: UserCreate, db: Session = Depends(get_db)):
    service = AuthService(db)
    result = service.register(data)
    return {
        "user": UserResponse.model_validate(result["user"]),
        "access_token": result["access_token"],
        "refresh_token": result["refresh_token"],
        "token_type": "bearer",
    }


@router.post("/login", response_model=dict)
async def login(data: UserLogin, db: Session = Depends(get_db)):
    service = AuthService(db)
    result = service.login(data)
    return {
        "user": UserResponse.model_validate(result["user"]),
        "access_token": result["access_token"],
        "refresh_token": result["refresh_token"],
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=dict)
async def refresh_token(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    service = AuthService(db)
    result = service.refresh_token(user.id)
    return {
        "access_token": result["access_token"],
        "refresh_token": result["refresh_token"],
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return user


@router.put("/me", response_model=UserResponse)
async def update_me(data: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.repositories.user import UserRepository
    repo = UserRepository(db)
    repo.update(user.id, **data)
    return repo.get_by_id(user.id)
