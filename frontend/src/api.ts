import { v4 as uuidv4 } from 'uuid';
import { CalendarEvent } from './types';

// IMPORTANT: Change this to your Render URL for production!
const API_URL = "https://timesync-09k8.onrender.com"; 

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
    'X-Guest-ID': getGuestId(), // This ensures every request is for THIS user
  };
};

// 3. API Functions

export const fetchEvents = async (): Promise<CalendarEvent[]> => {
  const res = await fetch(`${API_URL}/events`, {
    method: 'GET',
    headers: getHeaders()
  });
  const data = await res.json();
  
  return data.map((e: any) => ({
      id: e.id,
      title: e.summary, // FIX: Map 'summary' (DB) to 'title' (Frontend)
      startTime: new Date(e.start),
      endTime: new Date(e.end),
      description: e.description || "",
      color: '#3b82f6'
  }));
};

export const createEvent = async (event: any) => {
  const res = await fetch(`${API_URL}/create-event`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      summary: event.title, // Backend expects 'summary'
      start: event.startTime,
      end: event.endTime,
      description: event.description || ""
    })
  });
  return res.json();
};

export const sendChatMessage = async (message: string, history: any[]) => {
  const res = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: getHeaders(), // FIX: Chat now needs Guest ID too!
    body: JSON.stringify({ message, history })
  });
  const data = await res.json();
  return data.response;
};

