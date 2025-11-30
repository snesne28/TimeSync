import { CalendarEvent } from '../types';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function MonthView({ currentDate, events, onEventClick }: MonthViewProps) {
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const days = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  return (
    <div className="flex flex-col h-full">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-zinc-800">
        {weekDays.map(day => (
          <div key={day} className="p-3 text-center text-zinc-500">
            {day}
          </div>
        ))}
      </div>
      
      {/* Days grid */}
      <div className="grid grid-cols-7 flex-1">
        {days.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const isToday = date && date.toDateString() === today.toDateString();
          
          return (
            <div
              key={index}
              className={`border-r border-b border-zinc-800 p-2 min-h-[120px] ${
                !date ? 'bg-zinc-900/30' : ''
              }`}
            >
              {date && (
                <>
                  <div
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full mb-2 ${
                      isToday
                        ? 'bg-blue-600 text-white'
                        : 'text-zinc-300'
                    }`}
                  >
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <button
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className="w-full text-left px-2 py-1 rounded text-xs truncate hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: event.color || '#3b82f6' }}
                      >
                        {new Date(event.startTime).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })} {event.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-zinc-500 px-2">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
