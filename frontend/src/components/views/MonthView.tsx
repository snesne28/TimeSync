import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Event, CalendarSettings } from '../../App';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface MonthViewProps {
  events: Event[];
  onDeleteEvent: (eventId: string) => void;
  onUpdateEvent: (eventId: string, updatedEvent: Partial<Event>) => void;
  settings: CalendarSettings;
}

export function MonthView({ events, onDeleteEvent, onUpdateEvent, settings }: MonthViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getEventsForDay = (date: Date) => {
    return events.filter(event => 
      isSameDay(event.startDate, date)
    );
  };

  const getHolidayInfo = (date: Date) => {
    // 模拟节假日数据
    const holidays = [
      { date: new Date(2025, 7, 15), name: '中元节' },
      { date: new Date(2025, 7, 22), name: '处暑' },
    ];
    return holidays.find(holiday => isSameDay(holiday.date, date));
  };

  const getLuckyDayInfo = (date: Date) => {
    // 模拟黄道吉日数据
    const luckyDays = [
      new Date(2025, 7, 8),
      new Date(2025, 7, 12),
      new Date(2025, 7, 18),
      new Date(2025, 7, 25),
    ];
    return luckyDays.some(luckyDay => isSameDay(luckyDay, date));
  };

  return (
    <div className="flex-1 flex flex-col p-6">
      {/* 月份导航 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2>{format(currentDate, 'yyyy年M月', { locale: zhCN })}</h2>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
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
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-muted-foreground">
        {['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map(day => (
          <div key={day} className="p-2">
            {day}
          </div>
        ))}
      </div>

      {/* 日历网格 */}
      <div className="flex-1 grid grid-rows-6 gap-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIndex) => {
              const dayEvents = getEventsForDay(day);
              const holiday = settings.showHolidays ? getHolidayInfo(day) : null;
              const isLuckyDay = settings.showLuckyDays && getLuckyDayInfo(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <Card key={dayIndex} className={`
                  h-full min-h-[120px] p-2 relative
                  ${isCurrentMonth ? 'bg-card' : 'bg-muted/30'}
                  ${isToday ? 'ring-2 ring-primary' : ''}
                  ${isLuckyDay ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}
                `}>
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {format(day, 'd')}
                      </span>
                      <div className="flex items-center space-x-1">
                        {holiday && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            {holiday.name}
                          </Badge>
                        )}
                        {isLuckyDay && (
                          <div className="w-2 h-2 bg-yellow-400 rounded-full" title="黄道吉日" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <Popover key={event.id}>
                          <PopoverTrigger asChild>
                            <div
                              className="text-xs p-1 rounded cursor-pointer truncate"
                              style={{ backgroundColor: `${event.color}15`, color: event.color }}
                            >
                              {event.title}
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="font-medium">{event.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {format(event.startDate, 'HH:mm')} - {format(event.endDate, 'HH:mm')}
                              </p>
                              {event.location && (
                                <p className="text-sm text-muted-foreground">📍 {event.location}</p>
                              )}
                              {event.description && (
                                <p className="text-sm">{event.description}</p>
                              )}
                              <div className="flex justify-end space-x-2">
                                <Button size="sm" variant="outline">编辑</Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => onDeleteEvent(event.id)}
                                >
                                  删除
                                </Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                          +{dayEvents.length - 3} 更多
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}