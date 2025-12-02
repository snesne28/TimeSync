import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import 'regenerator-runtime/runtime'; // Required for speech recognition
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { ChatMessage as ChatMessageComponent } from './ChatMessage';
import { ChatMessage } from '../types';

interface AIChatProps {
  onSendMessage: (message: string) => Promise<string>;
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
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true); // Toggle for TTS
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Speech Recognition Hooks
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable // <--- Check this
  } = useSpeechRecognition();

  // Add this debugging useEffect
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      console.error("Browser does not support speech recognition.");
    }
    if (!isMicrophoneAvailable) {
      console.error("Microphone is not available or permission denied.");
    }
  }, [browserSupportsSpeechRecognition, isMicrophoneAvailable]);
  
  // Update the handleMicClick 
  const handleMicClick = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      console.log("Stopped listening");
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
      console.log("Started listening...");
    }
  };
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- VOICE OUTPUT (Text-to-Speech) ---
  const speak = (text: string) => {
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;
    
    // Cancel any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Optional: Select a specific voice if desired
    // const voices = window.speechSynthesis.getVoices();
    // utterance.voice = voices[0]; 
    
    window.speechSynthesis.speak(utterance);
  };

  const handleMicClick = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Stop listening if mic was on
    if (listening) {
      SpeechRecognition.stopListening();
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    resetTranscript();
    setIsLoading(true);

    try {
      const responseText = await onSendMessage(input);
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiResponse]);
      
      // Speak the response!
      speak(responseText);

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!browserSupportsSpeechRecognition) {
    console.warn("Browser doesn't support speech recognition.");
  }

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
          {/* Voice Toggle Button */}
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
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-zinc-800">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={listening ? "Listening..." : "Ask me to schedule a meeting..."}
                disabled={isLoading}
                className={`w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 pr-12 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:opacity-50 ${listening ? 'ring-2 ring-red-500/50' : ''}`}
            />
            
            {/* Mic Button inside Input */}
            <button
                type="button"
                onClick={handleMicClick}
                disabled={isLoading}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
                    listening 
                    ? 'text-red-500 hover:bg-red-500/10 animate-pulse' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
            >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
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
