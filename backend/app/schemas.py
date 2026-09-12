from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# --- Enums for validated string fields ---

class StatusEnum(str, Enum):
    open = "Open"
    in_progress = "In Progress"
    closed = "Closed"


class PriorityEnum(str, Enum):
    low = "Low"
    medium = "Medium"
    high = "High"
    urgent = "Urgent"


# --- Note schemas ---

class NoteCreate(BaseModel):
    note_text: str = Field(..., min_length=1, max_length=2000)


class NoteResponse(BaseModel):
    id: int
    ticket_id: int
    note_text: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Ticket schemas ---

class TicketCreate(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=200)
    customer_email: EmailStr
    subject: str = Field(..., min_length=1, max_length=300)
    description: str = Field(..., min_length=1, max_length=5000)
    priority: PriorityEnum = PriorityEnum.medium


class TicketUpdate(BaseModel):
    status: Optional[StatusEnum] = None
    priority: Optional[PriorityEnum] = None


class TicketResponse(BaseModel):
    """Used for the ticket list — does not include notes for performance."""
    id: int
    ticket_id: str
    customer_name: str
    customer_email: str
    subject: str
    description: str
    status: str
    priority: str
    created_at: datetime
    updated_at: datetime
    sla_due_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TicketWithNotes(TicketResponse):
    """Used for the detail view — includes all notes."""
    notes: List[NoteResponse] = []

    model_config = ConfigDict(from_attributes=True)
