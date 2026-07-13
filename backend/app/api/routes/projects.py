from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import allow_admin, allow_analyst, get_current_user
from app.models.user import User
from app.repositories.project import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectSummary, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("/", response_model=List[ProjectResponse])
async def list_projects(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    repo = ProjectRepository(db)
    if user.role == "admin":
        return repo.get_all()
    return repo.get_by_owner(user.id)


@router.post("/", response_model=ProjectResponse)
async def create_project(
    data: ProjectCreate,
    user: User = Depends(allow_analyst),
    db: Session = Depends(get_db),
):
    repo = ProjectRepository(db)
    return repo.create(**data.model_dump(), owner_id=user.id)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    repo = ProjectRepository(db)
    project = repo.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    data: ProjectUpdate,
    user: User = Depends(allow_analyst),
    db: Session = Depends(get_db),
):
    repo = ProjectRepository(db)
    project = repo.update(project_id, **data.model_dump(exclude_none=True))
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.delete("/{project_id}")
async def delete_project(project_id: int, user: User = Depends(allow_admin), db: Session = Depends(get_db)):
    repo = ProjectRepository(db)
    if not repo.delete(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted"}


@router.get("/{project_id}/summary", response_model=ProjectSummary)
async def get_project_summary(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.repositories.event import EventRepository

    repo = ProjectRepository(db)
    project = repo.get_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    event_repo = EventRepository(db)
    stats = event_repo.get_stats(project_id)

    return ProjectSummary(
        id=project.id,
        name=project.name,
        status=project.status,
        total_logs=stats["total"],
        critical_events=stats["critical"],
    )
