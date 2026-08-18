from pydantic import BaseModel


class IncidentReport(BaseModel):
    incident_id: str
    root_cause: str
    action_taken: str
    recovery_time_sec: int
    jobs_recovered: int
    delay_avoided_estimate: str
