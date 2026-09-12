# Support CRM System

A full-stack Customer Support Ticket Management System built as a hiring assignment for **Datastraw Technologies**.

---

## Overview

Support CRM is an internal tool designed for support staff to manage customer support tickets. Staff can create tickets, track their status and priority, add internal notes, and search/filter across all tickets.

The application is built with a clean three-layer architecture: a React frontend, a FastAPI REST backend, and a local SQLite database.

---

## Features

- **Create Tickets** — capture customer details, issue description, and initial priority
- **Ticket Listing** — view all tickets in a clean, sortable table
- **Search** — search by ticket ID, customer name, email, or subject (backend-powered, debounced)
- **Status Filtering** — filter by Open / In Progress / Closed
- **Ticket Details** — view complete ticket information including timestamps
- **Status & Priority Updates** — change ticket status and priority with a single save
- **Internal Notes** — add chronological internal notes to any ticket
- **SLA Tracking** — priority-based response deadlines with live countdowns and overdue filtering
- **Priority-Based Triage** — Low / Medium / High / Urgent badges for quick visual identification
- **Human-Friendly Ticket IDs** — auto-generated IDs like `TKT-001`, `TKT-002`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| HTTP | Fetch API |
| Backend | FastAPI (Python) |
| Validation | Pydantic |
| ORM | SQLAlchemy |
| Database | SQLite |
| Dev Server | Uvicorn |

---

## Architecture

```
         USER BROWSER
              │
              ▼
   React + Vite (Vercel)
   Tailwind CSS
              │
        HTTP / JSON
              │
              ▼
   FastAPI REST API (Railway)
              │
         SQLAlchemy ORM
              │
              ▼
        SQLite database file
```

---

## Database Schema

### tickets

```
id              INTEGER    Primary key (internal, auto-increment)
ticket_id       VARCHAR    Human-friendly unique ID (e.g. TKT-001)
customer_name   VARCHAR    Customer's full name
customer_email  VARCHAR    Customer's email address
subject         VARCHAR    Short summary of the issue
description     TEXT       Full description of the issue
status          VARCHAR    Open | In Progress | Closed
priority        VARCHAR    Low | Medium | High | Urgent
created_at      TIMESTAMP  When the ticket was created
updated_at      TIMESTAMP  When the ticket was last modified
```

**Indexes on:** `ticket_id` (unique lookups), `status` (filtering)

### notes

```
id          INTEGER    Primary key
ticket_id   INTEGER    Foreign key → tickets.id
note_text   TEXT       Content of the internal note
created_at  TIMESTAMP  When the note was added
```

**Relationship:** One ticket can have many notes (1:N). Notes are always displayed in chronological order.

---

## API Documentation

### Base URL

Development: `http://localhost:8000`  
Production: Your Railway backend URL

---

### `POST /api/tickets` — Create a Ticket

**Request body:**
```json
{
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "subject": "Unable to login",
  "description": "Customer cannot access their account.",
  "priority": "High"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "ticket_id": "TKT-001",
  "status": "Open",
  "priority": "High",
  "created_at": "...",
  "updated_at": "..."
}
```

---

### `GET /api/tickets` — List Tickets

Supports optional query parameters:

| Parameter | Example | Description |
|---|---|---|
| `status` | `Open` | Filter by status |
| `search` | `john` | Search name, email, subject, ticket ID |

Examples:
```
GET /api/tickets
GET /api/tickets?status=Open
GET /api/tickets?search=payment
GET /api/tickets?status=Open&search=john
```

**Response:** `200 OK` — array of ticket objects

---

### `GET /api/tickets/{ticket_id}` — Get a Ticket

```
GET /api/tickets/TKT-001
```

**Response:** `200 OK` — ticket object including `notes` array  
**Error:** `404 Not Found` if ticket doesn't exist

---

### `PUT /api/tickets/{ticket_id}` — Update a Ticket

```json
{
  "status": "In Progress",
  "priority": "Urgent"
}
```

Both fields are optional — send only the ones you want to change.

**Response:** `200 OK` — updated ticket object

Tickets receive an SLA deadline based on priority: Urgent (2 hours), High (8 hours), Medium (24 hours), and Low (48 hours). Closed tickets are marked as resolved, and active overdue tickets can be filtered from the ticket list.

---

### `POST /api/tickets/{ticket_id}/notes` — Add a Note

```json
{
  "note_text": "Customer contacted support. Password reset sent."
}
```

**Response:** `201 Created` — new note object

---

## Local Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- No external database account is required; SQLite stores data in `backend/support_crm.db`

---

### Backend Setup

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate it (Windows)
venv\Scripts\activate

