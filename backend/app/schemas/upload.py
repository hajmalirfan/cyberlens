from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class UploadResponse(BaseModel):
    id: int
    project_id: int
    filename: str
    file_type: str
    file_size: Optional[int]
    status: str
    total_events: int
    parsed_events: int
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class UploadListResponse(BaseModel):
    total: int
    items: list[UploadResponse]
