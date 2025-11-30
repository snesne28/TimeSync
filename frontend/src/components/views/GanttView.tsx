import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Event } from '../../App';
import { format, startOfWeek, addDays, addWeeks, subWeeks, differenceInDays, isSameDay } from 'date-fns';

interface GanttViewProps {
  events: Event[];
  onDeleteEvent: (eventId: string) => void;
  onUpdateEvent: (eventId: string, updatedEvent: Partial<Event>) => void;
}

export function GanttView({ events, onDeleteEvent, onUpdateEvent }: GanttViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewWeeks, setViewWeeks] = useState(4); // Show 4 weeks

  const weekStart = startOfWeek(currentDate);
  const totalDays = viewWeeks * 7;
  
  const days = useMemo(() => {
    const result = [];
    for (let i = 0; i < totalDays; i++) {
      result.push(addDays(weekStart, i));
    }
    return result;
  }, [weekStart, totalDays]);

  const weeks = useMemo(() => {
    const result = [];
    for (let i = 0; i < viewWeeks; i++) {
      result.push(addWeeks(weekStart, i));
    }
    return result;
  }, [weekStart, viewWeeks]);

  // Group events by category
  const groupedEvents = useMemo(() => {
    const groups: { [category: string]: Event[] } = {};
    events.forEach(event => {
      if (!groups[event.category]) {
        groups[event.category] = [];
      }
      groups[event.category].push(event);
    });
    return groups;
  }, [events]);

  const categories = Object.keys(groupedEvents).sort();

  const getEventBarStyle = (event: Event) => {
    const eventStart = new Date(event.startDate);
    const eventStartDay = Math.max(0, differenceInDays(eventStart, weekStart));
    const eventDuration = Math.max(1, differenceInDays(event.endDate, event.startDate) || 1);
    
    // If event is within the view range
    if (eventStartDay < totalDays && eventStartDay >= 0) {
      const left = (eventStartDay / totalDays) * 100;
      const width = Math.min((eventDuration / totalDays) * 100, 100 - left);
      
      return {
        left: `${left}%`,
        width: `${width}%`,
        backgroundColor: `${event.color}20`,
        borderColor: event.color,
      };
    }
    
    return null;
  };

  return (
    <div className="flex-1 flex flex-col p-6">
      {/* Gantt Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2>Gantt View</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subWeeks(currentDate, viewWeeks))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addWeeks(currentDate, viewWeeks))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Weeks shown:</span>
          <select 
            value={viewWeeks} 
            onChange={(e) => setViewWeeks(Number(e.target.value))}
            className="px-2 py-1 border border-border rounded text-sm"
          >
            <option value={2}>2 Weeks</option>
            <option value={4}>4 Weeks</option>
            <option value={8}>8 Weeks</option>
            <option value={12}>12 Weeks</option>
          </select>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="flex-1 border border-border rounded-lg overflow-hidden bg-card">
        {/* Timeline Header */}
        <div className="border-b border-border">
          {/* Week Header */}
          <div className="flex">
            <div className="w-48 bg-muted/30 border-r border-border p-2">
              <span className="text-sm font-medium">Category</span>
            </div>
            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${viewWeeks}, 1fr)` }}>
              {weeks.map((week, index) => (
                <div key={index} className="border-r border-border last:border-r-0 p-2 text-center bg-muted/30">
                  <div className="text-sm font-medium">
                    {format(week, 'MMM d')}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Day Header */}
          <div className="flex">
            <div className="w-48 bg-muted/30 border-r border-border p-1"></div>
            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${totalDays}, 1fr)` }}>
              {days.map((day, index) => {
                const isToday = isSameDay(day, new Date());
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                
                return (
                  <div 
                    key={index} 
                    className={`border-r border-border last:border-r-0 p-1 text-center text-xs ${
                      isToday ? 'bg-primary text-primary-foreground' : 
                      isWeekend ? 'bg-muted' : 'bg-muted/30'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Gantt Content */}
        <div className="flex-1 overflow-y-auto max-h-[600px]">
          {categories.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No event data
            </div>
          ) : (
            categories.map(category => {
              const categoryEvents = groupedEvents[category];
              const categoryColor = categoryEvents[0]?.color || '#3b82f6';
              
              return (
                <div key={category} className="border-b border-border last:border-b-0">
                  <div className="flex min-h-[60px]">
                    {/* Category Label */}
                    <div className="w-48 border-r border-border p-3 bg-muted/10 flex items-center">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: categoryColor }}
                        />
                        <span className="font-medium text-sm">{category}</span>
                        <Badge variant="secondary" className="text-xs">
                          {categoryEvents.length}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Timeline Area */}
                    <div className="flex-1 relative">
                      {/* Date Grid Background */}
                      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${totalDays}, 1fr)` }}>
                        {days.map((day, index) => {
                          const isToday = isSameDay(day, new Date());
                          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                          
                          return (
                            <div 
                              key={index}
                              className={`border-r border-border last:border-r-0 ${
                                isToday ? 'bg-primary/5' : 
                                isWeekend ? 'bg-muted/30' : ''
                              }`}
                            />
                          );
                        })}
                      </div>
                      
                      {/* Event Bars */}
                      <div className="relative h-full p-2">
                        {categoryEvents.map((event, eventIndex) => {
                          const barStyle = getEventBarStyle(event);
                          
                          if (!barStyle) return null;
                          
                          return (
                            <div
                              key={event.id}
                              className="absolute h-6 border border-solid rounded px-2 flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                              style={{
                                ...barStyle,
                                top: `${8 + eventIndex * 28}px`,
                                minWidth: '60px'
                              }}
                              title={`${event.title}\n${format(event.startDate, 'yyyy-MM-dd HH:mm')} - ${format(event.endDate, 'yyyy-MM-dd HH:mm')}`}
                            >
                              <span className="text-xs truncate" style={{ color: event.color }}>
                                {event.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-4 text-sm text-muted-foreground">
        Time Range: {format(weekStart, 'MMM d, yyyy')} - {format(addDays(weekStart, totalDays - 1), 'MMM d, yyyy')}
        　Total {events.length} events
      </div>
    </div>
  );
}
