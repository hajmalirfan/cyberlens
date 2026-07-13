from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.repositories.event import EventRepository
from app.schemas.event import TimelineEvent, TimelineResponse

router = APIRouter(prefix="/timeline", tags=["Timeline"])


@router.get("/{project_id}", response_model=TimelineResponse)
async def get_timeline(
    project_id: int,
    start_time: Optional[str] = Query(None),
    end_time: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    computer: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = EventRepository(db)
    events = repo.get_by_project(project_id, limit=1000)

    if start_time:
        try:
            start_dt = datetime.fromisoformat(start_time)
            events = [e for e in events if e.timestamp and e.timestamp >= start_dt]
        except ValueError:
            pass

    if end_time:
        try:
            end_dt = datetime.fromisoformat(end_time)
            events = [e for e in events if e.timestamp and e.timestamp <= end_dt]
        except ValueError:
            pass

    if severity:
        events = [e for e in events if e.severity == severity]

    if computer:
        events = [e for e in events if e.computer_name and computer.lower() in e.computer_name.lower()]

    timeline_events = []
    for e in events:
        timeline_events.append(TimelineEvent(
            id=e.id,
            timestamp=e.timestamp or datetime.utcnow(),
            event_name=e.event_name or "Unknown Event",
            computer_name=e.computer_name or "Unknown",
            user_name=e.user_name,
            severity=e.severity,
            source_type=e.source_type or "unknown",
            description=f"EventID: {e.event_id} | Process: {e.process_name or 'N/A'} | User: {e.user_name or 'N/A'}",
            raw={
                "event_id": e.event_id,
                "process_name": e.process_name,
                "command_line": e.command_line,
                "ip_address": e.ip_address,
                "file_path": e.file_path,
            },
        ))

    return TimelineResponse(
        project_id=project_id,
        events=timeline_events,
        total=len(timeline_events),
    )
