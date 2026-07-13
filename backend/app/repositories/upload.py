from typing import List, Optional

from sqlalchemy import select

from app.models.upload import Upload
from app.repositories.base import BaseRepository


class UploadRepository(BaseRepository[Upload]):
    def __init__(self, db):
        super().__init__(db, Upload)

    def get_by_project(self, project_id: int) -> List[Upload]:
        stmt = select(Upload).where(Upload.project_id == project_id).order_by(Upload.created_at.desc())
        return list(self.db.execute(stmt).scalars().all())
