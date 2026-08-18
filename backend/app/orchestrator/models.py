import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


def new_id() -> str:
    return uuid.uuid4().hex[:12]


class Incident(SQLModel, table=True):
    id: str = Field(default_factory=new_id, primary_key=True)
    service: str
    state: str = "DETECTED"  # DETECTED -> INVESTIGATING -> AWAITING_APPROVAL -> REMEDIATING -> RESOLVED | REJECTED
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    findings_json: Optional[str] = None
    recommendation_json: Optional[str] = None
    report_json: Optional[str] = None
    error: Optional[str] = None
