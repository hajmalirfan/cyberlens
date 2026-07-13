from typing import List

from sqlalchemy import select

from app.models.project import Project
from app.repositories.base import BaseRepository


class ProjectRepository(BaseRepository[Project]):
    def __init__(self, db):
        super().__init__(db, Project)

    def get_by_owner(self, owner_id: int) -> List[Project]:
        stmt = select(Project).where(Project.owner_id == owner_id)
        return list(self.db.execute(stmt).scalars().all())
