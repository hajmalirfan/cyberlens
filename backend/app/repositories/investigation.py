from typing import List

from sqlalchemy import select

from app.models.investigation import Investigation
from app.repositories.base import BaseRepository


class InvestigationRepository(BaseRepository[Investigation]):
    def __init__(self, db):
        super().__init__(db, Investigation)

    def get_by_project(self, project_id: int) -> List[Investigation]:
        stmt = (
            select(Investigation)
            .where(Investigation.project_id == project_id)
            .order_by(Investigation.created_at.desc())
        )
        return list(self.db.execute(stmt).scalars().all())
