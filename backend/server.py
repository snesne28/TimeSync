import os
import arrow
import google.generativeai as genai
from typing import Optional, List
from fastapi import FastAPI, Header, Depends
from sqlmodel import Field, Session, SQLModel, create_engine, select
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel # Needed for ChatRequest

# --- 1. CONFIGURATION & DATABASE ---
# Get API Key from Environment
os.environ["GOOGLE_API_KEY"] = os.environ.get("GOOGLE_API_KEY", "") 
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

# Database Connection (Render or Local)
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///scheduler.db")

# Define the Event Model
class Event(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True) # Links event to a specific guest
    summary: str
    start: str
    end: str
    description: Optional[str] = None
    status: str = "confirmed"

# Create DB Engine
engine = create_engine(DATABASE_URL)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

# --- 2. DEPENDENCIES ---
def get_current_guest_id(x_guest_id: str = Header(...)):
    """Reads the 'X-Guest-ID' header from the frontend."""
    return x_guest_id

def get_session():
    with Session(engine) as session:
        yield session

# --- 3. TOOL FUNCTIONS (Updated for Database) ---
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
        return "Invalid time format."
    
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

# --- 4. SERVER SETUP ---
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

# --- 5. ENDPOINTS ---

@app.get("/events")
def get_events(
    guest_id: str = Depends(get_current_guest_id), 
    session: Session = Depends(get_session)
):
    return read_events_db(session, guest_id)

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
    history: List[dict] = []

@app.post("/chat")
def chat_endpoint(
    req: ChatRequest, 
    guest_id: str = Depends(get_current_guest_id),
    session: Session = Depends(get_session)
):
    # Wrapper functions to inject the guest_id and session into the tools
    def check_availability_wrapper(date_str):
        return check_availability(date_str, guest_id, session)
        
    def book_meeting_wrapper(start_time_iso, title):
        return book_meeting(start_time_iso, title, guest_id, session)

    tools_map = {
        'check_availability': check_availability_wrapper,
        'book_meeting': book_meeting_wrapper
    }
    
    # Initialize Model with tools
    model = genai.GenerativeModel(
        'gemini-1.5-flash', 
        tools=tools_map.values(),
        system_instruction=f"You are a scheduler assistant. Current time: {arrow.now().format('YYYY-MM-DD HH:mm')}. Use the tools to check availability or book meetings."
    )
    
    chat = model.start_chat(history=req.history)
    try:
        response = chat.send_message(req.message)
        
        # Handle Function Calls
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
        return {"response": response.text}
    except Exception as e:
        return {"response": f"Error: {str(e)}"}

@app.get("/")
def read_root():
    return {"status": "alive"}
