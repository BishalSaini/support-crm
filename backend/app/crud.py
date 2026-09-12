from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, timedelta, timezone

from app import models, schemas


def generate_ticket_id(db: Session) -> str:
    """
    Generate the next sequential ticket ID like TKT-001, TKT-002, etc.
    We count existing tickets and increment by 1. Padded to 3 digits.
    """
    count = db.query(models.Ticket).count()
    return f"TKT-{count + 1:03d}"


SLA_HOURS = {
    "Urgent": 2,
    "High": 8,
    "Medium": 24,
    "Low": 48,
}


def get_sla_due_at(created_at: datetime, priority: str) -> datetime:
    """Return the SLA deadline based on the ticket's creation time and priority."""
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    return created_at + timedelta(hours=SLA_HOURS[priority])


def create_ticket(db: Session, ticket_data: schemas.TicketCreate) -> models.Ticket:
    """Create a new ticket with auto-generated ticket_id and status=Open."""
    ticket_id = generate_ticket_id(db)
    now = datetime.now(timezone.utc)

    db_ticket = models.Ticket(
        ticket_id=ticket_id,
        customer_name=ticket_data.customer_name,
        customer_email=ticket_data.customer_email,
        subject=ticket_data.subject,
        description=ticket_data.description,
        priority=ticket_data.priority.value,
        status="Open",
        created_at=now,
        updated_at=now,
        sla_due_at=get_sla_due_at(now, ticket_data.priority.value),
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket


def get_tickets(db: Session, status: Optional[str] = None, search: Optional[str] = None) -> List[models.Ticket]:
    """
    Return all tickets, optionally filtered by status and/or a search term.
    Search checks ticket_id, customer_name, customer_email, and subject.
    Using ILIKE for case-insensitive matching.
    """
    query = db.query(models.Ticket)

    if status:
        query = query.filter(models.Ticket.status == status)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.Ticket.ticket_id.ilike(search_pattern),
                models.Ticket.customer_name.ilike(search_pattern),
                models.Ticket.customer_email.ilike(search_pattern),
                models.Ticket.subject.ilike(search_pattern),
            )
        )

    return query.order_by(models.Ticket.created_at.desc()).all()


def get_ticket_by_ticket_id(db: Session, ticket_id: str) -> Optional[models.Ticket]:
    """Fetch a single ticket by its human-friendly ID (e.g. TKT-001)."""
    return db.query(models.Ticket).filter(models.Ticket.ticket_id == ticket_id).first()


def update_ticket(db: Session, ticket: models.Ticket, update_data: schemas.TicketUpdate) -> models.Ticket:
    """Update status and/or priority on an existing ticket."""
    if update_data.status is not None:
        ticket.status = update_data.status.value
    if update_data.priority is not None:
        ticket.priority = update_data.priority.value
        ticket.sla_due_at = get_sla_due_at(ticket.created_at, update_data.priority.value)

    ticket.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ticket)
    return ticket


def add_note(db: Session, ticket: models.Ticket, note_data: schemas.NoteCreate) -> models.Note:
    """Add an internal note to a ticket."""
    db_note = models.Note(
        ticket_id=ticket.id,
        note_text=note_data.note_text,
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note
