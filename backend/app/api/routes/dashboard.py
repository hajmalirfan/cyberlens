from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.repositories.event import EventRepository
from app.repositories.project import ProjectRepository
from app.repositories.upload import UploadRepository

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _classify_attack(stats: dict) -> str:
    if stats["critical"] > 50:
        return "Ransomware"
    if stats["critical"] > 20:
        return "Advanced Persistent Threat"
    if stats["high"] > 100:
        return "Brute Force Attack"
    if stats["high"] > 50:
        return "Lateral Movement"
    if stats["medium"] > 100:
        return "Reconnaissance"
    return "Suspicious Activity"


@router.get("/{project_id}")
async def get_dashboard(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    event_repo = EventRepository(db)
    upload_repo = UploadRepository(db)
    project_repo = ProjectRepository(db)

    project = project_repo.get_by_id(project_id)
    if not project:
        return {"error": "Project not found"}

    stats = event_repo.get_stats(project_id)
    uploads = upload_repo.get_by_project(project_id)
    recent_events = event_repo.get_by_project(project_id, limit=10)

    severity_counts = {
        "critical": stats["critical"],
        "high": stats["high"],
        "medium": stats["medium"],
        "low": stats["low"],
        "info": stats["info"],
    }

    attack_score = min(
        stats["critical"] * 10 + stats["high"] * 5 + stats["medium"] * 2,
        100,
    )

    return {
        "project_id": project_id,
        "project_name": project.name,
        "total_logs": stats["total"],
        "critical_events": stats["critical"],
        "attack_score": attack_score,
        "attack_type": _classify_attack(stats),
        "severity_breakdown": severity_counts,
        "total_uploads": len(uploads),
        "recent_uploads": [
            {
                "id": u.id,
                "filename": u.filename,
                "file_type": u.file_type,
                "status": u.status,
                "total_events": u.total_events,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in uploads[-5:]
        ],
        "recent_events": [
            {
                "id": e.id,
                "event_name": e.event_name,
                "severity": e.severity,
                "computer_name": e.computer_name,
                "timestamp": e.timestamp.isoformat() if e.timestamp else None,
            }
            for e in recent_events
        ],
    }
