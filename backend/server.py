import os
import arrow
import google.generativeai as genai
from typing import Optional, List
from fastapi import FastAPI, Header, Depends
from sqlmodel import Field, Session, SQLModel, create_engine, select
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- 1. CONFIGURATION & DATABASE ---
os.environ["GOOGLE_API_KEY"] = os.environ.get("GOOGLE_API_KEY", "") 
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

DATABASE_URL = os.environ.get("DATABASE_URL")
# --- MODELS ---
class Event(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    summary: str
    start: str
    end: str
    description: Optional[str] = None
    status: str = "confirmed"

class ChatLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    role: str
    content: str
    timestamp: str

# Create DB Engine
engine = create_engine(DATABASE_URL)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# --- 2. DEPENDENCIES ---
def get_current_guest_id(x_guest_id: str = Header(...)):
    return x_guest_id

# [NEW] Get Timezone from Header (Defaults to UTC if missing)
def get_user_timezone(x_user_timezone: str = Header("UTC")):
    return x_user_timezone

def get_session():
    with Session(engine) as session:
        yield session

# --- 3. HELPER FUNCTIONS ---
def get_chat_context(session: Session, guest_id: str, limit: int = 10):
    try:
        statement = select(ChatLog).where(ChatLog.user_id == guest_id).order_by(ChatLog.id.desc()).limit(limit)
        results = session.exec(statement).all()
        history = []
        for log in reversed(results):
            history.append({"role": log.role, "parts": [log.content]})
        return history
    except Exception as e:
        print(f" Error fetching history: {e}")
        return []

def save_chat_log(session: Session, guest_id: str, role: str, content: str):
    try:
        log = ChatLog(
            user_id=guest_id, 
            role=role, 
            content=content, 
            timestamp=arrow.now().isoformat()
        )
        session.add(log)
        session.commit()
    except Exception as e:
        print(f" Error saving chat log: {e}")

# --- 4. TOOL FUNCTIONS (Updated to accept Timezone) ---
def read_events_db(session: Session, guest_id: str):
    statement = select(Event).where(Event.user_id == guest_id)
    return session.exec(statement).all()

def check_availability(date_str: str, guest_id: str, session: Session, timezone: str):
    events = read_events_db(session, guest_id)
    try:
        # Use DYNAMIC timezone
        target_day = arrow.get(date_str).to(timezone).floor('day')
    except:
        return "Invalid date format."

    busy_list = []
    for event in events:
        # Convert DB event time to USER timezone for comparison
        start = arrow.get(event.start).to(timezone)
        end = arrow.get(event.end).to(timezone)
        
        if start.floor('day') == target_day:
            busy_list.append(f"{start.format('HH:mm')}-{end.format('HH:mm')}")

    if not busy_list: return f"The entire day of {date_str} is free."
    return f"Busy slots on {date_str} ({timezone}): {', '.join(busy_list)}."

def book_meeting(start_time_iso: str, title: str, guest_id: str, session: Session, timezone: str):
    print(f" Attempting to book: {title} at {start_time_iso} in {timezone}")
    try:
        start = arrow.get(start_time_iso)
        # Force timezone if missing
        if start.tzinfo is None:
             start = start.replace(tzinfo=timezone)
    except:
        return f"Invalid time format: {start_time_iso}"
    
    try:
        new_event = Event(
            user_id=guest_id,
            summary=title,
            start=start.isoformat(),
            end=start.shift(minutes=30).isoformat(),
            description="Booked via AI",
            status="confirmed"
        )
        session.add(new_event)
        session.commit()
        return f"OK. Meeting '{title}' booked for {start.format('YYYY-MM-DD HH:mm ZZZ')}."
    except Exception as e:
        session.rollback()
        return f"Database Error: {str(e)}"

def cancel_meetings(start_date_str: str, end_date_str: str, title_keyword: Optional[str], guest_id: str, session: Session, timezone: str):
    try:
        range_start = arrow.get(start_date_str).to(timezone).floor('day')
        range_end = arrow.get(end_date_str).to(timezone).ceil('day')
    except:
        return "Invalid date format."
    
    events = read_events_db(session, guest_id)
    events_to_delete = []
    
    for event in events:
        event_start = arrow.get(event.start).to(timezone)
        in_range = range_start <= event_start <= range_end
        
        title_match = True
        if title_keyword and title_keyword.lower() != "none":
            if title_keyword.lower() not in event.summary.lower():
                title_match = False
        
        if in_range and title_match:
            events_to_delete.append(event)
            
    if not events_to_delete:
        return f"No meetings found."
    
    for event in events_to_delete:
        session.delete(event)
    session.commit()
    return f"OK. Canceled {len(events_to_delete)} meeting(s)."

# --- 5. SERVER SETUP ---
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

@app.get("/")
def read_root():
    return {"status": "alive", "backend": "PostgreSQL"}

@app.get("/events")
def get_events(guest_id: str = Depends(get_current_guest_id), session: Session = Depends(get_session)):
    return read_events_db(session, guest_id)

class ManualEvent(SQLModel):
    summary: str
    start: str
    end: str
    description: str = ""

@app.post("/create-event")
def create_event_endpoint(evt: ManualEvent, guest_id: str = Depends(get_current_guest_id), session: Session = Depends(get_session)):
    new_event = Event(
        user_id=guest_id,
        summary=evt.summary,
        start=arrow.get(evt.start).isoformat(),
        end=arrow.get(evt.end).isoformat(),
        description=evt.description,
        status="confirmed"
    )
    session.add(new_event)
    session.commit()
    return {"status": "success", "id": new_event.id}

class ChatRequest(BaseModel):
    message: str

# [UPDATED] Chat Endpoint accepts User Timezone
@app.post("/chat")
def chat_endpoint(
    req: ChatRequest, 
    guest_id: str = Depends(get_current_guest_id),
    user_tz: str = Depends(get_user_timezone), # <--- NEW INPUT
    session: Session = Depends(get_session)
):
    db_history = get_chat_context(session, guest_id)
    save_chat_log(session, guest_id, "user", req.message)

    # --- Wrappers that inject the User's Timezone ---
    def check_availability_wrapper(date_str: str):
        """Checks availability. Args: date_str (YYYY-MM-DD)."""
        try: return check_availability(date_str, guest_id, session, user_tz)
        except Exception as e: return f"Error: {str(e)}"
        
    def book_meeting_wrapper(start_time_iso: str, title: str):
        """Books meeting. Args: start_time_iso (ISO 8601), title."""
        clean_title = title.strip()
        try: return book_meeting(start_time_iso, clean_title, guest_id, session, user_tz)
        except Exception as e: return f"Error: {str(e)}"

    def cancel_meetings_wrapper(start_date_str: str, end_date_str: str, title_keyword: str = None):
        """Cancels meetings."""
        try: return cancel_meetings(start_date_str, end_date_str, title_keyword, guest_id, session, user_tz)
        except Exception as e: return f"Error: {str(e)}"

    check_availability_wrapper.__name__ = "check_availability"
    book_meeting_wrapper.__name__ = "book_meeting"
    cancel_meetings_wrapper.__name__ = "cancel_meetings"

    tools_map = {
        'check_availability': check_availability_wrapper,
        'book_meeting': book_meeting_wrapper,
        'cancel_meetings': cancel_meetings_wrapper
    }
    
    # [CRITICAL] Calculate "Now" based on USER'S Location
    try:
        now_str = arrow.now(user_tz).format('YYYY-MM-DD HH:mm')
    except:
        # Fallback to UTC if browser sends weird timezone
        now_str = arrow.now('UTC').format('YYYY-MM-DD HH:mm')
        user_tz = "UTC"
    
    # [CRITICAL] Tell AI exactly where the user is
    system_instruction = f"""
    You are a scheduler assistant.
    User's Timezone: {user_tz}
    Current time: {now_str}.
    
    CRITICAL RULES:
    1. When user says "today", use the Current Time ({user_tz}).
    2. When booking, always infer the timezone offset for {user_tz}.
    """

    model = genai.GenerativeModel(
        'gemini-2.5-flash', 
        tools=list(tools_map.values()),
        system_instruction=system_instruction
    )
    
    chat = model.start_chat(history=db_history)
    
    try:
        response = chat.send_message(req.message)
        
        while response.parts and response.parts[0].function_call:
            fc = response.parts[0].function_call
            func_name = fc.name
            args = dict(fc.args)
            
            if func_name in tools_map:
                tool_result = tools_map[func_name](**args)
            else:
                tool_result = f"Error: Function '{func_name}' not found."

            response = chat.send_message(
                genai.protos.Content(
                    parts=[genai.protos.Part(
                        function_response=genai.protos.FunctionResponse(
                            name=func_name,
                            response={"result": tool_result}
                        )
                    )]
                )
            )
        
        save_chat_log(session, guest_id, "model", response.text)
        return {"response": response.text}

    except Exception as e:
        print(f" SYSTEM CRASH: {e}")
        return {"response": f"System Error: {str(e)}"}
