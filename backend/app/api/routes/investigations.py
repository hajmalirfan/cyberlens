from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db, get_neo4j
from app.core.dependencies import allow_analyst, get_current_user
from app.models.user import User
from app.schemas.investigation import (
    ChatRequest,
    ChatResponse,
    InvestigationCreate,
    InvestigationResponse,
    InvestigationSummary,
    ReportResponse,
)
from app.services.graph_service import GraphService
from app.services.investigation_service import InvestigationService
from app.services.report_service import ReportService

router = APIRouter(prefix="/investigations", tags=["Investigations"])


@router.post("/", response_model=InvestigationResponse)
async def create_investigation(
    data: InvestigationCreate,
    user: User = Depends(allow_analyst),
    db: Session = Depends(get_db),
):
    service = InvestigationService(db)
    investigation = await service.create_investigation(
        project_id=data.project_id,
        user_id=user.id,
        title=data.title,
    )
    return investigation


@router.post("/{investigation_id}/run", response_model=InvestigationResponse)
async def run_investigation(
    investigation_id: int,
    user: User = Depends(allow_analyst),
    db: Session = Depends(get_db),
):
    neo4j = get_neo4j()
    service = InvestigationService(db, neo4j)
    try:
        investigation = await service.run_investigation(investigation_id)
        return investigation
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{investigation_id}", response_model=InvestigationResponse)
async def get_investigation(
    investigation_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = InvestigationService(db)
    investigation = service.get_investigation(investigation_id)
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return investigation


@router.get("/project/{project_id}", response_model=List[InvestigationSummary])
async def list_investigations(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = InvestigationService(db)
    investigations = service.list_investigations(project_id)
    return [
        InvestigationSummary(
            id=inv.id,
            project_id=inv.project_id,
            title=inv.title,
            status=inv.status,
            attack_type=inv.attack_type,
            attack_score=inv.attack_score,
            confidence_score=inv.confidence_score,
            created_at=inv.created_at,
            completed_at=inv.completed_at,
        )
        for inv in investigations
    ]


@router.post("/{investigation_id}/chat", response_model=ChatResponse)
async def chat_investigation(
    investigation_id: int,
    data: ChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = InvestigationService(db)
    try:
        result = await service.chat_with_ai(
            investigation_id=investigation_id,
            message=data.message,
        )
        return ChatResponse(
            response=result.get("answer", "No response"),
            confidence=result.get("confidence", 0),
            evidence=result.get("evidence", []),
            timestamp=result.get("timestamp", ""),
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/graph/{project_id}", response_model=dict)
async def get_attack_graph(
    project_id: int,
    user: User = Depends(get_current_user),
):
    neo4j = get_neo4j()
    service = GraphService(neo4j)
    return service.get_graph(project_id)


@router.get("/graph/{project_id}/paths", response_model=List)
async def get_attack_paths(
    project_id: int,
    user: User = Depends(get_current_user),
):
    neo4j = get_neo4j()
    service = GraphService(neo4j)
    return service.get_attack_path(project_id)


@router.post("/{investigation_id}/report", response_model=ReportResponse)
async def generate_report(
    investigation_id: int,
    user: User = Depends(allow_analyst),
    db: Session = Depends(get_db),
):
    service = InvestigationService(db)
    investigation = service.get_investigation(investigation_id)
    if not investigation:
        raise HTTPException(status_code=404, detail="Investigation not found")

    report_service = ReportService(db)
    report = report_service.generate_report(investigation, user.id)
    return report


@router.get("/{investigation_id}/reports", response_model=List[ReportResponse])
async def list_reports(
    investigation_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report_service = ReportService(db)
    return report_service.get_reports_by_investigation(investigation_id)
