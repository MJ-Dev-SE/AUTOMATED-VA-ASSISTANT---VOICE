/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { 
  Mic, 
  Send, 
  Trash2, 
  ChevronDown, 
  X,
  Volume2,
  BrainCircuit,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Meeting, DailyNote, VoiceChat, MeetingStatus } from '../types';
import { cn } from '../lib/utils';

// Types for Speech Recognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceAssistantPanelProps {
  history: VoiceChat[];
  setHistory: Dispatch<SetStateAction<VoiceChat[]>>;
  meetings: Meeting[];
  setMeetings: Dispatch<SetStateAction<Meeting[]>>;
  notes: DailyNote[];
  setNotes: Dispatch<SetStateAction<DailyNote[]>>;
}

export default function VoiceAssistantPanel({ history, setHistory, meetings, setMeetings, notes, setNotes }: VoiceAssistantPanelProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const current = event.results[event.results.length - 1][0].transcript;
        setTranscript(current);
        if (event.results[0].isFinal) {
          handleUserCommand(current);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        addMessage('assistant', "I'm sorry, I had trouble hearing that. Could you repeat it?");
      };
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsAssistantSpeaking(true);
    utterance.onend = () => setIsAssistantSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const newMessage: VoiceChat = {
      id: Math.random().toString(),
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    setHistory(prev => [...prev, newMessage]);
    if (role === 'assistant') {
      speak(content);
    }
  };

  const handleUserCommand = (command: string) => {
    addMessage('user', command);
    const cmd = command.toLowerCase();

    // Command Logic
    if (cmd.includes('meeting') && cmd.includes('today')) {
      const today = new Date().toISOString().split('T')[0];
      const count = meetings.filter(m => m.dateTime.startsWith(today)).length;
      addMessage('assistant', `You have ${count} meetings scheduled for today.`);
    } else if (cmd.includes('next meeting')) {
      const now = new Date().getTime();
      const next = meetings
        .filter(m => new Date(m.dateTime).getTime() > now && m.status === 'UPCOMING')
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())[0];
      if (next) {
        addMessage('assistant', `Your next meeting is "${next.title}" at ${new Date(next.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
      } else {
        addMessage('assistant', "You don't have any more upcoming meetings scheduled.");
      }
    } else if (cmd.includes('add a note') || cmd.includes('add note')) {
      const content = command.replace(/add (a )?note:?\s?/i, '').trim();
      if (content) {
        const newNote: DailyNote = {
          id: Math.random().toString(),
          title: 'Voice Note',
          content,
          color: 'yellow',
          timestamp: new Date().toISOString(),
          pinned: false,
        };
        setNotes(prev => [newNote, ...prev]);
        addMessage('assistant', `I've added the note: "${content}"`);
      } else {
        addMessage('assistant', "What would you like the note to say?");
      }
    } else if (cmd.includes('read') && cmd.includes('notes')) {
      if (notes.length === 0) {
        addMessage('assistant', "Your pinboard is empty.");
      } else {
        const noteTitles = notes.slice(0, 3).map(n => n.title || 'Untitled').join(', ');
        addMessage('assistant', `Here are your recent notes: ${noteTitles}. Want me to read the content of one?`);
      }
    } else if (cmd.includes('mark') && cmd.includes('done')) {
      const titleSearch = cmd.replace(/mark\s|\sas done/gi, '').trim();
      const meeting = meetings.find(m => m.title.toLowerCase().includes(titleSearch));
      if (meeting) {
        setMeetings(prev => prev.map(m => m.id === meeting.id ? { ...m, status: 'DONE' } : m));
        addMessage('assistant', `Done! I've marked "${meeting.title}" as completed.`);
      } else {
        addMessage('assistant', `I couldn't find a meeting matching "${titleSearch}".`);
      }
    } else if (cmd.includes('hello') || cmd.includes('hi ')) {
      addMessage('assistant', "Hello! I'm your AI assistant. How can I help with your schedule or notes today?");
    } else {
      addMessage('assistant', "I understand you said: '" + command + "'. I can help check meetings, add notes, or mark tasks as done. What should I do?");
    }
  };

  const clearHistory = () => {
    if (window.confirm('Clear chat history?')) {
      setHistory([]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-[#1e293b]/30 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <BrainCircuit className="w-64 h-64 text-purple-500" />
      </div>

      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white leading-none">Voice AI</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={cn("w-2 h-2 rounded-full", isListening ? "bg-red-500 animate-pulse" : "bg-green-500")}></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{isListening ? 'Listening...' : 'Systems Active'}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={clearHistory}
          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
          title="Clear History"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Chat History */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar z-10"
      >
        {history.length > 0 ? (
          history.map((chat) => (
            <motion.div
              layout
              key={chat.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex gap-4 max-w-[85%]",
                chat.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                chat.role === 'user' ? "bg-slate-700" : "bg-purple-600"
              )}>
                {chat.role === 'user' ? <MessageSquare className="w-4 h-4 text-white" /> : <BrainCircuit className="w-4 h-4 text-white" />}
              </div>
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed",
                chat.role === 'user' ? "bg-slate-800 text-slate-200 rounded-tr-none" : "bg-purple-600/20 text-slate-100 border border-purple-500/30 rounded-tl-none shadow-lg shadow-purple-500/5"
              )}>
                {chat.content}
                <div className={cn(
                  "text-[9px] mt-2 font-bold uppercase tracking-widest opacity-40",
                  chat.role === 'user' ? "text-right" : "text-left"
                )}>
                  {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-32 h-32 bg-purple-600/10 rounded-full flex items-center justify-center mb-8 relative"
            >
              <Mic className="w-12 h-12 text-purple-400 z-10" />
              <div className="absolute inset-0 border-2 border-purple-500/20 rounded-full animate-ping"></div>
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-2">Voice Recognition Ready</h3>
            <p className="text-slate-500 max-w-sm font-medium italic">"What meetings do I have today?" or "Add a note to check the mail"</p>
          </div>
        )}
      </div>

      {/* Status Bar / Input area */}
      <div className="p-6 border-t border-slate-800 bg-[#0f172a]/40 backdrop-blur-md z-10 mb-4">
        <div className="flex flex-col gap-4">
          <AnimatePresence>
            {isListening && transcript && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-cyan-400 font-medium italic text-center p-3 bg-cyan-400/10 rounded-2xl border border-cyan-400/20"
              >
                "{transcript}..."
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleListening}
              className={cn(
                "relative w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-xl group",
                isListening ? "bg-red-500 shadow-red-500/40" : "bg-purple-600 shadow-purple-600/40"
              )}
            >
              <Mic className={cn("w-8 h-8 text-white transition-all", isListening && "scale-125 animate-pulse")} />
              {isListening && (
                <div className="absolute -inset-2 border-4 border-red-500/30 rounded-full animate-ping"></div>
              )}
            </button>
            
            <div className="flex-1 flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">
                {isListening ? 'Listening for command...' : isAssistantSpeaking ? 'Assistant speaking...' : 'Click mic to talk'}
              </span>
              <div className="flex items-center gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      height: isListening || isAssistantSpeaking 
                        ? [4, Math.random() * 24 + 8, 4] 
                        : 4 
                    }}
                    transition={{ 
                      duration: 0.5, 
                      repeat: Infinity, 
                      delay: i * 0.05 
                    }}
                    className={cn(
                      "w-1 rounded-full",
                      isListening ? "bg-red-400" : isAssistantSpeaking ? "bg-cyan-400" : "bg-slate-700"
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-4 py-2 bg-slate-800 rounded-xl flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Speaker: ON</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
