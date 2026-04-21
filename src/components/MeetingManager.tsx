/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, Dispatch, SetStateAction } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Users, 
  Video, 
  Phone, 
  MapPin, 
  Search, 
  Calendar as CalendarIcon,
  X,
  ChevronDown,
  AlertTriangle,
  Zap,
  Target,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Meeting, MeetingType, MeetingStatus, MeetingPriority } from '../types';
import { cn, formatDate, formatTime } from '../lib/utils';

interface MeetingManagerProps {
  meetings: Meeting[];
  setMeetings: Dispatch<SetStateAction<Meeting[]>>;
  currentTime: Date;
}

export default function MeetingManager({ meetings, setMeetings, currentTime }: MeetingManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<MeetingPriority | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    attendees: '',
    description: '',
    type: 'Video Call' as MeetingType,
    priority: 'Standard' as MeetingPriority
  });

  const filteredMeetings = meetings
    .filter(m => (statusFilter === 'ALL' || m.status === statusFilter))
    .filter(m => (priorityFilter === 'ALL' || m.priority === priorityFilter))
    .filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const handleAddMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    const newMeeting: Meeting = {
      id: Math.random().toString(36).substr(2, 9),
      title: formData.title,
      dateTime: `${formData.date}T${formData.time}`,
      attendees: formData.attendees.split(',').map(a => a.trim()).filter(a => a),
      description: formData.description,
      type: formData.type,
      priority: formData.priority,
      status: 'UPCOMING',
      createdAt: new Date().toISOString()
    };
    setMeetings([...meetings, newMeeting]);
    setShowForm(false);
    setFormData({ title: '', date: '', time: '', attendees: '', description: '', type: 'Video Call', priority: 'Standard' });
  };

  const deleteMeeting = (id: string) => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      setMeetings(meetings.filter(m => m.id !== id));
    }
  };

  const markAsDone = (id: string) => {
    setMeetings(meetings.map(m => m.id === id ? { ...m, status: 'DONE' } : m));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <CalendarIcon className="w-6 h-6 text-purple-500" />
          Schedule & Management
        </h2>
        <button 
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20"
        >
          <Plus className="w-5 h-5" /> Schedule New
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 bg-slate-800/30 p-4 rounded-3xl border border-slate-800">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-200 focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-slate-600"
          />
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status:</span>
            <div className="flex items-center gap-1">
              {['ALL', 'UPCOMING', 'IN_PROGRESS', 'DONE'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                    statusFilter === s ? "bg-purple-600 text-white" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="w-px h-4 bg-slate-700 hidden md:block" />
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Priority:</span>
            <div className="flex items-center gap-1">
              {['ALL', 'Urgent', 'Important', 'Standard', 'Personal'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                    priorityFilter === p ? "bg-cyan-500 text-white" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Meeting List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredMeetings.length > 0 ? (
            filteredMeetings.map((meeting) => (
              <motion.div
                key={meeting.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  "group relative p-6 rounded-3xl border transition-all h-full flex flex-col",
                  meeting.status === 'DONE' ? "bg-slate-900/30 border-slate-800 opacity-75" : "bg-slate-800/40 border-slate-800 hover:border-purple-500/50"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-2">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase w-fit",
                      meeting.status === 'DONE' ? "bg-green-500/10 text-green-400" : 
                      meeting.status === 'IN_PROGRESS' ? "bg-orange-500/10 text-orange-400" : 
                      "bg-blue-500/10 text-blue-400"
                    )}>
                      {meeting.status}
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase w-fit flex items-center gap-1.5",
                      meeting.priority === 'Urgent' ? "bg-red-500/10 text-red-400" : 
                      meeting.priority === 'Important' ? "bg-yellow-500/10 text-yellow-400" : 
                      meeting.priority === 'Personal' ? "bg-cyan-500/10 text-cyan-400" :
                      "bg-slate-500/10 text-slate-400"
                    )}>
                      {meeting.priority === 'Urgent' && <Zap className="w-3 h-3" />}
                      {meeting.priority === 'Important' && <AlertTriangle className="w-3 h-3" />}
                      {meeting.priority === 'Personal' && <UserIcon className="w-3 h-3" />}
                      {meeting.priority}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                    {meeting.type === 'Video Call' ? <Video className="w-4 h-4 text-cyan-400" /> : 
                     meeting.type === 'Phone Call' ? <Phone className="w-4 h-4 text-purple-400" /> : 
                     <MapPin className="w-4 h-4 text-orange-400" />}
                    <span className="text-[9px] font-bold uppercase">{meeting.type}</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">{meeting.title}</h3>
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">{meeting.description}</p>

                <div className="space-y-3 mt-auto">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
                    <Clock className="w-4 h-4 text-purple-400" />
                    {formatDate(meeting.dateTime)} at {formatTime(meeting.dateTime)}
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
                    <Users className="w-4 h-4 text-cyan-400" />
                    {meeting.attendees.length > 0 ? meeting.attendees.slice(0, 2).join(', ') : 'No attendees'}
                    {meeting.attendees.length > 2 && ` +${meeting.attendees.length - 2} more`}
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-2 pt-4 border-t border-slate-800">
                  {meeting.status !== 'DONE' && (
                    <button 
                      onClick={() => markAsDone(meeting.id)}
                      className="flex-1 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Done
                    </button>
                  )}
                  <button 
                    onClick={() => deleteMeeting(meeting.id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-600">
                <Search className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-400">No meetings found</h3>
              <p className="text-slate-500 mt-2 italic">Try adjusting your filters or schedule a new meeting</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Meeting Form Dialog */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#1e293b] rounded-3xl p-8 shadow-2xl border border-slate-800 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Schedule Meeting</h3>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddMeeting} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Meeting Title</label>
                  <input 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    type="text" 
                    placeholder="e.g., Weekly Sync"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Date</label>
                    <input 
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      type="date" 
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-4 text-white focus:ring-2 focus:ring-purple-500 transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Time</label>
                    <input 
                      required
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      type="time" 
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-4 text-white focus:ring-2 focus:ring-purple-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Attendees (comma separated)</label>
                  <input 
                    value={formData.attendees}
                    onChange={(e) => setFormData({...formData, attendees: e.target.value})}
                    type="text" 
                    placeholder="John Doe, Alice Smith"
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Meeting Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Video Call', 'In-Person', 'Phone Call'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({...formData, type: type as MeetingType})}
                        className={cn(
                          "py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2",
                          formData.type === type 
                            ? "bg-purple-600 border-purple-500 text-white" 
                            : "bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                        )}
                      >
                        {type === 'Video Call' ? <Video className="w-4 h-4" /> : type === 'Phone Call' ? <Phone className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                        {type.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Priority / Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Urgent', 'Important', 'Standard', 'Personal'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({...formData, priority: p as MeetingPriority})}
                        className={cn(
                          "py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2",
                          formData.priority === p 
                            ? "bg-cyan-600 border-cyan-500 text-white" 
                            : "bg-slate-900/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                        )}
                      >
                        {p === 'Urgent' && <Zap className="w-4 h-4" />}
                        {p === 'Important' && <AlertTriangle className="w-4 h-4" />}
                        {p === 'Personal' && <UserIcon className="w-4 h-4" />}
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Description / Agenda</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    placeholder="Briefly describe the goal..."
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/20 transition-all"
                  >
                    Confirm Schedule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
