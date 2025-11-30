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

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///scheduler.db")

# --- MODELS ---

class Event(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    summary: str
    start: str
    end: str
    description: Optional[str] = None

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
    except Exception:
        return []

def save_chat_log(session: Session, guest_id: str, role: str, content: str):
    try:
        log = ChatLog(user_id=guest_id, role=role, content=content, timestamp=arrow.now().isoformat())
        session.add(log)
        session.commit()
    except Exception as e:
        print(f"Warning: Could not save chat log: {e}")

# --- 4. TOOL FUNCTIONS ---
def read_events_db(session: Session, guest_id: str):
    statement = select(Event).where(Event.user_id == guest_id)
    return session.exec(statement).all()

def check_availability(date_str: str, guest_id: str, session: Session):
    events = read_events_db(session, guest_id)
    try:
        target_day = arrow.get(date_str).floor('day')
    except:
        return "Invalid date format."

    busy_list = []
    for event in events:
        start = arrow.get(event.start)
        end = arrow.get(event.end)
        if start.floor('day') == target_day:
            busy_list.append(f"{start.format('HH:mm')}-{end.format('HH:mm')}")

    if not busy_list: return f"The entire day of {date_str} is free."
    return f"Busy slots on {date_str}: {', '.join(busy_list)}."

def book_meeting(start_time_iso: str, title: str, guest_id: str, session: Session):
    try:
        start = arrow.get(start_time_iso)
    except:
        return f"Invalid time format: {start_time_iso}"
    
    new_event = Event(
        user_id=guest_id,
        summary=title,
        start=start.isoformat(),
        end=start.shift(minutes=30).isoformat(),
        description="Booked via AI"
    )
    session.add(new_event)
    session.commit()
    return f"OK. Meeting '{title}' booked for {start.format('YYYY-MM-DD HH:mm')}."

# [NEW] Delete Function
def delete_meeting(title: str, date_str: str, guest_id: str, session: Session):
    try:
        target_day = arrow.get(date_str).floor('day')
    except:
        return "Invalid date format. Please provide YYYY-MM-DD."
    
    # 1. Get all events for this user
    events = read_events_db(session, guest_id)
    
    # 2. Find matches (Same day AND similar title)
    events_to_delete = []
    for event in events:
        start = arrow.get(event.start)
        is_same_day = start.floor('day') == target_day
        is_title_match = title.lower() in event.summary.lower()
        
        if is_same_day and is_title_match:
            events_to_delete.append(event)
            
    # 3. Delete them
    if not events_to_delete:
        return f"No meeting found with title '{title}' on {date_str}."
    
    for event in events_to_delete:
        session.delete(event)
    
    session.commit()
    return f"OK. Canceled {len(events_to_delete)} meeting(s) matching '{title}'."

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
    return {"status": "alive"}

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
        description=evt.description
    )
    session.add(new_event)
    session.commit()
    return {"status": "success", "id": new_event.id}

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat_endpoint(req: ChatRequest, guest_id: str = Depends(get_current_guest_id), session: Session = Depends(get_session)):
    save_chat_log(session, guest_id, "user", req.message)
    db_history = get_chat_context(session, guest_id)

    # --- WRAPPERS ---
    def check_availability_wrapper(date_str: str):
        """Checks if there are any events on a specific date.
        Args:
            date_str: The date to check in 'YYYY-MM-DD' format.
        """
        try:
            return check_availability(date_str, guest_id, session)
        except Exception as e:
            return f"Error: {str(e)}"
        
    def book_meeting_wrapper(start_time_iso: str, title: str):
        """Books a new meeting.
        Args:
            start_time_iso: The start time in ISO 8601 format (e.g., 2023-10-27T10:00:00).
            title: The title or summary of the meeting.
        """
        try:
            return book_meeting(start_time_iso, title, guest_id, session)
        except Exception as e:
            return f"Error: {str(e)}"

    # [NEW] Delete Wrapper
    def delete_meeting_wrapper(title: str, date_str: str):
        """Cancels/Deletes a meeting.
        Args:
            title: The title or keyword of the meeting to cancel.
            date_str: The date of the meeting in 'YYYY-MM-DD' format.
        """
        try:
            return delete_meeting(title, date_str, guest_id, session)
        except Exception as e:
            return f"Error: {str(e)}"

    tools_map = {
        'check_availability': check_availability_wrapper,
        'book_meeting': book_meeting_wrapper,
        'delete_meeting': delete_meeting_wrapper # Added here!
    }
    
    now_str = arrow.now().format('YYYY-MM-DD HH:mm')
    model = genai.GenerativeModel(
        'gemini-2.5-flash', 
        tools=list(tools_map.values()),
        system_instruction=f"You are a scheduler assistant. Current time: {now_str}. Use tools to check availability, book, or cancel meetings."
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
                tool_result = "Error: Function not found."
                
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
        return {"response": f"System Error: {str(e)}"}
