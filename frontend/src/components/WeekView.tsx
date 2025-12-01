// src/components/WeekView.tsx
import { CalendarEvent } from '../types';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function WeekView({ currentDate, events, onEventClick }: WeekViewProps) {
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = currentDate.getDay(); 
    const diff = currentDate.getDate() - day; 
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const weekDays = getWeekDays();
  const today = new Date();

  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getEventPosition = (event: CalendarEvent) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const top = (start.getHours() + start.getMinutes() / 60) * 60;
    const height = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * 60;
    return { top, height: Math.max(height, 30) };
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-auto relative">
      
      {/* HEADER: Sticky + Solid Background + High Z-Index */}
      <div className="sticky top-0 z-50 grid grid-cols-[80px_repeat(7,1fr)] border-b border-zinc-800 bg-zinc-900 shadow-lg">
        <div className="p-3 border-r border-zinc-800" />
        {weekDays.map(day => {
          const isToday = day.toDateString() === today.toDateString();
          return (
            <div key={day.toISOString()} className="py-3 text-center border-r border-zinc-800 last:border-r-0">
              <div className={`text-xs uppercase tracking-wider font-semibold ${isToday ? 'text-blue-400' : 'text-zinc-400'}`}>
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div
                className={`mt-1 mx-auto w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold ${
                  isToday ? 'bg-blue-600 text-white shadow-md' : 'text-white'
                }`}
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* BODY: Time Grid */}
      <div className="relative grid grid-cols-[80px_repeat(7,1fr)]">
        {/* Time Labels */}
        {hours.map(hour => (
          <div key={hour} className="contents">
            <div className="p-2 text-right text-xs font-medium text-zinc-500 border-b border-zinc-800 h-[60px] border-r border-zinc-800 bg-zinc-950">
              {formatHour(hour)}
            </div>
            {/* Grid Cells */}
            {weekDays.map((_, dayIndex) => (
              <div
                key={`${hour}-${dayIndex}`}
                className="border-r border-b border-zinc-800 min-h-[60px] relative last:border-r-0 hover:bg-zinc-900/30 transition-colors"
              />
            ))}
          </div>
        ))}

        {/* EVENTS OVERLAY */}
        {weekDays.map((day, dayIndex) => {
          const dayEvents = getEventsForDay(day);
          return (
            <div
              key={day.toISOString()}
              className="absolute inset-y-0 pointer-events-none"
              // The Fix for Alignment:
              style={{ 
                left: `calc(80px + (100% - 80px) * ${dayIndex} / 7)`, 
                width: `calc((100% - 80px) / 7)` 
              }}
            >
              {dayEvents.map(event => {
                const { top, height } = getEventPosition(event);
                return (
                  <button
                    key={event.id}
                    onClick={(e) => {
                       e.stopPropagation();
                       onEventClick(event);
                    }}
                    className="absolute left-1 right-1 rounded px-2 py-1 text-left overflow-hidden z-10 hover:brightness-110 transition-all border border-white/10 shadow-md group pointer-events-auto"
                    style={{
                      top: `${top}px`,
                      height: `${height}px`,
                      backgroundColor: event.color || '#3b82f6',
                    }}
                  >
                    <div className="text-[11px] font-bold text-white truncate leading-tight shadow-black drop-shadow-sm">
                      {event.title}
                    </div>
                    <div className="text-[10px] text-white/90 mt-0.5 font-medium">
                      {new Date(event.startTime).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
