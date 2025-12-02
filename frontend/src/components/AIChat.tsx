import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { ChatMessage as ChatMessageComponent } from './ChatMessage';
import { ChatMessage } from '../types';

interface AIChatProps {
  onSendMessage: (message: string) => Promise<string>;
}

// Define the Native Speech API type for TypeScript
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

export function AIChat({ onSendMessage }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI scheduling assistant. You can type or speak to me!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  
  // Ref to hold the latest messages state to avoid closure staleness in event listeners
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  // --- 1. CORE SEND LOGIC ---
  // We extract this so both the Form and the Voice engine can use it
  const processMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    // Add User Message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    // Update State (Using functional update for safety)
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await onSendMessage(textToSend);
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiResponse]);
      speak(responseText);

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a ref for the process function so the useEffect can access the latest version
  const processMessageRef = useRef(processMessage);
  processMessageRef.current = processMessage;

  // --- 2. INITIALIZE NATIVE SPEECH ENGINE ---
  useEffect(() => {
    const { webkitSpeechRecognition } = window as unknown as IWindow;
    
    if (!webkitSpeechRecognition) {
      console.error("Web Speech API is NOT supported in this browser.");
      return;
    }

    const recognition = new webkitSpeechRecognition();
    // [CHANGE] continuous: false = Stop automatically when silence is detected
    recognition.continuous = false;     
    recognition.interimResults = true; 
    recognition.lang = 'en-US';

    // Temporary storage for the current phrase
    let finalTranscript = '';

    recognition.onstart = () => {
      console.log("Mic is OPEN");
      setIsListening(true);
      finalTranscript = ''; // Reset on start
    };

    recognition.onend = () => {
      console.log("Mic is CLOSED");
      setIsListening(false);
      
      // [CHANGE] Auto-Submit if we caught any text
      if (finalTranscript.trim()) {
        console.log("Auto-submitting:", finalTranscript);
        processMessageRef.current(finalTranscript);
      }
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      // Update UI with what is being said currently
      if (finalTranscript || interimTranscript) {
        setInput(finalTranscript || interimTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech Error:", event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  // --- 3. HANDLERS ---

  const handleMicClick = () => {
    if (!recognitionRef.current) {
        alert("Your browser does not support Speech Recognition. Please try Google Chrome.");
        return;
    }

    if (isListening) {
      recognitionRef.current.stop(); // This will trigger onend -> Auto Submit
    } else {
      setInput(''); // Clear input box for new speech
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Start error:", err);
      }
    }
  };

  const speak = (text: string) => {
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // If user hits enter while mic is on, stop mic (which triggers submit)
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return; 
    }
    processMessage(input);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- 4. RENDER UI ---
  return (
    <div className="flex flex-col h-full bg-zinc-950 border-l border-zinc-800">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-zinc-100">TimeSync AI</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-zinc-500">Online</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
                setIsVoiceEnabled(!isVoiceEnabled);
                window.speechSynthesis.cancel();
            }}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
            title={isVoiceEnabled ? "Mute Voice" : "Enable Voice"}
          >
            {isVoiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map(message => (
          <ChatMessageComponent key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-zinc-300 animate-spin" />
            </div>
            <div className="flex items-center gap-2 bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <span className="text-zinc-400 text-sm">Thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-zinc-800 relative">
        
        {/* Visual Indicator for Listening */}
        {isListening && (
          <div className="absolute -top-8 left-6 flex items-center gap-2 bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs font-medium animate-pulse border border-red-500/20">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
            Listening... (Auto-submit on pause)
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Ask me to schedule a meeting..."}
                disabled={isLoading}
                className={`w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 pr-12 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:opacity-50 ${isListening ? 'ring-2 ring-red-500/50 border-red-500/50' : ''}`}
            />
            
            {/* Mic Button */}
            <button
                type="button"
                onClick={handleMicClick}
                disabled={isLoading}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
                    isListening 
                    ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
            >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
