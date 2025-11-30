// frontend/src/types.ts

// 1. Export CalendarEvent
export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  color?: string;
  location?: string;
  attendees?: string[];
}

// 2. Export ChatMessage
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// 3. Export CalendarView
export type CalendarView = 'month' | 'week' | 'day' | 'table' | 'kanban' | 'gantt';

// 4. Export CalendarSettings
export interface CalendarSettings {
  showEvents: boolean;
  showHolidays: boolean;
  showLuckyDays: boolean;
}
