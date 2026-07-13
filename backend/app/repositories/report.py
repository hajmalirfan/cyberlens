from typing import List

from sqlalchemy import select

from app.models.report import Report
from app.repositories.base import BaseRepository


class ReportRepository(BaseRepository[Report]):
    def __init__(self, db):
        super().__init__(db, Report)

    def get_by_investigation(self, investigation_id: int) -> List[Report]:
        stmt = (
            select(Report)
            .where(Report.investigation_id == investigation_id)
            .order_by(Report.created_at.desc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def get_by_project(self, project_id: int) -> List[Report]:
        stmt = (
            select(Report)
            .where(Report.project_id == project_id)
            .order_by(Report.created_at.desc())
        )
        return list(self.db.execute(stmt).scalars().all())
