import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..orchestrator import state_machine as sm

router = APIRouter(prefix="/incidents", tags=["incidents"])


class CreateIncidentRequest(BaseModel):
    service: str


def _serialize(incident) -> dict:
    return {
        "id": incident.id,
        "service": incident.service,
        "state": incident.state,
        "created_at": incident.created_at.isoformat(),
        "updated_at": incident.updated_at.isoformat(),
        "findings": json.loads(incident.findings_json) if incident.findings_json else None,
        "recommendation": json.loads(incident.recommendation_json) if incident.recommendation_json else None,
        "report": json.loads(incident.report_json) if incident.report_json else None,
        "error": incident.error,
    }


@router.post("")
def create_incident(req: CreateIncidentRequest):
    incident = sm.create_incident(req.service)
    return _serialize(incident)


@router.get("")
def list_incidents():
    return [_serialize(i) for i in sm.list_incidents()]


@router.get("/{incident_id}")
def get_incident(incident_id: str):
    incident = sm.get_incident(incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="incident not found")
    return _serialize(incident)


@router.post("/{incident_id}/approve")
def approve_incident(incident_id: str):
    incident = sm.approve_incident(incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="incident not found")
    return _serialize(incident)


@router.post("/{incident_id}/reject")
def reject_incident(incident_id: str):
    incident = sm.reject_incident(incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="incident not found")
    return _serialize(incident)
