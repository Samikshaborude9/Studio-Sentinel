"""Explicit state machine for the incident lifecycle:

    DETECTED -> INVESTIGATING -> AWAITING_APPROVAL -> REMEDIATING -> RESOLVED
                                                    \\-> (reject) -> REJECTED

The approval pause is modeled here in application code, not left to the LLM to
"decide to wait" — state is persisted per-incident in SQLite via SQLModel.
"""
from sqlmodel import SQLModel, Session, create_engine, select

from .models import Incident
from ..agents.investigator import investigate
from ..agents.advisor import advise
from ..agents.executor import execute
from ..schemas.findings import IncidentFindings
from ..schemas.recommendation import Recommendation
from ..schemas.report import IncidentReport

engine = create_engine("sqlite:///./incidents.db", connect_args={"check_same_thread": False})


def init_db():
    SQLModel.metadata.create_all(engine)


def create_incident(service: str) -> Incident:
    """DETECTED -> INVESTIGATING -> AWAITING_APPROVAL, all in one call (matches
    POST /incidents in the API spec: it triggers detection through to the advisor's
    recommendation in a single request)."""
    with Session(engine) as session:
        incident = Incident(service=service, state="INVESTIGATING")
        session.add(incident)
        session.commit()
        session.refresh(incident)

        try:
            findings = investigate(service)
            incident.findings_json = findings.model_dump_json()

            recommendation = advise(findings)
            incident.recommendation_json = recommendation.model_dump_json()

            incident.state = "AWAITING_APPROVAL"
        except Exception as e:  # noqa: BLE001
            incident.state = "DETECTED"
            incident.error = str(e)

        session.add(incident)
        session.commit()
        session.refresh(incident)
        return incident


def get_incident(incident_id: str) -> Incident | None:
    with Session(engine) as session:
        return session.get(Incident, incident_id)


def list_incidents() -> list[Incident]:
    with Session(engine) as session:
        return list(session.exec(select(Incident).order_by(Incident.created_at.desc())))


def approve_incident(incident_id: str) -> Incident | None:
    with Session(engine) as session:
        incident = session.get(Incident, incident_id)
        if incident is None or incident.state != "AWAITING_APPROVAL":
            return incident

        incident.state = "REMEDIATING"
        session.add(incident)
        session.commit()

        try:
            recommendation = Recommendation.model_validate_json(incident.recommendation_json)
            report = execute(incident.id, incident.service, recommendation)
            incident.report_json = report.model_dump_json()
            incident.state = "RESOLVED"
        except Exception as e:  # noqa: BLE001
            incident.error = str(e)
            incident.state = "AWAITING_APPROVAL"  # allow retry

        session.add(incident)
        session.commit()
        session.refresh(incident)
        return incident


def reject_incident(incident_id: str) -> Incident | None:
    with Session(engine) as session:
        incident = session.get(Incident, incident_id)
        if incident is None:
            return None
        incident.state = "REJECTED"
        session.add(incident)
        session.commit()
        session.refresh(incident)
        return incident
