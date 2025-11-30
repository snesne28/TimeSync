import { CalendarEvent } from '../types';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function DayView({ currentDate, events, onEventClick }: DayViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDay = () => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === currentDate.toDateString();
    });
  };

  const getEventPosition = (event: CalendarEvent) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const top = (start.getHours() + start.getMinutes() / 60) * 80;
    const height = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * 80;
    return { top, height: Math.max(height, 40) };
  };

  const dayEvents = getEventsForDay();

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="relative">
        {hours.map(hour => (
          <div key={hour} className="flex border-b border-zinc-800">
            <div className="w-20 p-3 text-right text-xs text-zinc-500">
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>
            <div className="flex-1 min-h-[80px] border-l border-zinc-800 relative" />
          </div>
        ))}

        {/* Events overlay */}
        <div className="absolute inset-0 left-20 pointer-events-none">
          {dayEvents.map(event => {
            const { top, height } = getEventPosition(event);
            return (
              <button
                key={event.id}
                onClick={() => onEventClick(event)}
                className="absolute left-2 right-2 rounded-lg p-3 text-left pointer-events-auto hover:opacity-80 transition-opacity"
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  backgroundColor: event.color || '#3b82f6',
                }}
              >
                <div className="truncate">{event.title}</div>
                <div className="text-sm opacity-90 mt-1">
                  {new Date(event.startTime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })} - {new Date(event.endTime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </div>
                {event.description && (
                  <div className="text-xs opacity-75 mt-1 line-clamp-2">
                    {event.description}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
