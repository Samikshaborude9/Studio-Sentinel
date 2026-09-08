import uuid
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field, Column, String


class ServiceName(str, Enum):
    INGEST = "ingest"
    TRANSCODE = "transcode"
    RENDER = "render"
    DISTRIBUTION = "distribution"

    @classmethod
    def _missing_(cls, value):
        if isinstance(value, str):
            for member in cls:
                if member.value.lower() == value.lower() or member.name.lower() == value.lower():
                    return member
        return None


class IncidentState(str, Enum):
    DETECTED = "DETECTED"
    INVESTIGATING = "INVESTIGATING"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    REMEDIATING = "REMEDIATING"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"

    @classmethod
    def _missing_(cls, value):
        if isinstance(value, str):
            for member in cls:
                if member.value.upper() == value.upper() or member.name.upper() == value.upper():
                    return member
        return None


def new_id() -> str:
    return uuid.uuid4().hex[:12]


class Incident(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    service: ServiceName = Field(sa_column=Column(String, nullable=False))
    state: IncidentState = Field(default=IncidentState.DETECTED, sa_column=Column(String, nullable=False))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    findings_json: Optional[str] = None
    recommendation_json: Optional[str] = None
    report_json: Optional[str] = None
    error: Optional[str] = None
