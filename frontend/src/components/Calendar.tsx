import { useState } from 'react';
import { CalendarHeader } from './CalendarHeader';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { CalendarEvent, CalendarView } from '../types';

interface CalendarProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function Calendar({ events, onEventClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('week');

  const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }

    const newDate = new Date(currentDate);
    const multiplier = direction === 'prev' ? -1 : 1;

    switch (view) {
      case 'month':
        newDate.setMonth(currentDate.getMonth() + multiplier);
        break;
      case 'week':
        newDate.setDate(currentDate.getDate() + (7 * multiplier));
        break;
      case 'day':
        newDate.setDate(currentDate.getDate() + multiplier);
        break;
    }

    setCurrentDate(newDate);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onViewChange={setView}
        onNavigate={handleNavigate}
      />
      
      <div className="flex-1 overflow-hidden">
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            events={events}
            onEventClick={onEventClick}
          />
        )}
        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            events={events}
            onEventClick={onEventClick}
          />
        )}
        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            events={events}
            onEventClick={onEventClick}
          />
        )}
      </div>
    </div>
  );
}
