import os
import arrow
import time
from typing import List
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from google.api_core import exceptions

# --- 1. CONFIGURATION ---
os.environ["GOOGLE_API_KEY"] = "AIzaSyCfMDIWMlQlf4ojHX6ihLHIN-tp12NOCZA" # PASTE YOUR KEY HERE
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

SCOPES = ['https://www.googleapis.com/auth/calendar']
CAL_ID = 'primary'
USER_TIMEZONE = "Asia/Kolkata" 

# --- 2. AUTHENTICATION ---
def get_calendar_service():
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    return build('calendar', 'v3', credentials=creds)

# --- 3. TOOLS ---
def check_availability(date_str: str):
    """Checks busy slots for a date (YYYY-MM-DD)."""
    service = get_calendar_service()
    try:
        start_day = arrow.get(date_str).replace(tzinfo=USER_TIMEZONE).floor('day')
        end_day = arrow.get(date_str).replace(tzinfo=USER_TIMEZONE).ceil('day')
    except:
        return "Invalid date format."
    
    body = {
        "timeMin": start_day.isoformat(),
        "timeMax": end_day.isoformat(),
        "timeZone": USER_TIMEZONE,
        "items": [{"id": CAL_ID}]
    }
    events = service.freebusy().query(body=body).execute()
    busy = events['calendars'][CAL_ID]['busy']
    
    if not busy: return f"The entire day of {date_str} is free."
    
    busy_list = []
    for slot in busy:
        start = arrow.get(slot['start']).to(USER_TIMEZONE).format('HH:mm')
        end = arrow.get(slot['end']).to(USER_TIMEZONE).format('HH:mm')
        busy_list.append(f"{start}-{end}")
        
    return f"Busy slots on {date_str}: {', '.join(busy_list)}."

def book_meeting(start_time_iso: str, title: str):
    """Books a meeting. Expects ISO 8601 format."""
    service = get_calendar_service()
    try:
        start = arrow.get(start_time_iso).to(USER_TIMEZONE)
    except:
        return "Invalid time format."
    
    event = {
        'summary': title,
        'start': {'dateTime': start.isoformat(), 'timeZone': USER_TIMEZONE},
        'end': {'dateTime': start.shift(minutes=30).isoformat(), 'timeZone': USER_TIMEZONE},
    }
    try:
        service.events().insert(calendarId=CAL_ID, body=event).execute()
        return f"OK. Meeting '{title}' booked for {start.format('YYYY-MM-DD HH:mm')}."
    except Exception as e:
        return f"Failed to book: {str(e)}"

def delete_meeting(title_keyword: str, date_str: str):
    """Deletes a meeting by title and date."""
    service = get_calendar_service()
    try:
        start_day = arrow.get(date_str).replace(tzinfo=USER_TIMEZONE).floor('day')
        end_day = arrow.get(date_str).replace(tzinfo=USER_TIMEZONE).ceil('day')
        
        events_result = service.events().list(
            calendarId=CAL_ID, timeMin=start_day.isoformat(), timeMax=end_day.isoformat(), singleEvents=True
        ).execute()
        
        events = events_result.get('items', [])
        target_event = None
        for event in events:
            if title_keyword.lower() in event.get('summary', '').lower():
                target_event = event
                break
        
        if not target_event:
            return f"I couldn't find a meeting called '{title_keyword}' on {date_str}."
            
        service.events().delete(calendarId=CAL_ID, eventId=target_event['id']).execute()
        return f"Successfully deleted '{target_event['summary']}'."
    except Exception as e:
        return f"Error deleting: {str(e)}"

# --- 4. SYSTEM BRAIN ---

tools_map = {
    'check_availability': check_availability,
    'book_meeting': book_meeting,
    'delete_meeting': delete_meeting
}

# *** MEMORY FIX: Strict Logic for Context ***
SYSTEM_INSTRUCTION = f"""
You are an intelligent Scheduler Agent in {USER_TIMEZONE}.

CRITICAL RULES FOR CONTEXT:
1. **Analyze History:** Before choosing a tool, look at the previous messages.
2. **Intent Persistence:**
   - If the user previously said "Cancel a meeting" and you asked "Which one?", and the user replies "Project meeting", THE INTENT IS STILL "CANCEL".
   - Do NOT switch to "Book Meeting" just because the user provided a title.
3. **Missing Info handling:**
   - To DELETE: You need Title AND Date. If user only gives Title, ask for Date.
   - To BOOK: You need Title AND Time.

Verify the ISO time offset is correct for {USER_TIMEZONE} before calling tools.
"""

model = genai.GenerativeModel(
    'gemini-2.5-flash', 
    tools=tools_map.values(),
    system_instruction=SYSTEM_INSTRUCTION
)

# --- 5. SERVER ENDPOINTS ---
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class ChatRequest(BaseModel):
    message: str
    history: List[dict] = []

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    # Reconstruct history for the model
    chat_history = []
    for msg in req.history:
        role = "user" if msg['role'] == 'user' else "model"
        chat_history.append({"role": role, "parts": [msg['content']]})

    # DEBUG: See what the AI sees
    # print("--- CONVERSATION HISTORY ---")
    # print(chat_history)
    
    chat = model.start_chat(history=chat_history)
    
    now = arrow.now(USER_TIMEZONE)
    context_injection = f"""
    [SYSTEM INFO]
    Current Time: {now.format('YYYY-MM-DD HH:mm:ss')}
    User Request: {req.message}
    """
    
    try:
        response = chat.send_message(context_injection)

        while response.parts and response.parts[0].function_call:
            fc = response.parts[0].function_call
            func_name = fc.name
            args = dict(fc.args)
            
            print(f"⚡ Tool Call: {func_name} | Args: {args}")
            
            if func_name in tools_map:
                try:
                    tool_result = tools_map[func_name](**args)
                except Exception as e:
                    tool_result = f"Error: {str(e)}"
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
        return {"response": f"System Error: {str(e)}"}

@app.get("/events")
def get_events():
    service = get_calendar_service()
    
    # FIX: Look back 30 days so we see recent history (like "Yesterday")
    start = arrow.now(USER_TIMEZONE).shift(days=-30).isoformat()
    # Look forward 90 days
    end = arrow.now(USER_TIMEZONE).shift(days=90).isoformat()
    
    events_result = service.events().list(
        calendarId=CAL_ID, 
        timeMin=start,      # <--- Now fetches past events too
        timeMax=end,
        singleEvents=True, 
        orderBy='startTime'
    ).execute()
    
    return events_result.get('items', [])

class ManualEvent(BaseModel):
    summary: str
    start: str
    end: str
    description: str = ""

@app.post("/create-event")
def create_event_endpoint(evt: ManualEvent):
    service = get_calendar_service()
    event_body = {
        'summary': evt.summary,
        'start': {'dateTime': arrow.get(evt.start).isoformat()},
        'end': {'dateTime': arrow.get(evt.end).isoformat()},
        'description': evt.description
    }
    service.events().insert(calendarId=CAL_ID, body=event_body).execute()
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)