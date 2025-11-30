import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarView } from '../types';

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
}

export function CalendarHeader({ currentDate, view, onViewChange, onNavigate }: CalendarHeaderProps) {
  const formatTitle = () => {
    const options: Intl.DateTimeFormatOptions = 
      view === 'month' 
        ? { month: 'long', year: 'numeric' }
        : view === 'week'
        ? { month: 'short', day: 'numeric', year: 'numeric' }
        : { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    
    return currentDate.toLocaleDateString('en-US', options);
  };

  return (
    <div className="flex items-center justify-between p-6 border-b border-zinc-800">
      <div className="flex items-center gap-6">
        <h1 className="text-zinc-100">TimeSync</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('prev')}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => onNavigate('today')}
            className="px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-300 hover:text-zinc-100"
          >
            Today
          </button>
          <button
            onClick={() => onNavigate('next')}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <span className="text-zinc-300">{formatTitle()}</span>
      </div>
      
      <div className="flex gap-2">
        {(['month', 'week', 'day'] as CalendarView[]).map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={`px-4 py-2 rounded-lg transition-colors capitalize ${
              view === v
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
