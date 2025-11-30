import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Event } from '../../App';
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, differenceInDays, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface GanttViewProps {
  events: Event[];
  onDeleteEvent: (eventId: string) => void;
  onUpdateEvent: (eventId: string, updatedEvent: Partial<Event>) => void;
}

export function GanttView({ events, onDeleteEvent, onUpdateEvent }: GanttViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewWeeks, setViewWeeks] = useState(4); // 显示4周

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

  // 按分类分组事件
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
    
    // 如果事件在显示范围内
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

  const getDayColumnWidth = () => {
    return `${100 / totalDays}%`;
  };

  return (
    <div className="flex-1 flex flex-col p-6">
      {/* 甘特图工具栏 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2>甘特视图</h2>
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
              今天
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
          <span className="text-sm text-muted-foreground">显示周数：</span>
          <select 
            value={viewWeeks} 
            onChange={(e) => setViewWeeks(Number(e.target.value))}
            className="px-2 py-1 border border-border rounded text-sm"
          >
            <option value={2}>2周</option>
            <option value={4}>4周</option>
            <option value={8}>8周</option>
            <option value={12}>12周</option>
          </select>
        </div>
      </div>

      {/* 甘特图 */}
      <div className="flex-1 border border-border rounded-lg overflow-hidden bg-card">
        {/* 时间轴头部 */}
        <div className="border-b border-border">
          {/* 周标题 */}
          <div className="flex">
            <div className="w-48 bg-muted/30 border-r border-border p-2">
              <span className="text-sm font-medium">分类</span>
            </div>
            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${viewWeeks}, 1fr)` }}>
              {weeks.map((week, index) => (
                <div key={index} className="border-r border-border last:border-r-0 p-2 text-center bg-muted/30">
                  <div className="text-sm font-medium">
                    {format(week, 'M月d日', { locale: zhCN })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 日期标题 */}
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
                    {format(day, 'd', { locale: zhCN })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 甘特图内容 */}
        <div className="flex-1 overflow-y-auto max-h-[600px]">
          {categories.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              暂无日程数据
            </div>
          ) : (
            categories.map(category => {
              const categoryEvents = groupedEvents[category];
              const categoryColor = categoryEvents[0]?.color || '#3b82f6';
              
              return (
                <div key={category} className="border-b border-border last:border-b-0">
                  <div className="flex min-h-[60px]">
                    {/* 分类标签 */}
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
                    
                    {/* 时间轴区域 */}
                    <div className="flex-1 relative">
                      {/* 日期网格背景 */}
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
                      
                      {/* 事件条 */}
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

      {/* 统计信息 */}
      <div className="mt-4 text-sm text-muted-foreground">
        时间范围：{format(weekStart, 'yyyy年M月d日', { locale: zhCN })} - {format(addDays(weekStart, totalDays - 1), 'yyyy年M月d日', { locale: zhCN })}
        　共 {events.length} 个日程
      </div>
    </div>
  );
}