# Activate it (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables if needed
copy .env.example .env
# SQLite is used automatically; FRONTEND_URL only controls CORS

# Start the development server
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.  
Interactive API docs: `http://localhost:8000/docs`

---

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
copy .env.example .env
# Edit .env — set VITE_API_URL=http://localhost:8000

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## Deployment

### 1. Backend
### 2. Railway (Backend)

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select the `backend/` directory as the root
4. Set `FRONTEND_URL` to your Vercel frontend URL (after deploying frontend)
5. Set the start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

---

### 2. Vercel (Frontend)

1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Set the root directory to `frontend/`
3. Set environment variable:
   - `VITE_API_URL` — your Railway backend URL
4. Deploy

---

### 3. CORS

After deploying both services:
- Update `FRONTEND_URL` in Railway to your Vercel URL (e.g. `https://support-crm.vercel.app`)
- This ensures CORS only allows requests from your actual frontend, not arbitrary origins

---

## Architecture Decisions

| Decision | Reason |
|---|---|
| React | Industry-standard UI library; component model keeps code modular and readable |
| Vite | Fast dev server and build tool for React projects |
| Tailwind CSS | Utility-first CSS; keeps styles co-located with components without writing separate CSS files |
| FastAPI | Modern Python framework with automatic validation (Pydantic), auto-generated docs, and excellent performance |
| SQLite | Zero-configuration local database; keeps the assignment self-contained |
| SQLAlchemy | Standard Python ORM; readable query syntax, avoids raw SQL for simple operations |
| REST | Simple, stateless, well-understood API style — right fit for CRUD-heavy operations |
| Separate frontend/backend | Independent deployment, clear separation of concerns, protects database from direct browser access |
| Two tables only | Assignment explicitly favors simplicity; tickets and notes cover all requirements |
| Priority as bonus feature | Directly useful for support staff; easy to understand and implement well |

---

## Database Indexing

Two indexes are applied:
- `ix_tickets_ticket_id` — supports fast `WHERE ticket_id = 'TKT-001'` lookups
- `ix_tickets_status` — supports fast `WHERE status = 'Open'` filtering

As ticket volume grows to tens of thousands of records, these indexes prevent full table scans on the most common query patterns. A composite index on `(status, created_at)` could be added later for sorted filtered queries.

---

## Request Flow

```
User Action (e.g. "Create Ticket")
        │
        ▼
React form → validates client-side
        │
        ▼
HTTP POST /api/tickets (JSON)
        │
        ▼
FastAPI receives request
        │
        ▼
Pydantic validates fields (email, required, enums)
        │
        ▼
crud.create_ticket() generates TKT-NNN, sets status=Open
        │
        ▼
SQLAlchemy ORM executes INSERT
        │
        ▼
SQLite stores record in `backend/support_crm.db`
        │
        ▼
FastAPI returns 201 + ticket JSON
        │
        ▼
React receives response → navigates to ticket detail page
```

---

## Future Improvements

The current implementation intentionally focuses on the assignment's core requirements. In a production system, the following could be added:

- **Authentication** — login system for support agents
- **Role-based access** — agent vs. admin vs. customer permissions
- **Support agents** — assign tickets to specific agents
- **Ticket assignment** — track which agent owns a ticket
- **Pagination** — for handling thousands of tickets efficiently
- **Database indexes** — composite indexes for complex filter+sort queries
- **File attachments** — screenshots or documents attached to tickets
- **Email notifications** — notify customers when ticket status changes
- **SLA tracking** — flag tickets that breach response time targets
- **Audit history** — log every status and priority change with timestamps
- **Customer portal** — public-facing view for customers to check ticket status
- **Multiple support channels** — email, chat, web form integrations

---

## Project Structure

```
support-crm/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          ← FastAPI app + CORS + startup
│   │   ├── database.py      ← SQLAlchemy engine + session
│   │   ├── models.py        ← ORM models (Ticket, Note)
│   │   ├── schemas.py       ← Pydantic schemas + enums
│   │   ├── crud.py          ← Database operations
│   │   └── routes/
│   │       ├── __init__.py
│   │       └── tickets.py   ← API endpoints
│   │
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── PriorityBadge.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   ├── pages/
│   │   │   ├── TicketListPage.jsx
│   │   │   ├── CreateTicketPage.jsx
│   │   │   └── TicketDetailPage.jsx
│   │   ├── services/
│   │   │   └── api.js       ← All API calls in one place
│   │   ├── App.jsx          ← Routes
│   │   ├── main.jsx         ← React entry point
│   │   └── index.css        ← Global styles + Tailwind
│   │
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
│
├── .gitignore
└── README.md
```
# support-crm
