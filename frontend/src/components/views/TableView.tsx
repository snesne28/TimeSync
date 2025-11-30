import React, { useState } from 'react';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Event } from '../../App';
import { format } from 'date-fns';

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
      {/* Table Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <h2>Table View</h2>
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">
                <SortButton field="title">Title</SortButton>
              </TableHead>
              <TableHead className="w-[120px]">
                <SortButton field="category">Category</SortButton>
              </TableHead>
              <TableHead className="w-[180px]">
                <SortButton field="startDate">Start Time</SortButton>
              </TableHead>
              <TableHead className="w-[180px]">End Time</TableHead>
              <TableHead className="w-[150px]">
                <SortButton field="location">Location</SortButton>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
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
                  {format(event.startDate, 'yyyy-MM-dd HH:mm')}
                </TableCell>
                <TableCell>
                  {format(event.endDate, 'yyyy-MM-dd HH:mm')}
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
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Copy</DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => onDeleteEvent(event.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Statistics */}
      <div className="mt-4 text-sm text-muted-foreground">
        Total {filteredAndSortedEvents.length} events
      </div>
    </div>
  );
}
