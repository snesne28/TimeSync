export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  color?: string;
  location?: string; // Added location
  attendees?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type CalendarView = 'month' | 'week' | 'day' | 'table' | 'kanban' | 'gantt';

// Add this interface to fix the error!
export interface CalendarSettings {
  showEvents: boolean;
  showHolidays: boolean;
  showLuckyDays: boolean;
}