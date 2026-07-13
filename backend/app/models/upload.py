from datetime import datetime

from sqlalchemy import BigInteger, Column, DateTime, Enum, ForeignKey, Integer, String

from app.core.database import Base


class Upload(Base):
    __tablename__ = "uploads"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(BigInteger)
    status = Column(Enum("pending", "parsing", "parsed", "error", name="upload_status"), default="pending")
    total_events = Column(Integer, default=0)
    parsed_events = Column(Integer, default=0)
    error_message = Column(String(2000))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
