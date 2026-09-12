from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/api/tickets", tags=["tickets"])


@router.post("", response_model=schemas.TicketResponse, status_code=201)
def create_ticket(ticket_data: schemas.TicketCreate, db: Session = Depends(get_db)):
    """Create a new support ticket. Status is automatically set to Open."""
    ticket = crud.create_ticket(db, ticket_data)
    return ticket


@router.get("", response_model=List[schemas.TicketResponse])
def get_tickets(
    status: Optional[str] = Query(None, description="Filter by status: Open, In Progress, Closed"),
    search: Optional[str] = Query(None, description="Search by ticket ID, name, email, or subject"),
    db: Session = Depends(get_db),
):
    """
    Return all tickets. Supports optional filtering by status and/or a search term.
    Search is handled on the backend to keep things efficient as ticket volume grows.
    """
    allowed_statuses = ["Open", "In Progress", "Closed"]
    if status and status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{status}'. Must be one of: {', '.join(allowed_statuses)}"
        )

    tickets = crud.get_tickets(db, status=status, search=search)
    return tickets


@router.get("/{ticket_id}", response_model=schemas.TicketWithNotes)
def get_ticket(ticket_id: str, db: Session = Depends(get_db)):
    """Get a single ticket by its human-friendly ID (e.g. TKT-001), including notes."""
    ticket = crud.get_ticket_by_ticket_id(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    return ticket


@router.put("/{ticket_id}", response_model=schemas.TicketResponse)
def update_ticket(ticket_id: str, update_data: schemas.TicketUpdate, db: Session = Depends(get_db)):
    """Update the status and/or priority of a ticket."""
    ticket = crud.get_ticket_by_ticket_id(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")

    updated = crud.update_ticket(db, ticket, update_data)
    return updated


@router.post("/{ticket_id}/notes", response_model=schemas.NoteResponse, status_code=201)
def add_note(ticket_id: str, note_data: schemas.NoteCreate, db: Session = Depends(get_db)):
    """Add an internal note to a ticket."""
    ticket = crud.get_ticket_by_ticket_id(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")

    note = crud.add_note(db, ticket, note_data)
    return note
