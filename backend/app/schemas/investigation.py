from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class InvestigationCreate(BaseModel):
    project_id: int
    title: str


class InvestigationResponse(BaseModel):
    id: int
    project_id: int
    title: str
    status: str
    attack_type: Optional[str]
    attack_score: Optional[int]
    summary: Optional[str]
    timeline: Optional[list]
    evidence: Optional[list]
    affected_systems: Optional[list]
    mitre_mapping: Optional[list]
    recommendations: Optional[list]
    confidence_score: Optional[int]
    started_at: datetime
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class InvestigationSummary(BaseModel):
    id: int
    project_id: int
    title: str
    status: str
    attack_type: Optional[str]
    attack_score: Optional[int]
    confidence_score: Optional[int]
    created_at: datetime
    completed_at: Optional[datetime]


class ChatRequest(BaseModel):
    investigation_id: int
    message: str


class ChatResponse(BaseModel):
    response: str
    confidence: float
    evidence: list[dict]
    timestamp: datetime


class ReportResponse(BaseModel):
    id: int
    investigation_id: int
    title: str
    report_type: str
    executive_summary: Optional[str]
    technical_summary: Optional[str]
    pdf_path: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
