import os
import uuid
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import allow_analyst, get_current_user
from app.models.user import User
from app.repositories.upload import UploadRepository
from app.schemas.upload import UploadResponse
from app.services.log_parser_service import LogParserService
from app.services.normalizer_service import NormalizerService

router = APIRouter(prefix="/uploads", tags=["Uploads"])


@router.post("/{project_id}", response_model=UploadResponse)
async def upload_file(
    project_id: int,
    file: UploadFile = File(...),
    user: User = Depends(allow_analyst),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    file_ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    type_map = {
        "evtx": "evtx",
        "csv": "csv",
        "json": "json",
        "txt": "txt",
        "log": "txt",
    }
    source_type = type_map.get(file_ext, "txt")

    upload_dir = os.path.join(settings.UPLOAD_DIR, str(project_id))
    os.makedirs(upload_dir, exist_ok=True)

    file_id = str(uuid.uuid4())
    safe_filename = f"{file_id}_{file.filename}"
    file_path = os.path.join(upload_dir, safe_filename)

    content = await file.read()
    file_size = len(content)

    with open(file_path, "wb") as f:
        f.write(content)

    upload_repo = UploadRepository(db)
    upload = upload_repo.create(
        project_id=project_id,
        user_id=user.id,
        filename=file.filename,
        file_path=file_path,
        file_type=source_type,
        file_size=file_size,
        status="pending",
    )

    return UploadResponse(
        id=upload.id,
        project_id=upload.project_id,
        filename=upload.filename,
        file_type=upload.file_type,
        file_size=upload.file_size,
        status=upload.status,
        total_events=upload.total_events,
        parsed_events=upload.parsed_events,
        error_message=upload.error_message,
        created_at=upload.created_at,
    )


@router.post("/{upload_id}/parse", response_model=UploadResponse)
async def parse_file(
    upload_id: int,
    user: User = Depends(allow_analyst),
    db: Session = Depends(get_db),
):
    upload_repo = UploadRepository(db)
    upload = upload_repo.get_by_id(upload_id)
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    upload_repo.update(upload_id, status="parsing")

    try:
        with open(upload.file_path, "r", errors="ignore") as f:
            content = f.read()

        parser = LogParserService()
        raw_events = parser.parse(content, upload.file_type)

        normalizer = NormalizerService()
        normalized_events = normalizer.normalize(raw_events, upload.project_id, upload.id)

        from app.repositories.event import EventRepository
        event_repo = EventRepository(db)
        for event_data in normalized_events:
            event_repo.create(**event_data)

        upload_repo.update(
            upload_id,
            status="parsed",
            total_events=len(raw_events),
            parsed_events=len(normalized_events),
        )
    except Exception as e:
        upload_repo.update(
            upload_id,
            status="error",
            error_message=str(e),
        )

    return upload_repo.get_by_id(upload_id)


@router.get("/{project_id}/list", response_model=List[UploadResponse])
async def list_uploads(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    upload_repo = UploadRepository(db)
    return upload_repo.get_by_project(project_id)
