from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.repositories.event import EventRepository
from app.schemas.event import NormalizedEventResponse

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("/{project_id}", response_model=List[NormalizedEventResponse])
async def list_events(
    project_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    severity: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = EventRepository(db)
    events = repo.get_by_project(project_id, skip=(page - 1) * page_size, limit=page_size)
    if severity:
        events = [e for e in events if e.severity == severity]
    return events


@router.get("/{project_id}/search", response_model=List[NormalizedEventResponse])
async def search_events(
    project_id: int,
    q: str = Query("", min_length=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = EventRepository(db)
    return repo.search(project_id, q)


@router.get("/{project_id}/stats", response_model=dict)
async def get_event_stats(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = EventRepository(db)
    return repo.get_stats(project_id)
