from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./support_crm.db"

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def seed_demo_data():
    from datetime import datetime, timedelta, timezone

    from app import models

    db = SessionLocal()
    try:
        if db.query(models.Ticket).count() > 0:
            return

        now = datetime.now(timezone.utc)
        tickets = [
            models.Ticket(
                ticket_id="TKT-001",
                customer_name="Maya Patel",
                customer_email="maya.patel@example.com",
                subject="Unable to reset password",
                description="The password reset link expires before the customer can use it.",
                status="Open",
                priority="High",
                created_at=now - timedelta(hours=3),
                updated_at=now - timedelta(hours=3),
                sla_due_at=now + timedelta(hours=5),
                notes=[models.Note(note_text="Customer has been asked to try the reset link again.")],
            ),
            models.Ticket(
                ticket_id="TKT-002",
                customer_name="Daniel Kim",
                customer_email="daniel.kim@example.com",
                subject="Invoice shows duplicate charge",
                description="Customer sees the same monthly subscription charge twice.",
                status="In Progress",
                priority="Urgent",
                created_at=now - timedelta(hours=5),
                updated_at=now - timedelta(hours=1),
                sla_due_at=now - timedelta(hours=3),
                notes=[models.Note(note_text="Billing team is reviewing the payment records.")],
            ),
            models.Ticket(
                ticket_id="TKT-003",
                customer_name="Sofia Williams",
                customer_email="sofia.williams@example.com",
                subject="Question about plan upgrade",
                description="Customer wants to understand the features included in the Pro plan.",
                status="Closed",
                priority="Medium",
                created_at=now - timedelta(days=2),
                updated_at=now - timedelta(days=1, hours=20),
                sla_due_at=now - timedelta(days=1),
                notes=[models.Note(note_text="Shared the plan comparison and upgrade instructions.")],
            ),
            models.Ticket(
                ticket_id="TKT-004",
                customer_name="Owen Garcia",
                customer_email="owen.garcia@example.com",
                subject="Export report is missing records",
                description="The CSV export contains fewer records than the dashboard total.",
                status="Open",
                priority="Low",
                created_at=now - timedelta(hours=8),
                updated_at=now - timedelta(hours=8),
                sla_due_at=now + timedelta(hours=40),
            ),
        ]
        db.add_all(tickets)
        db.commit()
    finally:
        db.close()


def ensure_sqlite_schema():
    """Add columns introduced after the initial local SQLite schema."""
    if not DATABASE_URL.startswith("sqlite"):
        return

    with engine.begin() as connection:
        columns = {column["name"] for column in inspect(connection).get_columns("tickets")}
        if columns and "sla_due_at" not in columns:
            connection.execute(text("ALTER TABLE tickets ADD COLUMN sla_due_at DATETIME"))


def get_db():
    """
    FastAPI dependency: provides a database session for each request,
    and ensures it is closed when the request is done.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
