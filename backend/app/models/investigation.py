from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, JSON, String, Text

from app.core.database import Base


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(500), nullable=False)
    status = Column(Enum("in_progress", "completed", "reviewed", name="investigation_status"), default="in_progress")
    attack_type = Column(String(255))
    attack_score = Column(Integer)
    summary = Column(Text)
    timeline = Column(JSON)
    evidence = Column(JSON)
    affected_systems = Column(JSON)
    mitre_mapping = Column(JSON)
    recommendations = Column(JSON)
    confidence_score = Column(Integer)
    raw_llm_response = Column(JSON)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
