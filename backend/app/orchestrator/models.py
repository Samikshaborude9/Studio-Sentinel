import uuid
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field


class ServiceName(str, Enum):
    INGEST = "ingest"
    TRANSCODE = "transcode"
    RENDER = "render"
    DISTRIBUTION = "distribution"


class IncidentState(str, Enum):
    DETECTED = "DETECTED"
    INVESTIGATING = "INVESTIGATING"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    REMEDIATING = "REMEDIATING"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"


def new_id() -> str:
    return uuid.uuid4().hex[:12]


class Incident(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    service: ServiceName
    state: IncidentState = "DETECTED"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    findings_json: Optional[str] = None
    recommendation_json: Optional[str] = None
    report_json: Optional[str] = None
    error: Optional[str] = None
