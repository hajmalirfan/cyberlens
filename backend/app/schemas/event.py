from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class NormalizedEventResponse(BaseModel):
    id: int
    event_id: Optional[str]
    event_name: Optional[str]
    timestamp: datetime
    source_type: Optional[str]
    source_name: Optional[str]
    computer_name: Optional[str]
    user_name: Optional[str]
    ip_address: Optional[str]
    process_name: Optional[str]
    process_id: Optional[int]
    parent_process: Optional[str]
    command_line: Optional[str]
    file_path: Optional[str]
    registry_key: Optional[str]
    network_connection: Optional[dict]
    severity: str
    mitre_technique_id: Optional[str]
    mitre_technique_name: Optional[str]
    raw_data: Optional[dict]
    session_id: Optional[str]

    class Config:
        from_attributes = True


class EventSearchParams(BaseModel):
    project_id: int
    computer_name: Optional[str] = None
    user_name: Optional[str] = None
    ip_address: Optional[str] = None
    event_id: Optional[str] = None
    severity: Optional[str] = None
    mitre_technique: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    search_query: Optional[str] = None
    page: int = 1
    page_size: int = 50


class EventGroupResponse(BaseModel):
    group_key: str
    event_count: int
    events: list[NormalizedEventResponse]


class TimelineEvent(BaseModel):
    id: int
    timestamp: datetime
    event_name: str
    computer_name: str
    user_name: Optional[str]
    severity: str
    source_type: str
    description: str
    raw: dict


class TimelineResponse(BaseModel):
    project_id: int
    events: list[TimelineEvent]
    total: int
