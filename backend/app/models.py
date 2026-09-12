from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Ticket(Base):
    """
    Represents a customer support ticket.
    ticket_id is the human-friendly ID shown to users (e.g. TKT-001).
    id is the internal auto-increment primary key.
    """
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(String, unique=True, nullable=False)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="Open")
    priority = Column(String, nullable=False, default="Medium")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    sla_due_at = Column(DateTime(timezone=True), nullable=True)

    notes = relationship("Note", back_populates="ticket", cascade="all, delete-orphan", order_by="Note.created_at")

    __table_args__ = (
        Index("ix_tickets_ticket_id", "ticket_id"),
        Index("ix_tickets_status", "status"),
    )


class Note(Base):
    """
    Internal notes added to a ticket by support staff.
    Links back to a ticket via ticket_id (the internal integer id, not TKT-001).
    """
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    note_text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    ticket = relationship("Ticket", back_populates="notes")
