// src/App.tsx
import { useState, useEffect } from 'react';
import { Calendar } from './components/Calendar';
import { AIChat } from './components/AIChat';
import { CalendarEvent } from './types';
// IMPORT THE BRIDGE FUNCTIONS
import { fetchEvents, sendChatMessage } from './api';

function App() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Function to get Real Data from Python
  const loadRealData = async () => {
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Load on startup + Auto-refresh every 5 seconds
  useEffect(() => {
    loadRealData();
    const interval = setInterval(loadRealData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleEventClick = (event: CalendarEvent) => {
    console.log('Event clicked:', event);
    // You can add a delete/edit modal here later!
  };

  // 3. Send Message to Agent -> Wait for Reply -> Refresh Calendar
  const handleSendMessage = async (message: string) => {
    try {
      // Send to Python
      const aiResponse = await sendChatMessage(message, []);
      
      // Immediately refresh the calendar to show any new bookings
      await loadRealData();
      
      return aiResponse; // Return the text so the Chat UI can show it
    } catch (error) {
      console.error('Error sending message:', error);
      return "Sorry, I can't reach the scheduler right now.";
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Loading your schedule...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-zinc-950 overflow-hidden">
      <div className="flex h-full">
        {/* Calendar Section - 70% */}
        <div className="w-[70%] h-full border-r border-zinc-800">
          <Calendar events={events} onEventClick={handleEventClick} />
        </div>

        {/* AI Chat Section - 30% */}
        <div className="w-[30%] h-full bg-zinc-950">
          <AIChat onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}

export default App;