import React, { useState } from 'react';
import { Calendar, Clock, MapPin, FileText, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
// Updated import to point to types file
import { CalendarEvent } from '../types';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Category {
  name: string;
  color: string;
  count: number;
}

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Adjusted type to match CalendarEvent structure more closely or use Partial
  onCreateEvent: (event: Partial<CalendarEvent>) => void;
  categories: Category[];
}

export function CreateEventDialog({
  open,
  onOpenChange,
  onCreateEvent,
  categories,
}: CreateEventDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endDate: format(new Date(), 'yyyy-MM-dd'),
    endTime: '10:00',
    location: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    if (endDateTime <= startDateTime) {
      toast.error('End time must be after start time');
      return;
    }

    const selectedCategory = categories.find(c => c.name === formData.category);

    const newEvent = {
      title: formData.title.trim(),
      // We map category to color for the frontend display
      color: selectedCategory?.color || '#3b82f6',
      startTime: startDateTime,
      endTime: endDateTime,
      location: formData.location.trim() || undefined,
      description: formData.description.trim() || undefined,
    };

    onCreateEvent(newEvent);
    toast.success('Event created successfully');
    
    // Reset form
    setFormData({
      title: '',
      category: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endDate: format(new Date(), 'yyyy-MM-dd'),
      endTime: '10:00',
      location: '',
      description: '',
    });
    
    onOpenChange(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-zinc-100">
            <Calendar className="w-5 h-5" />
            <span>Create New Event</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center space-x-2 text-zinc-400">
              <FileText className="w-4 h-4" />
              <span>Title *</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter event title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-zinc-100 focus:ring-blue-600"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-2 text-zinc-400">
              <Tag className="w-4 h-4" />
              <span>Category *</span>
            </Label>
            <Select value={formData.category} onValueChange={(value: string) => handleInputChange('category', value)}>
              <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-100">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                {categories.map(category => (
                  <SelectItem key={category.name} value={category.name} className="focus:bg-zinc-800">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center space-x-2 text-zinc-400">
                <Clock className="w-4 h-4" />
                <span>Start</span>
              </Label>
              <div className="space-y-2">
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100"
                />
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center space-x-2 text-zinc-400">
                <Clock className="w-4 h-4" />
                <span>End</span>
              </Label>
              <div className="space-y-2">
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100"
                />
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center space-x-2 text-zinc-400">
              <MapPin className="w-4 h-4" />
              <span>Location</span>
            </Label>
            <Input
              id="location"
              placeholder="Enter location (optional)"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-zinc-100"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-zinc-400">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter description (optional)"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="bg-zinc-900 border-zinc-700 text-zinc-100"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}