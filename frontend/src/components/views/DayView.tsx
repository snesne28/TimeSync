import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Event, CalendarSettings } from '../../App';
import { format, isSameDay, addDays, subDays, getHours, getMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface DayViewProps {
  events: Event[];
  onDeleteEvent: (eventId: string) => void;
  onUpdateEvent: (eventId: string, updatedEvent: Partial<Event>) => void;
  settings: CalendarSettings;
}

export function DayView({ events, onDeleteEvent, onUpdateEvent, settings }: DayViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

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
    
    const top = (startHour + startMinute / 60) * 80; // 每小时80px
    const height = ((endHour + endMinute / 60) - (startHour + startMinute / 60)) * 80;
    
    return { top, height };
  };

  const dayEvents = getEventsForDay(currentDate);
  const isToday = isSameDay(currentDate, new Date());

  return (
    <div className="flex-1 flex flex-col p-6">
      {/* 日期导航 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2>{format(currentDate, 'yyyy年M月d日 EEEE', { locale: zhCN })}</h2>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subDays(currentDate, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              今天
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(addDays(currentDate, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          共 {dayEvents.length} 个日程
        </div>
      </div>

      {/* 日视图内容 */}
      <div className="flex-1 flex border border-border rounded-lg overflow-hidden">
        {/* 时间轴 */}
        <div className="w-20 bg-muted/30 border-r border-border">
          {hours.map(hour => (
            <div key={hour} className="h-[80px] border-b border-border flex items-start justify-center pt-2 text-sm text-muted-foreground">
              {hour === 0 ? '00:00' : `${hour.toString().padStart(2, '0')}:00`}
            </div>
          ))}
        </div>

        {/* 日程区域 */}
        <div className="flex-1 relative">
          {/* 时间格子 */}
          {hours.map(hour => (
            <div key={hour} className="h-[80px] border-b border-border hover:bg-accent/50"></div>
          ))}
          
          {/* 现在时间线 */}
          {isToday && (
            <div
              className="absolute left-0 right-0 border-t-2 border-red-500 z-20"
              style={{
                top: `${(getHours(new Date()) + getMinutes(new Date()) / 60) * 80}px`
              }}
            >
              <div className="w-3 h-3 bg-red-500 rounded-full -mt-1.5 -ml-1.5"></div>
            </div>
          )}
          
          {/* 事件 */}
          {dayEvents.map(event => {
            const { top, height } = getEventPosition(event);
            return (
              <div
                key={event.id}
                className="absolute left-4 right-4 p-3 rounded-lg cursor-pointer z-10 shadow-sm"
                style={{
                  top: `${top}px`,
                  height: `${Math.max(height, 40)}px`,
                  backgroundColor: `${event.color}15`,
                  border: `2px solid ${event.color}40`
                }}
                onClick={() => {
                  // 这里可以添加编辑事件的逻辑
                }}
              >
                <div className="font-medium text-sm" style={{ color: event.color }}>
                  {event.title}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {format(event.startDate, 'HH:mm')} - {format(event.endDate, 'HH:mm')}
                </div>
                {event.location && (
                  <div className="text-xs text-muted-foreground mt-1">
                    📍 {event.location}
                  </div>
                )}
                {height > 80 && event.description && (
                  <div className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {event.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}