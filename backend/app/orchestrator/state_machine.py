"""Explicit state machine for the incident lifecycle:

    DETECTED -> INVESTIGATING -> AWAITING_APPROVAL -> REMEDIATING -> RESOLVED
                                                    \\-> (reject) -> REJECTED

The approval pause is modeled here in application code, not left to the LLM to
"decide to wait" — state is persisted per-incident in a database via SQLModel.
The default remains SQLite for local development, but a Supabase/Postgres URL can be
provided through the DATABASE_URL environment variable.
"""
import os

from sqlmodel import SQLModel, Session, create_engine, select

from .models import Incident, ServiceName
from ..agents.investigator import investigate
from ..agents.advisor import advise
from ..agents.executor import execute
from ..schemas.findings import IncidentFindings
from ..schemas.recommendation import Recommendation
from ..schemas.report import IncidentReport


def _build_engine():
    database_url = os.getenv("DATABASE_URL", "sqlite:///./incidents.db")
    if database_url.startswith("postgresql://"):
        # Use psycopg 3 driver for Supabase/Postgres connections.
        database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    if database_url.startswith("postgresql+psycopg://") or database_url.startswith("postgres://"):
        return create_engine(database_url, pool_pre_ping=True)
    return create_engine(database_url, connect_args={"check_same_thread": False})


engine = _build_engine()


def init_db():
    SQLModel.metadata.create_all(engine)


def create_incident(service: ServiceName) -> Incident:
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

            if recommendation.options:
                incident.state = "AWAITING_APPROVAL"
            else:
                incident.state = "REJECTED"
                incident.error = "No active anomaly detected; remediation was not offered."
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


def approve_incident(incident_id: str, option_index: int = 0) -> Incident | None:
    with Session(engine) as session:
        incident = session.get(Incident, incident_id)
        if incident is None or incident.state != "AWAITING_APPROVAL":
            return incident

        recommendation = Recommendation.model_validate_json(incident.recommendation_json)
        if option_index >= len(recommendation.options):
            raise ValueError("invalid remediation option")

        incident.state = "REMEDIATING"
        session.add(incident)
        session.commit()

        try:
            report = execute(incident.id, incident.service, recommendation, option_index)
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
        if incident.state != "AWAITING_APPROVAL":
            return incident
        incident.state = "REJECTED"
        session.add(incident)
        session.commit()
        session.refresh(incident)
        return incident
