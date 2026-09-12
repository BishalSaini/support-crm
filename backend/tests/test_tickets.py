import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

from sqlalchemy.pool import StaticPool

# Use an in-memory SQLite database with StaticPool for fast isolated testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    """Create fresh tables before each test and drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


client = TestClient(app, raise_server_exceptions=True)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_create_ticket_success():
    payload = {
        "customer_name": "John Doe",
        "customer_email": "john@example.com",
        "subject": "Unable to login",
        "description": "Customer cannot access their account.",
        "priority": "High",
    }
    response = client.post("/api/tickets", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["ticket_id"] == "TKT-001"
    assert data["customer_name"] == "John Doe"
    assert data["status"] == "Open"
    assert data["priority"] == "High"
    assert "created_at" in data
    assert "updated_at" in data
    assert "sla_due_at" in data
    assert data["sla_due_at"] is not None


def test_create_ticket_default_priority():
    payload = {
        "customer_name": "Jane Smith",
        "customer_email": "jane@example.com",
        "subject": "Billing inquiry",
        "description": "Question about recent invoice.",
    }
    response = client.post("/api/tickets", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["priority"] == "Medium"


def test_create_ticket_invalid_email():
    payload = {
        "customer_name": "John Doe",
        "customer_email": "not-an-email",
        "subject": "Unable to login",
        "description": "Customer cannot access account.",
    }
    response = client.post("/api/tickets", json=payload)
    assert response.status_code == 422


def test_sequential_ticket_ids():
    payload1 = {
        "customer_name": "Alice",
        "customer_email": "alice@example.com",
        "subject": "First issue",
        "description": "Details 1",
    }
    payload2 = {
        "customer_name": "Bob",
        "customer_email": "bob@example.com",
        "subject": "Second issue",
        "description": "Details 2",
    }
    r1 = client.post("/api/tickets", json=payload1)
    r2 = client.post("/api/tickets", json=payload2)
    assert r1.json()["ticket_id"] == "TKT-001"
    assert r2.json()["ticket_id"] == "TKT-002"


def test_get_tickets_and_filtering():
    # Create two tickets with different statuses and names
    client.post("/api/tickets", json={
        "customer_name": "John Doe",
        "customer_email": "john@example.com",
        "subject": "Password reset",
        "description": "Reset needed",
        "priority": "High",
    })
    client.post("/api/tickets", json={
        "customer_name": "Sarah Connor",
        "customer_email": "sarah@example.com",
        "subject": "Payment failed",
        "description": "Card declined",
        "priority": "Urgent",
    })

    # Update second ticket to In Progress
    client.put("/api/tickets/TKT-002", json={"status": "In Progress"})

    # Test GET all
    r = client.get("/api/tickets")
    assert r.status_code == 200
    assert len(r.json()) == 2

    # Test status filter
    r_open = client.get("/api/tickets?status=Open")
    assert len(r_open.json()) == 1
    assert r_open.json()[0]["ticket_id"] == "TKT-001"

    r_progress = client.get("/api/tickets?status=In Progress")
    assert len(r_progress.json()) == 1
    assert r_progress.json()[0]["ticket_id"] == "TKT-002"

    # Test search by name
    r_search = client.get("/api/tickets?search=sarah")
    assert len(r_search.json()) == 1
    assert r_search.json()[0]["ticket_id"] == "TKT-002"

    # Test search by ticket ID
    r_search_id = client.get("/api/tickets?search=TKT-001")
    assert len(r_search_id.json()) == 1
    assert r_search_id.json()[0]["customer_name"] == "John Doe"

    # Test combined status + search
    r_combined = client.get("/api/tickets?status=In Progress&search=sarah")
    assert len(r_combined.json()) == 1

    r_combined_empty = client.get("/api/tickets?status=Closed&search=sarah")
    assert len(r_combined_empty.json()) == 0


def test_get_ticket_by_id_and_notes():
    client.post("/api/tickets", json={
        "customer_name": "John Doe",
        "customer_email": "john@example.com",
        "subject": "Login issue",
        "description": "Cannot log in.",
    })

    # Get single ticket
    r = client.get("/api/tickets/TKT-001")
    assert r.status_code == 200
    assert r.json()["ticket_id"] == "TKT-001"
    assert r.json()["notes"] == []

    # Add note
    r_note = client.post("/api/tickets/TKT-001/notes", json={
        "note_text": "Customer contacted. Reset link sent."
    })
    assert r_note.status_code == 201
    assert r_note.json()["note_text"] == "Customer contacted. Reset link sent."

    # Get single ticket again — note should be included
    r_updated = client.get("/api/tickets/TKT-001")
    assert len(r_updated.json()["notes"]) == 1
    assert r_updated.json()["notes"][0]["note_text"] == "Customer contacted. Reset link sent."


def test_update_ticket_status_and_priority():
    client.post("/api/tickets", json={
        "customer_name": "John Doe",
        "customer_email": "john@example.com",
        "subject": "Issue",
        "description": "Desc",
        "priority": "Low",
    })

    r = client.put("/api/tickets/TKT-001", json={
        "status": "Closed",
        "priority": "Urgent",
    })
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "Closed"
    assert data["priority"] == "Urgent"
    assert data["sla_due_at"] is not None


def test_404_not_found():
    r_get = client.get("/api/tickets/TKT-999")
    assert r_get.status_code == 404

    r_put = client.put("/api/tickets/TKT-999", json={"status": "Closed"})
    assert r_put.status_code == 404

    r_note = client.post("/api/tickets/TKT-999/notes", json={"note_text": "Test"})
    assert r_note.status_code == 404
