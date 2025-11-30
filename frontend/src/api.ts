import { v4 as uuidv4 } from 'uuid';
import type { CalendarEvent } from './types';

const API_URL = "http://localhost:8000"; // Or your Render URL

// 1. Get or Create the Guest ID
const getGuestId = () => {
  let guestId = localStorage.getItem('scheduler_guest_id');
  if (!guestId) {
    guestId = uuidv4();
    localStorage.setItem('scheduler_guest_id', guestId);
  }
  return guestId;
};

// 2. Helper for Headers
const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'X-Guest-ID': getGuestId(), // <--- THE KEY MAGIC
  };
};

// 3. Updated API Functions
export const fetchEvents = async (): Promise<CalendarEvent[]> => {
  const res = await fetch(`${API_URL}/events`, {
    method: 'GET',
    headers: getHeaders() // Send ID
  });
  const data = await res.json();
  // ... mapping logic (same as before) ...
  return data.map((e: any) => ({
      ...e,
      startTime: new Date(e.start),
      endTime: new Date(e.end)
  }));
};

export const createEvent = async (event: any) => {
  const res = await fetch(`${API_URL}/create-event`, {
    method: 'POST',
    headers: getHeaders(), // Send ID
    body: JSON.stringify({
      summary: event.title,
      start: event.startTime,
      end: event.endTime,
      description: event.description || ""
    })
  });
  return res.json();
};

// ... Update sendChatMessage similarly ...