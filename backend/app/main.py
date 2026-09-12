import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.database import engine, Base, ensure_sqlite_schema
from app.routes import tickets

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables if they do not exist on startup."""
    try:
        Base.metadata.create_all(bind=engine)
        ensure_sqlite_schema()
    except Exception as e:
        print(f"Warning: Could not connect to database on startup: {e}")
    yield

app = FastAPI(
    title="Support CRM API",
    description="Backend API for the Datastraw Technologies Support CRM System",
    version="1.0.0",
    lifespan=lifespan,
)

raw_frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
origins = [url.strip() for url in raw_frontend_url.split(",") if url.strip()]

for default_origin in ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]:
    if default_origin not in origins:
        origins.append(default_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch any unhandled exception (e.g. database connection errors)
    and return a clean JSON error response so the browser receives CORS headers.
    """
    return JSONResponse(
        status_code=500,
        content={"detail": f"Database or Server Error: {str(exc)}"},
    )

app.include_router(tickets.router)


@app.get("/")
def root():
    """Health check endpoint."""
    return {"message": "Support CRM API is running", "version": "1.0.0"}


@app.get("/health")
def health():
    """Simple health check for Railway deployment monitoring."""
    return {"status": "ok"}
