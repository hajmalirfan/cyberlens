from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text

from app.core.database import Base


class LogEntry(Base):
    __tablename__ = "log_entries"

    id = Column(Integer, primary_key=True, index=True)
    upload_id = Column(Integer, ForeignKey("uploads.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    source_type = Column(String(50), nullable=False)
    raw_content = Column(Text, nullable=False)
    parsed_data = Column(JSON)
    line_number = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
