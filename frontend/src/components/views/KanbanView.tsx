import React, { useState } from 'react';
import { MoreHorizontal, Calendar, MapPin, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Event } from '../../App';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface KanbanViewProps {
  events: Event[];
  onDeleteEvent: (eventId: string) => void;
  onUpdateEvent: (eventId: string, updatedEvent: Partial<Event>) => void;
}

type GroupBy = 'category' | 'date' | 'location';

export function KanbanView({ events, onDeleteEvent, onUpdateEvent }: KanbanViewProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>('category');

  const getGroupedEvents = () => {
    const groups: { [key: string]: Event[] } = {};

    events.forEach(event => {
      let groupKey: string;
      
      switch (groupBy) {
        case 'category':
          groupKey = event.category;
          break;
        case 'date':
          groupKey = format(event.startDate, 'yyyy-MM-dd', { locale: zhCN });
          break;
        case 'location':
          groupKey = event.location || '无地点';
          break;
        default:
          groupKey = '未分组';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(event);
    });

    return groups;
  };

  const groupedEvents = getGroupedEvents();
  const groupKeys = Object.keys(groupedEvents).sort();

  const getGroupColor = (groupKey: string) => {
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
      '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
    ];
    let hash = 0;
    for (let i = 0; i < groupKey.length; i++) {
      hash = groupKey.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const EventCard = ({ event }: { event: Event }) => (
    <Card className="mb-3 cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium truncate">{event.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>编辑</DropdownMenuItem>
              <DropdownMenuItem>复制</DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDeleteEvent(event.id)}
              >
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            {format(event.startDate, 'MM-dd HH:mm', { locale: zhCN })} - {format(event.endDate, 'HH:mm', { locale: zhCN })}
          </div>
          
          {event.location && (
            <div className="flex items-center text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 mr-1" />
              {event.location}
            </div>
          )}

          {groupBy !== 'category' && (
            <Badge variant="secondary" className="text-xs">
              {event.category}
            </Badge>
          )}

          {event.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
              {event.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 flex flex-col p-6">
      {/* 看板工具栏 */}
      <div className="flex items-center justify-between mb-6">
        <h2>看板视图</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">分组方式：</span>
          <Select value={groupBy} onValueChange={(value: GroupBy) => setGroupBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="category">按分类</SelectItem>
              <SelectItem value="date">按日期</SelectItem>
              <SelectItem value="location">按地点</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 看板列 */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex space-x-6 h-full min-w-max">
          {groupKeys.map(groupKey => {
            const groupEvents = groupedEvents[groupKey];
            const groupColor = getGroupColor(groupKey);
            
            return (
              <div key={groupKey} className="w-80 flex flex-col">
                {/* 列头 */}
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-t-lg border border-b-0">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: groupColor }}
                    />
                    <h3 className="font-medium">{groupKey}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {groupEvents.length}
                    </Badge>
                  </div>
                </div>

                {/* 事件列表 */}
                <div className="flex-1 p-4 bg-muted/10 border border-t-0 rounded-b-lg overflow-y-auto">
                  {groupEvents.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      暂无日程
                    </div>
                  ) : (
                    groupEvents.map(event => (
                      <EventCard key={event.id} event={event} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 统计信息 */}
      <div className="mt-4 text-sm text-muted-foreground">
        共 {events.length} 个日程，分为 {groupKeys.length} 组
      </div>
    </div>
  );
}