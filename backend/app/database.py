from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./support_crm.db"

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


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
