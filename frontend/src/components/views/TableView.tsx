import React, { useState } from 'react';
import { MoreHorizontal, ArrowUpDown, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Event } from '../../App';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface TableViewProps {
  events: Event[];
  onDeleteEvent: (eventId: string) => void;
  onUpdateEvent: (eventId: string, updatedEvent: Partial<Event>) => void;
}

type SortField = 'title' | 'category' | 'startDate' | 'location';
type SortOrder = 'asc' | 'desc';

export function TableView({ events, onDeleteEvent, onUpdateEvent }: TableViewProps) {
  const [sortField, setSortField] = useState<SortField>('startDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = Array.from(new Set(events.map(e => e.category)));

  const filteredAndSortedEvents = events
    .filter(event => {
      const matchesCategory = filterCategory === 'all' || event.category === filterCategory;
      const matchesSearch = searchTerm === '' || 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'startDate':
          aValue = a.startDate;
          bValue = b.startDate;
          break;
        case 'location':
          aValue = a.location || '';
          bValue = b.location || '';
          break;
        default:
          return 0;
      }

      if (sortField === 'startDate') {
        return sortOrder === 'asc' 
          ? new Date(aValue).getTime() - new Date(bValue).getTime()
          : new Date(bValue).getTime() - new Date(aValue).getTime();
      }

      const comparison = aValue.localeCompare(bValue);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-medium"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-3 w-3" />
    </Button>
  );

  return (
    <div className="flex-1 flex flex-col p-6">
      {/* 表格工具栏 */}
      <div className="flex items-center justify-between mb-6">
        <h2>表格视图</h2>
        <div className="flex items-center space-x-4">
          <Input
            placeholder="搜索日程..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="筛选分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 表格 */}
      <div className="flex-1 border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">
                <SortButton field="title">标题</SortButton>
              </TableHead>
              <TableHead className="w-[120px]">
                <SortButton field="category">分类</SortButton>
              </TableHead>
              <TableHead className="w-[180px]">
                <SortButton field="startDate">开始时间</SortButton>
              </TableHead>
              <TableHead className="w-[180px]">结束时间</TableHead>
              <TableHead className="w-[150px]">
                <SortButton field="location">地点</SortButton>
              </TableHead>
              <TableHead>描述</TableHead>
              <TableHead className="w-[80px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedEvents.map(event => (
              <TableRow key={event.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: event.color }}
                    />
                    <span className="font-medium">{event.title}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{event.category}</Badge>
                </TableCell>
                <TableCell>
                  {format(event.startDate, 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                </TableCell>
                <TableCell>
                  {format(event.endDate, 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                </TableCell>
                <TableCell>{event.location || '-'}</TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate" title={event.description}>
                    {event.description || '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 统计信息 */}
      <div className="mt-4 text-sm text-muted-foreground">
        共 {filteredAndSortedEvents.length} 个日程
      </div>
    </div>
  );
}