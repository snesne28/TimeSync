import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Event, CalendarSettings } from '../../App';
import { format, startOfWeek, endOfWeek, addDays, isSameDay, addWeeks, subWeeks, getHours, getMinutes } from 'date-fns';

interface WeekViewProps {
  events: Event[];
  onDeleteEvent: (eventId: string) => void;
  onUpdateEvent: (eventId: string, updatedEvent: Partial<Event>) => void;
  settings: CalendarSettings;
}

export function WeekView({ events, onDeleteEvent, onUpdateEvent, settings }: WeekViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);

  const days = [];
  let day = weekStart;
  while (day <= weekEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDay = (date: Date) => {
    return events.filter(event => 
      isSameDay(event.startDate, date)
    );
  };

  const getEventPosition = (event: Event) => {
    const startHour = getHours(event.startDate);
    const startMinute = getMinutes(event.startDate);
    const endHour = getHours(event.endDate);
    const endMinute = getMinutes(event.endDate);
    
    const top = (startHour + startMinute / 60) * 60; // 60px per hour
    const height = ((endHour + endMinute / 60) - (startHour + startMinute / 60)) * 60;
    
    return { top, height };
  };

  return (
    <div className="flex-1 flex flex-col p-6 h-full"> {/* Added h-full to ensure it fills space */}
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0"> {/* flex-shrink-0 prevents header squishing */}
        <div className="flex items-center space-x-4">
          <h2>
            {format(weekStart, 'MMM d, yyyy')} - {format(weekEnd, 'MMM d')}
          </h2>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              This Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Week View Content */}
      {/* CHANGED: overflow-hidden -> overflow-y-auto to allow scrolling */}
      <div className="flex-1 flex border border-border rounded-lg overflow-y-auto bg-zinc-950">
        
        {/* Timeline Column */}
        <div className="w-16 bg-muted/30 border-r border-border">
          {/* CHANGED: Added sticky, top-0, z-20, and bg-zinc-950 */}
          <div className="h-12 border-b border-border sticky top-0 bg-zinc-950 z-20"></div>
          {hours.map(hour => (
            <div key={hour} className="h-[60px] border-b border-border flex items-start justify-center pt-1 text-xs text-muted-foreground">
              {hour === 0 ? '00:00' : `${hour.toString().padStart(2, '0')}:00`}
            </div>
          ))}
        </div>

        {/* Days Columns */}
        <div className="flex-1 grid grid-cols-7">
          {days.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div key={index} className="border-r border-border last:border-r-0">
                {/* Day Header */}
                {/* CHANGED: Added sticky, top-0, z-10. Swapped transparent bg-muted/30 for solid bg-zinc-950 */}
                <div className={`h-12 border-b border-border flex flex-col items-center justify-center text-sm sticky top-0 z-10 ${
                  isToday ? 'bg-primary text-primary-foreground' : 'bg-zinc-950'
                }`}>
                  <div>{format(day, 'EEE')}</div>
                  <div>{format(day, 'd')}</div>
                </div>

                {/* Time Slots and Events */}
                <div className="relative">
                  {hours.map(hour => (
                    <div key={hour} className="h-[60px] border-b border-border"></div>
                  ))}
                  
                  {/* Events */}
                  {dayEvents.map(event => {
                    const { top, height } = getEventPosition(event);
                    return (
                      <div
                        key={event.id}
                        className="absolute left-1 right-1 p-1 rounded text-xs cursor-pointer z-10"
                        style={{
                          top: `${top}px`,
                          height: `${Math.max(height, 20)}px`,
                          backgroundColor: `${event.color}15`,
                          color: event.color,
                          border: `1px solid ${event.color}40`
                        }}
                        onClick={() => {
                          // Logic to edit event can be added here
                        }}
                      >
                        <div className="truncate">{event.title}</div>
                        {height > 30 && event.location && (
                          <div className="truncate opacity-75">📍 {event.location}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
