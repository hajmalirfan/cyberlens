from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text

from app.core.database import Base


class NormalizedEvent(Base):
    __tablename__ = "normalized_events"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    upload_id = Column(Integer, ForeignKey("uploads.id"), nullable=False)
    log_entry_id = Column(Integer, ForeignKey("log_entries.id"))

    event_id = Column(String(100))
    event_name = Column(String(500))
    timestamp = Column(DateTime, nullable=False, index=True)
    source_type = Column(String(50))
    source_name = Column(String(255))
    computer_name = Column(String(255), index=True)
    user_name = Column(String(255), index=True)
    ip_address = Column(String(45), index=True)
    process_name = Column(String(500))
    process_id = Column(Integer)
    parent_process = Column(String(500))
    command_line = Column(Text)
    file_path = Column(String(1000))
    registry_key = Column(String(1000))
    network_connection = Column(JSON)
    severity = Column(String(20), default="info")
    mitre_technique_id = Column(String(50))
    mitre_technique_name = Column(String(500))
    raw_data = Column(JSON)
    hash_value = Column(String(64))
    session_id = Column(String(100))

    created_at = Column(DateTime, default=datetime.utcnow)
