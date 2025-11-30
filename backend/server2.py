import os
from typing import Optional, List
from fastapi import FastAPI, Header, Depends
from sqlmodel import Field, Session, SQLModel, create_engine, select
from fastapi.middleware.cors import CORSMiddleware
import arrow
import google.generativeai as genai

# --- 1. CONFIGURATION & DATABASE ---
# For local use: sqlite:///database.db
# For Render: Use the postgresql URL they give you
DATABASE_URL = os.environ.get("postgresql://scheduler_db_bnfu_user:5QWqqPp4Y5fo674NuPZGLPAnQ8FHlLZ4@dpg-d4m0fg24d50c73eba8rg-a/scheduler_db_bnfu", "sqlite:///scheduler.db")

class Event(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True) # <--- Links event to specific guest
    summary: str
    start: str
    end: str
    description: Optional[str] = None

# Create DB Engine
engine = create_engine(DATABASE_URL)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# --- 2. DEPENDENCY: Identify the User ---
def get_current_guest_id(x_guest_id: str = Header(...)):
    """
    FastAPI automatically looks for 'X-Guest-ID' in the request headers.
    """
    return x_guest_id

def get_session():
    with Session(engine) as session:
        yield session

# --- 3. SERVER SETUP ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# --- 4. ENDPOINTS (Now User-Specific) ---

@app.get("/events")
def get_events(
    guest_id: str = Depends(get_current_guest_id), 
    session: Session = Depends(get_session)
):
    # Only select events that belong to THIS guest_id
    statement = select(Event).where(Event.user_id == guest_id)
    results = session.exec(statement).all()
    return results

class ManualEvent(SQLModel):
    summary: str
    start: str
    end: str
    description: str = ""

@app.post("/create-event")
def create_event_endpoint(
    evt: ManualEvent, 
    guest_id: str = Depends(get_current_guest_id),
    session: Session = Depends(get_session)
):
    # Create event tagged with the guest_id
    new_event = Event(
        user_id=guest_id,
        summary=evt.summary,
        start=arrow.get(evt.start).isoformat(),
        end=arrow.get(evt.end).isoformat(),
        description=evt.description
    )
    session.add(new_event)
    session.commit()
    return {"status": "success", "id": new_event.id}