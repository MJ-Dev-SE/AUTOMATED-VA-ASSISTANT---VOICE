/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  useState,
  useEffect,
  useRef,
  Dispatch,
  SetStateAction,
} from "react";
import {
  Send,
  Trash2,
  Plus,
  Trash,
  History,
  BrainCircuit,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Volume2,
  X,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Meeting,
  DailyNote,
  VoiceChat,
  ChatSession,
  MeetingStatus,
} from "../types";
import { cn } from "../lib/utils";
import { processAssistantCommand } from "../lib/aiAssistant";

interface VoiceAssistantPanelProps {
  sessions: ChatSession[];
  setSessions: Dispatch<SetStateAction<ChatSession[]>>;
  meetings: Meeting[];
  setMeetings: Dispatch<SetStateAction<Meeting[]>>;
  notes: DailyNote[];
  setNotes: Dispatch<SetStateAction<DailyNote[]>>;
}

export default function VoiceAssistantPanel({
  sessions,
  setSessions,
  meetings,
  setMeetings,
  notes,
  setNotes,
}: VoiceAssistantPanelProps) {
  const [inputText, setInputText] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize with at least one session if none exist
  useEffect(() => {
    if (sessions.length === 0) {
      const newSession: ChatSession = {
        id: Math.random().toString(),
        title: "New Chat",
        messages: [],
        timestamp: new Date().toISOString(),
      };
      setSessions([newSession]);
      setActiveSessionId(newSession.id);
    } else if (!activeSessionId) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId, setSessions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions, activeSessionId]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ||
    sessions[0] || { messages: [], title: "New Chat" };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsAssistantSpeaking(true);
    utterance.onend = () => setIsAssistantSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const addMessage = (role: "user" | "assistant", content: string) => {
    if (!activeSessionId) return;

    const newMessage: VoiceChat = {
      id: Math.random().toString(),
      role,
      content,
      timestamp: new Date().toISOString(),
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          const newMessages = [...s.messages, newMessage];
          let newTitle = s.title;
          // Auto-update title on first user message
          if (role === "user" && s.messages.length === 0) {
            newTitle =
              content.slice(0, 30) + (content.length > 30 ? "..." : "");
          }
          return { ...s, messages: newMessages, title: newTitle };
        }
        return s;
      }),
    );

    if (role === "assistant") {
      speak(content);
    }
  };

  const handleUserCommand = async (command: string) => {
    try {
      console.log("👤 USER COMMAND:", command);

      setIsThinking(true);

      const history = activeSession.messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      console.log("📜 Sending history:", history);

      const result = await processAssistantCommand(
        command,
        {
          meetings,
          notes,
          currentTime: new Date().toString(),
        },
        history,
      );

      console.log("🤖 Assistant RESULT:", result);

      const handledActions: string[] = [];

      if (result.functionCalls) {
        console.log("⚙️ FUNCTION CALLS DETECTED:", result.functionCalls);

        for (const call of result.functionCalls) {
          console.log("👉 Processing call:", call);

          if (call.name === "addNote") {
            const args = (call.args || {}) as any;
            const { content, color = "blue" } = args;

            if (content) {
              const newNote: DailyNote = {
                id: Math.random().toString(),
                title: "AI Note",
                content,
                color,
                timestamp: new Date().toISOString(),
                pinned: true,
              };
              setNotes((prev) => [newNote, ...prev]);
              handledActions.push("I added your note.");
            } else {
              console.warn("⚠️ addNote missing content:", args);
            }
          } else if (call.name === "markAsDone") {
            const args = (call.args || {}) as any;
            const { meetingId } = args;

            if (meetingId) {
              setMeetings((prev) =>
                prev.map((m) =>
                  m.id === meetingId ? { ...m, status: "DONE" } : m,
                ),
              );
              handledActions.push("I marked the meeting as done.");
            } else {
              console.warn("⚠️ markAsDone missing meetingId:", args);
            }
          }
        }
      }

      // 🔥 IMPORTANT: fallback response
      if (result.text && result.text.trim()) {
        console.log("🗣️ Using TEXT response");
        addMessage("assistant", result.text);
      } else if (handledActions.length > 0) {
        console.log("🗣️ Using ACTION fallback:", handledActions);
        addMessage("assistant", handledActions.join(" "));
      } else {
        console.warn("⚠️ NO TEXT AND NO ACTION");
        addMessage("assistant", "Sorry, I did not get a usable response.");
      }
    } catch (error) {
      console.error("❌ handleUserCommand ERROR:", error);
      addMessage("assistant", "Something went wrong.");
    } finally {
      setIsThinking(false);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isThinking) return;

    const message = inputText.trim();
    setInputText("");
    addMessage("user", message);
    handleUserCommand(message);
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Math.random().toString(),
      title: "New Chat",
      messages: [],
      timestamp: new Date().toISOString(),
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setShowHistory(false);
  };

  const deleteActiveSession = () => {
    if (
      window.confirm(
        "Are you sure you want to delete this conversation to trash?",
      )
    ) {
      if (sessions.length === 1) {
        setSessions([{ ...sessions[0], messages: [], title: "New Chat" }]);
        return;
      }
      const newSessions = sessions.filter((s) => s.id !== activeSessionId);
      setSessions(newSessions);
      setActiveSessionId(newSessions[0].id);
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)] bg-[#1e293b]/30 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative">
      {/* Session History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="absolute inset-y-0 left-0 w-72 bg-slate-900 border-r border-slate-800 z-30 shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" />
                Chat History
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    setActiveSessionId(session.id);
                    setShowHistory(false);
                  }}
                  className={cn(
                    "w-full text-left p-3 rounded-xl transition-all group relative border border-transparent",
                    activeSessionId === session.id
                      ? "bg-purple-600/20 border-purple-500/30 text-white"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                  )}
                >
                  <p className="text-sm font-medium truncate pr-4">
                    {session.title}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">
                    {new Date(session.timestamp).toLocaleDateString()}
                  </p>
                  {activeSessionId === session.id && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col relative">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <BrainCircuit className="w-64 h-64 text-purple-500" />
        </div>

        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(true)}
              className="p-2 text-slate-400 hover:bg-slate-800 rounded-xl transition-all"
            >
              <History className="w-6 h-6" />
            </button>
            <div className="w-px h-6 bg-slate-800 mx-1" />
            <div className="w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white leading-none">
                Smart Assistant
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isAssistantSpeaking
                      ? "bg-cyan-500 animate-pulse"
                      : "bg-green-500",
                  )}
                ></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {isAssistantSpeaking ? "AI Speaking..." : "Assistant Ready"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={createNewSession}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
              title="New Conversation (Archive past)"
            >
              <Plus className="w-4 h-4" />
              New Convo
            </button>
            <button
              onClick={deleteActiveSession}
              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
              title="Delete to Trash"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat History Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar z-10"
        >
          {activeSession.messages.length > 0 ? (
            activeSession.messages.map((chat) => (
              <motion.div
                layout
                key={chat.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex gap-4 max-w-[85%]",
                  chat.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto",
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                    chat.role === "user" ? "bg-slate-700" : "bg-purple-600",
                  )}
                >
                  {chat.role === "user" ? (
                    <MessageSquare className="w-4 h-4 text-white" />
                  ) : (
                    <BrainCircuit className="w-4 h-4 text-white" />
                  )}
                </div>
                <div
                  className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed",
                    chat.role === "user"
                      ? "bg-slate-800 text-slate-200 rounded-tr-none"
                      : "bg-purple-600/20 text-slate-100 border border-purple-500/30 rounded-tl-none shadow-lg shadow-purple-500/5",
                  )}
                >
                  {chat.content}
                  <div
                    className={cn(
                      "text-[9px] font-bold uppercase tracking-widest mt-2 opacity-40",
                      chat.role === "user" ? "text-right" : "text-left",
                    )}
                  >
                    {new Date(chat.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
                <MessageSquare className="w-12 h-12 text-purple-400 z-10" />
                <div className="absolute inset-0 border-2 border-purple-500/20 rounded-full animate-ping"></div>
              </motion.div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {activeSession.title === "New Chat"
                  ? "Ready for a new start?"
                  : activeSession.title}
              </h3>
              <p className="text-slate-500 max-w-sm font-medium italic">
                Type your command below to manage meetings or notes.
              </p>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-6 border-t border-slate-800 bg-[#0f172a]/40 backdrop-blur-md z-10">
          <form
            onSubmit={handleSendMessage}
            className="relative flex items-center gap-3"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isThinking}
              placeholder={
                isThinking
                  ? "Smart Assistant is thinking..."
                  : "How can I assist you today?"
              }
              className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-2xl py-4 px-6 text-white text-sm placeholder:text-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isThinking}
              className={cn(
                "p-4 rounded-2xl flex items-center justify-center transition-all",
                inputText.trim() && !isThinking
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95"
                  : "bg-slate-800 text-slate-500",
              )}
            >
              {isThinking ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>

          <div className="flex items-center justify-between mt-4 px-1">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: isAssistantSpeaking
                        ? [2, Math.random() * 12 + 4, 2]
                        : 2,
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                    className={cn(
                      "w-0.5 rounded-full",
                      isAssistantSpeaking ? "bg-cyan-400" : "bg-slate-700",
                    )}
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {isAssistantSpeaking
                  ? "AI Speaker Active"
                  : "Assistant Output Ready"}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-purple-500/50" />
              Real-time Processing
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
