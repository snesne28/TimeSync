import React from 'react';
import { CalendarEvent, CalendarSettings } from '../types';
import { MonthView } from './views/MonthView';
import { WeekView } from './views/WeekView';
import { DayView } from './views/DayView';
import { TableView } from './views/TableView';
import { KanbanView } from './views/KanbanView';
import { GanttView } from './views/GanttView';

interface CalendarContentProps {
  view: 'month' | 'week' | 'day' | 'table' | 'kanban' | 'gantt';
  events: Event[];
  onDeleteEvent: (eventId: string) => void;
  onUpdateEvent: (eventId: string, updatedEvent: Partial<Event>) => void;
  settings: CalendarSettings;
}

export function CalendarContent({
  view,
  events,
  onDeleteEvent,
  onUpdateEvent,
  settings,
}: CalendarContentProps) {
  return (
    <div className="flex-1 flex flex-col">
      {view === 'month' && (
        <MonthView 
          events={events}
          onDeleteEvent={onDeleteEvent}
          onUpdateEvent={onUpdateEvent}
          settings={settings}
        />
      )}
      {view === 'week' && (
        <WeekView
          events={events}
          onDeleteEvent={onDeleteEvent}
          onUpdateEvent={onUpdateEvent}
          settings={settings}
        />
      )}
      {view === 'day' && (
        <DayView
          events={events}
          onDeleteEvent={onDeleteEvent}
          onUpdateEvent={onUpdateEvent}
          settings={settings}
        />
      )}
      {view === 'table' && (
        <TableView
          events={events}
          onDeleteEvent={onDeleteEvent}
          onUpdateEvent={onUpdateEvent}
        />
      )}
      {view === 'kanban' && (
        <KanbanView
          events={events}
          onDeleteEvent={onDeleteEvent}
          onUpdateEvent={onUpdateEvent}
        />
      )}
      {view === 'gantt' && (
        <GanttView
          events={events}
          onDeleteEvent={onDeleteEvent}
          onUpdateEvent={onUpdateEvent}
        />
      )}
    </div>
  );
}