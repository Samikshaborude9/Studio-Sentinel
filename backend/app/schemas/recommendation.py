from typing import Literal
from pydantic import BaseModel


class RemediationOption(BaseModel):
    action_id: Literal["rollback_service", "restart_service"]
    action: str
    risk_level: Literal["low", "medium", "high"]
    expected_recovery_min: int


class Recommendation(BaseModel):
    root_cause: str
    confidence_pct: int
    options: list[RemediationOption]
    impact_if_ignored: str  # computed from queue-depth trend in code, not LLM-invented
    impact_if_acted: str
