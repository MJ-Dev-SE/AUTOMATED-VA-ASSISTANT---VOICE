/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  StickyNote,
  MessageSquare,
  X,
  Menu,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { storageService } from "./storageService";
import {
  Meeting,
  DailyNote,
  VoiceChat,
  ChatSession,
  MeetingStatus,
} from "./types";
import { cn, getGreeting, formatDate, formatTime } from "./lib/utils";

// Views
import Dashboard from "./components/Dashboard";
import MeetingManager from "./components/MeetingManager";
import NotesManager from "./components/NotesManager";
import VoiceAssistantPanel from "./components/VoiceAssistantPanel";
import ProceedingsView from "./components/ProceedingsView";

type View = "dashboard" | "meetings" | "proceedings" | "notes" | "voice";

export default function App() {
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Use lazy initialization to avoid overwriting storage with empty arrays on mount
  const [meetings, setMeetings] = useState<Meeting[]>(() =>
    storageService.getMeetings(),
  );
  const [notes, setNotes] = useState<DailyNote[]>(() =>
    storageService.getNotes(),
  );
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() =>
    storageService.getChatSessions(),
  );

  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock and general setup
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync with storage whenever state changes
  useEffect(() => {
    storageService.saveMeetings(meetings);
  }, [meetings]);

  useEffect(() => {
    storageService.saveNotes(notes);
  }, [notes]);

  useEffect(() => {
    storageService.saveChatSessions(chatSessions);
  }, [chatSessions]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayMeetings = meetings.filter((m) => m.dateTime.startsWith(today));
    return {
      total: todayMeetings.length,
      completed: todayMeetings.filter((m) => m.status === "DONE").length,
      pending: todayMeetings.filter((m) => m.status === "UPCOMING").length,
      notesCount: notes.length,
    };
  }, [meetings, notes]);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "meetings", label: "Meetings", icon: Calendar },
    { id: "proceedings", label: "Proceedings", icon: FileText },
    { id: "notes", label: "Notes", icon: StickyNote },
    { id: "voice", label: "AI Assistant", icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="flex flex-col bg-[#1e293b] border-r border-slate-800 z-50 overflow-hidden"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center font-bold text-xl">
            S
          </div>
          {isSidebarOpen && (
            <span className="font-bold text-xl tracking-tight text-white">
              SmartAssist
            </span>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as View)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                activeView === item.id
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5",
                  activeView === item.id
                    ? "text-white"
                    : "group-hover:text-cyan-400",
                )}
              />
              {isSidebarOpen && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
            {isSidebarOpen && <span className="font-medium">Collapse</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-[#0f172a]">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-md px-8 py-6 flex justify-between items-center border-b border-slate-800/50">
          <div>
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-widest">
              {formatDate(currentTime.toISOString())}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                {getGreeting()}, User
              </h1>
              <span className="text-3xl font-light text-slate-500">|</span>
              <span className="text-2xl font-mono text-cyan-400">
                {currentTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {/* <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-xs font-bold text-white">MK</div>
              <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-purple-600 flex items-center justify-center text-xs font-bold text-white">JD</div> */}
            </div>
            <button className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* View Container */}
        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeView === "dashboard" && (
                <Dashboard
                  stats={stats}
                  meetings={meetings}
                  onViewMeetings={() => setActiveView("meetings")}
                />
              )}
              {activeView === "meetings" && (
                <MeetingManager
                  meetings={meetings}
                  setMeetings={setMeetings}
                  currentTime={currentTime}
                />
              )}
              {activeView === "notes" && (
                <NotesManager notes={notes} setNotes={setNotes} />
              )}
              {activeView === "proceedings" && (
                <ProceedingsView
                  meetings={meetings}
                  onUpdateMeeting={(updated) =>
                    setMeetings((prev) =>
                      prev.map((m) => (m.id === updated.id ? updated : m)),
                    )
                  }
                />
              )}
              {activeView === "voice" && (
                <VoiceAssistantPanel
                  sessions={chatSessions}
                  setSessions={setChatSessions}
                  meetings={meetings}
                  setMeetings={setMeetings}
                  notes={notes}
                  setNotes={setNotes}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Voice Assistant Trigger (Floating) */}
        <button
          onClick={() => setActiveView("voice")}
          className="fixed bottom-8 right-8 w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-purple-500/40 hover:scale-110 active:scale-95 transition-all z-50 group"
        >
          <MessageSquare className="w-8 h-8 group-hover:scale-110 transition-transform" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full border-2 border-[#0f172a]"></div>
        </button>
      </main>
    </div>
  );
}
