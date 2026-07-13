from datetime import datetime
from typing import List, Optional

from sqlalchemy import func, or_, select

from app.models.normalized_event import NormalizedEvent
from app.repositories.base import BaseRepository


class EventRepository(BaseRepository[NormalizedEvent]):
    def __init__(self, db):
        super().__init__(db, NormalizedEvent)

    def get_by_project(self, project_id: int, skip: int = 0, limit: int = 100) -> List[NormalizedEvent]:
        stmt = (
            select(NormalizedEvent)
            .where(NormalizedEvent.project_id == project_id)
            .order_by(NormalizedEvent.timestamp.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.execute(stmt).scalars().all())

    def get_by_project_and_time(
        self, project_id: int, start: datetime, end: datetime
    ) -> List[NormalizedEvent]:
        stmt = (
            select(NormalizedEvent)
            .where(NormalizedEvent.project_id == project_id)
            .where(NormalizedEvent.timestamp.between(start, end))
            .order_by(NormalizedEvent.timestamp.asc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def search(self, project_id: int, query: str) -> List[NormalizedEvent]:
        stmt = (
            select(NormalizedEvent)
            .where(NormalizedEvent.project_id == project_id)
            .where(
                or_(
                    NormalizedEvent.computer_name.ilike(f"%{query}%"),
                    NormalizedEvent.user_name.ilike(f"%{query}%"),
                    NormalizedEvent.ip_address.ilike(f"%{query}%"),
                    NormalizedEvent.event_name.ilike(f"%{query}%"),
                    NormalizedEvent.command_line.ilike(f"%{query}%"),
                    NormalizedEvent.file_path.ilike(f"%{query}%"),
                )
            )
            .order_by(NormalizedEvent.timestamp.desc())
            .limit(100)
        )
        return list(self.db.execute(stmt).scalars().all())

    def get_stats(self, project_id: int) -> dict:
        stmt = select(func.count(NormalizedEvent.id)).where(NormalizedEvent.project_id == project_id)
        total = self.db.execute(stmt).scalar() or 0

        severity_stmt = (
            select(NormalizedEvent.severity, func.count(NormalizedEvent.id))
            .where(NormalizedEvent.project_id == project_id)
            .group_by(NormalizedEvent.severity)
        )
        severity_counts = dict(self.db.execute(severity_stmt).all())

        return {
            "total": total,
            "critical": severity_counts.get("critical", 0),
            "high": severity_counts.get("high", 0),
            "medium": severity_counts.get("medium", 0),
            "low": severity_counts.get("low", 0),
            "info": severity_counts.get("info", 0),
        }
