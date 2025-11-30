import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Event, CalendarSettings } from '../../App';
import { format, startOfWeek, endOfWeek, addDays, isSameDay, addWeeks, subWeeks, getHours, getMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';

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
    
    const top = (startHour + startMinute / 60) * 60; // 每小时60px
    const height = ((endHour + endMinute / 60) - (startHour + startMinute / 60)) * 60;
    
    return { top, height };
  };

  return (
    <div className="flex-1 flex flex-col p-6">
      {/* 周导航 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2>
            {format(weekStart, 'yyyy年M月d日', { locale: zhCN })} - {format(weekEnd, 'M月d日', { locale: zhCN })}
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
              本周
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

      {/* 周视图内容 */}
      <div className="flex-1 flex border border-border rounded-lg overflow-hidden">
        {/* 时间轴 */}
        <div className="w-16 bg-muted/30 border-r border-border">
          <div className="h-12 border-b border-border"></div>
          {hours.map(hour => (
            <div key={hour} className="h-[60px] border-b border-border flex items-start justify-center pt-1 text-xs text-muted-foreground">
              {hour === 0 ? '00:00' : `${hour.toString().padStart(2, '0')}:00`}
            </div>
          ))}
        </div>

        {/* 日期列 */}
        <div className="flex-1 grid grid-cols-7">
          {days.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div key={index} className="border-r border-border last:border-r-0">
                {/* 日期头部 */}
                <div className={`h-12 border-b border-border flex flex-col items-center justify-center text-sm ${
                  isToday ? 'bg-primary text-primary-foreground' : 'bg-muted/30'
                }`}>
                  <div>{format(day, 'EEE', { locale: zhCN })}</div>
                  <div>{format(day, 'd')}</div>
                </div>

                {/* 时间格子和事件 */}
                <div className="relative">
                  {hours.map(hour => (
                    <div key={hour} className="h-[60px] border-b border-border"></div>
                  ))}
                  
                  {/* 事件 */}
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
                          // 这里可以添加编辑事件的逻辑
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