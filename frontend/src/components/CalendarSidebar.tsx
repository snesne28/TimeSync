import React from 'react';
import { Calendar, Search, Settings, Plus, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
// Updated import to point to types file which should export CalendarSettings
import { CalendarSettings } from '../types';

interface Category {
  name: string;
  color: string;
  count: number;
}

interface CalendarSidebarProps {
  currentView: 'month' | 'week' | 'day' | 'table' | 'kanban' | 'gantt';
  onViewChange: (view: 'month' | 'week' | 'day' | 'table' | 'kanban' | 'gantt') => void;
  categories: Category[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  settings: CalendarSettings;
  onSettingsChange: (settings: CalendarSettings) => void;
  onCreateEvent: () => void;
}

export function CalendarSidebar({
  currentView,
  onViewChange,
  categories,
  selectedCategories,
  onCategoriesChange,
  searchQuery,
  onSearchChange,
  settings,
  onSettingsChange,
  onCreateEvent,
}: CalendarSidebarProps) {
  const views = [
    { id: 'month', name: 'Month', icon: Calendar },
    { id: 'week', name: 'Week', icon: Calendar },
    { id: 'day', name: 'Day', icon: Calendar },
    { id: 'table', name: 'Table', icon: Filter },
    { id: 'kanban', name: 'Kanban', icon: Filter },
    { id: 'gantt', name: 'Gantt', icon: Filter },
  ] as const;

  const toggleCategory = (categoryName: string) => {
    if (selectedCategories.includes(categoryName)) {
      onCategoriesChange(selectedCategories.filter(c => c !== categoryName));
    } else {
      onCategoriesChange([...selectedCategories, categoryName]);
    }
  };

  return (
    <div className="w-80 bg-zinc-950 border-r border-zinc-800 flex flex-col text-zinc-100">
      {/* Create Button */}
      <div className="p-4">
        <Button onClick={onCreateEvent} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 w-4 h-4" />
          <Input
            placeholder="Search schedule..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-600"
          />
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Views */}
      <div className="p-4">
        <h3 className="mb-3 text-sm font-medium text-zinc-400">Views</h3>
        <div className="space-y-1">
          {views.map((view) => {
            const Icon = view.icon;
            return (
              <Button
                key={view.id}
                variant={currentView === view.id ? 'secondary' : 'ghost'}
                className={`w-full justify-start ${currentView === view.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}
                onClick={() => onViewChange(view.id)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {view.name}
              </Button>
            );
          })}
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Categories */}
      <div className="p-4">
        <h3 className="mb-3 text-sm font-medium text-zinc-400">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category.name}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-900 cursor-pointer transition-colors"
              onClick={() => toggleCategory(category.name)}
            >
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className={`text-sm ${selectedCategories.includes(category.name) ? 'text-zinc-100' : 'text-zinc-500'}`}>
                  {category.name}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs bg-zinc-800 text-zinc-400">
                {category.count}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Settings */}
      <div className="p-4 flex-1">
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 text-zinc-400 hover:text-white hover:bg-transparent">
              <div className="flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Display Settings
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-events" className="text-zinc-400">Show Events</Label>
              <Switch
                id="show-events"
                checked={settings.showEvents}
                onCheckedChange={(checked: boolean) =>
                  onSettingsChange({ ...settings, showEvents: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-holidays" className="text-zinc-400">Show Holidays</Label>
              <Switch
                id="show-holidays"
                checked={settings.showHolidays}
                onCheckedChange={(checked: boolean) =>
                  onSettingsChange({ ...settings, showHolidays: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-lucky-days" className="text-zinc-400">Show Lucky Days</Label>
              <Switch
                id="show-lucky-days"
                checked={settings.showLuckyDays}
                onCheckedChange={(checked: boolean) =>
                  onSettingsChange({ ...settings, showLuckyDays: checked })
                }
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}