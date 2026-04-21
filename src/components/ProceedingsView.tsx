/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  ChevronRight, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ListTodo,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Meeting, MeetingProceedings, ActionItem } from '../types';
import { cn, formatDate, formatTime } from '../lib/utils';

interface ProceedingsViewProps {
  meetings: Meeting[];
  onUpdateMeeting: (meeting: Meeting) => void;
}

export default function ProceedingsView({ meetings, onUpdateMeeting }: ProceedingsViewProps) {
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);

  const doneInProgressMeetings = meetings
    .filter(m => m.status !== 'UPCOMING')
    .filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  const handleUpdateProceedings = (proceedings: MeetingProceedings) => {
    if (!selectedMeeting) return;
    onUpdateMeeting({
      ...selectedMeeting,
      proceedings
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-200px)]">
      {/* List Panel */}
      <div className="lg:col-span-4 space-y-6 flex flex-col">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="w-6 h-6 text-cyan-400" />
            Meeting Records
          </h2>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1e293b]/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {doneInProgressMeetings.length > 0 ? (
            doneInProgressMeetings.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMeetingId(m.id)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl border transition-all cursor-pointer group",
                  selectedMeetingId === m.id 
                    ? "bg-cyan-500/10 border-cyan-500/50 ring-1 ring-cyan-500/50 shadow-lg shadow-cyan-500/10" 
                    : "bg-slate-800/30 border-slate-800 hover:border-slate-700"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                    {formatDate(m.dateTime).split(',')[1].trim()}
                  </span>
                  <div className={cn(
                    "px-2 py-0.5 rounded text-[8px] font-bold uppercase",
                    m.status === 'DONE' ? "bg-green-500/10 text-green-400" : "bg-orange-500/10 text-orange-400"
                  )}>
                    {m.status}
                  </div>
                </div>
                <h4 className={cn("font-bold transition-colors mb-1", selectedMeetingId === m.id ? "text-cyan-400" : "text-white group-hover:text-cyan-400")}>{m.title}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <Clock className="w-3 h-3" />
                  {formatTime(m.dateTime)}
                  {m.proceedings && <span className="flex items-center gap-1 text-cyan-500/60 ml-auto"><CheckCircle2 className="w-3 h-3" /> Recorded</span>}
                </div>
              </button>
            ))
          ) : (
            <div className="py-12 text-center">
              <p className="text-slate-500 text-sm italic">No completed meetings yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Editor Panel */}
      <div className="lg:col-span-8 bg-[#1e293b]/30 rounded-3xl border border-slate-800 flex flex-col overflow-hidden">
        {selectedMeeting ? (
          <ProceedingsEditor 
            meeting={selectedMeeting} 
            onSave={handleUpdateProceedings} 
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8 text-center">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-500 mb-2">Editor Ready</h3>
            <p className="max-w-xs mx-auto italic font-medium">Select a meeting from the list to start documenting proceedings and action items.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProceedingsEditor({ meeting, onSave }: { meeting: Meeting, onSave: (p: MeetingProceedings) => void }) {
  const [minutes, setMinutes] = useState(meeting.proceedings?.minutes || '');
  const [decisions, setDecisions] = useState(meeting.proceedings?.decisions || '');
  const [nextSteps, setNextSteps] = useState(meeting.proceedings?.nextSteps || '');
  const [actionItems, setActionItems] = useState<ActionItem[]>(meeting.proceedings?.actionItems || []);
  const [newActionItem, setNewActionItem] = useState('');
  const [isSaved, setIsSaved] = useState(true);

  const addActionItem = () => {
    if (!newActionItem.trim()) return;
    setActionItems([...actionItems, { id: Math.random().toString(), text: newActionItem, completed: false }]);
    setNewActionItem('');
    setIsSaved(false);
  };

  const toggleActionItem = (id: string) => {
    setActionItems(actionItems.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
    setIsSaved(false);
  };

  const deleteActionItem = (id: string) => {
    setActionItems(actionItems.filter(item => item.id !== id));
    setIsSaved(false);
  };

  const handleSave = () => {
    onSave({
      minutes,
      actionItems,
      decisions,
      nextSteps
    });
    setIsSaved(true);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{meeting.title}</h3>
          <p className="text-sm text-slate-500 font-medium">{formatDate(meeting.dateTime)} | {meeting.attendees.length} Attendees</p>
        </div>
        <button 
          onClick={handleSave}
          className={cn(
            "px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg",
            isSaved ? "bg-slate-700 text-slate-400 cursor-not-allowed" : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/20"
          )}
          disabled={isSaved}
        >
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
        {/* Minutes */}
        <section className="space-y-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            Meeting Minutes
          </h4>
          <textarea 
            value={minutes}
            onChange={(e) => { setMinutes(e.target.value); setIsSaved(false); }}
            placeholder="Type long-form meeting notes here..."
            className="w-full bg-slate-900/50 border border-slate-800 rounded-3xl p-6 text-slate-300 placeholder:text-slate-700 focus:ring-1 focus:ring-cyan-500/30 outline-none transition-all resize-none min-h-[200px]"
          />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Decisions */}
          <section className="space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Key Decisions
            </h4>
            <textarea 
              value={decisions}
              onChange={(e) => { setDecisions(e.target.value); setIsSaved(false); }}
              placeholder="What was decided?"
              className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-slate-300 placeholder:text-slate-700 focus:ring-1 focus:ring-green-500/30 outline-none transition-all resize-none min-h-[150px]"
            />
          </section>

          {/* Next Steps */}
          <section className="space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-purple-400" />
              General Next Steps
            </h4>
            <textarea 
              value={nextSteps}
              onChange={(e) => { setNextSteps(e.target.value); setIsSaved(false); }}
              placeholder="Immediate follow-ups..."
              className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-slate-300 placeholder:text-slate-700 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all resize-none min-h-[150px]"
            />
          </section>
        </div>

        {/* Action Items */}
        <section className="space-y-6">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-cyan-400" />
            Action Items Checklist
          </h4>
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {actionItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-4 bg-slate-900/30 p-4 rounded-2xl border border-slate-800 group"
                >
                  <button 
                    onClick={() => toggleActionItem(item.id)}
                    className={cn(
                      "w-6 h-6 rounded-lg border flex items-center justify-center transition-all",
                      item.completed ? "bg-cyan-500 border-cyan-500" : "border-slate-600 hover:border-cyan-500"
                    )}
                  >
                    {item.completed && <CheckCircle2 className="w-4 h-4 text-[#0f172a]" />}
                  </button>
                  <span className={cn("flex-1 text-sm transition-all", item.completed ? "text-slate-500 line-through" : "text-slate-300")}>
                    {item.text}
                  </span>
                  <button 
                    onClick={() => deleteActionItem(item.id)}
                    className="p-2 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="flex gap-2">
              <input 
                value={newActionItem}
                onChange={(e) => setNewActionItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addActionItem()}
                placeholder="Add a new task..."
                className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyan-500 transition-all"
              />
              <button 
                onClick={addActionItem}
                className="px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
