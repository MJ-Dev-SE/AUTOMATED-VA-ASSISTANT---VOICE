/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, CheckCircle2, Clock, StickyNote, ArrowRight, Video, Phone, User, Zap, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { Meeting } from '../types';
import { cn, formatTime } from '../lib/utils';

interface DashboardProps {
  stats: {
    total: number;
    completed: number;
    pending: number;
    notesCount: number;
  };
  meetings: Meeting[];
  onViewMeetings: () => void;
}

export default function Dashboard({ stats, meetings, onViewMeetings }: DashboardProps) {
  const today = new Date().toISOString().split('T')[0];
  const todayMeetingsSorted = [...meetings]
    .filter(m => m.dateTime.startsWith(today))
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const statCards = [
    { label: 'Today\'s Meetings', value: stats.total, icon: Calendar, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    { label: 'Daily Notes', value: stats.notesCount, icon: StickyNote, color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn("p-6 rounded-3xl border border-slate-800 bg-[#1e293b]/50 backdrop-blur-sm", stat.color)}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold">{stat.value}</h3>
              </div>
              <div className={cn("p-3 rounded-2xl", stat.color.split(' ')[0])}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline View */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              Today's Timeline
            </h3>
            <button 
              onClick={onViewMeetings}
              className="text-sm font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative pl-8 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
            {todayMeetingsSorted.length > 0 ? (
              todayMeetingsSorted.map((meeting, i) => {
                const startTime = new Date(meeting.dateTime);
                const isNow = Math.abs(new Date().getTime() - startTime.getTime()) < 30 * 60 * 1000;
                
                return (
                  <div key={meeting.id} className="relative">
                    <div className={cn(
                      "absolute -left-[27px] top-1.5 w-4 h-4 rounded-full border-4 border-[#0f172a] z-10",
                      meeting.status === 'DONE' ? "bg-green-500" : isNow ? "bg-cyan-400 animate-pulse" : "bg-slate-700"
                    )} />
                    
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        "p-5 rounded-2xl border transition-all",
                        isNow 
                          ? "bg-cyan-500/10 border-cyan-500/30 ring-1 ring-cyan-500/50" 
                          : "bg-slate-800/40 border-slate-800 hover:border-slate-700"
                      )}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                          {formatTime(meeting.dateTime)}
                        </span>
                        <div className="flex gap-2">
                          {meeting.priority !== 'Standard' && (
                            <div className={cn(
                              "px-2 py-1 rounded-md text-[9px] font-bold tracking-tighter uppercase flex items-center gap-1",
                              meeting.priority === 'Urgent' ? "bg-red-500/10 text-red-400" : 
                              meeting.priority === 'Important' ? "bg-yellow-500/10 text-yellow-400" : 
                              "bg-cyan-500/10 text-cyan-400"
                            )}>
                              {meeting.priority === 'Urgent' ? <Zap className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                              {meeting.priority}
                            </div>
                          )}
                          <div className={cn(
                            "px-2 py-1 rounded-md text-[9px] font-bold tracking-tighter uppercase",
                            meeting.status === 'DONE' ? "bg-green-500/10 text-green-400" : 
                            meeting.status === 'IN_PROGRESS' ? "bg-orange-500/10 text-orange-400" : 
                            "bg-blue-500/10 text-blue-400"
                          )}>
                            {meeting.status}
                          </div>
                        </div>
                      </div>
                      <h4 className="font-bold text-lg text-white mb-2">{meeting.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-1.5">
                          {meeting.type === 'Video Call' ? <Video className="w-4 h-4" /> : 
                           meeting.type === 'Phone Call' ? <Phone className="w-4 h-4" /> : 
                           <User className="w-4 h-4" />}
                          {meeting.type}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="w-4 h-4" />
                          {meeting.attendees.length} Attendees
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center bg-slate-900/50 rounded-3xl border border-dashed border-slate-800">
                <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No meetings scheduled for today</p>
                <button onClick={onViewMeetings} className="mt-4 text-purple-400 font-bold hover:underline">Schedule One</button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Summary Right */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-purple-900/20 to-transparent">
            <h4 className="font-bold text-white mb-4">Smart Assistant</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              New: Ask about "urgent meetings this week" or "how many meetings next week"! My AI can now filter and count your schedule.
            </p>
            <button 
              onClick={onViewMeetings} // Or something else, but let's just make it look good
              className="mt-4 w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition-colors"
            >
              Chat with AI
            </button>
          </div>

          <div className="p-6 rounded-3xl border border-slate-800 bg-[#1e293b]/30">
            <h4 className="font-bold text-white mb-4">Pending Tasks</h4>
            <div className="space-y-3">
              {[
                { label: 'Follow up with design team', icon: CheckCircle2, done: false },
                { label: 'Send meeting minutes to John', icon: CheckCircle2, done: true },
                { label: 'Prepare for quarterly review', icon: CheckCircle2, done: false },
              ].map((task, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
                  <div className={cn("w-5 h-5 rounded border flex items-center justify-center", task.done ? "bg-green-500 border-green-500" : "border-slate-600")}>
                    {task.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <span className={cn("text-sm", task.done ? "text-slate-500 line-through" : "text-slate-300")}>{task.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
