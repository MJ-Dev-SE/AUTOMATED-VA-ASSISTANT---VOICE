/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, Dispatch, SetStateAction } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Pin, 
  PinOff, 
  StickyNote as StickyNoteIcon,
  X,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DailyNote, NoteColor } from '../types';
import { cn } from '../lib/utils';

interface NotesManagerProps {
  notes: DailyNote[];
  setNotes: Dispatch<SetStateAction<DailyNote[]>>;
}

const COLOR_MAP: Record<NoteColor, string> = {
  yellow: 'bg-yellow-400 text-yellow-950 border-yellow-500/50',
  blue: 'bg-blue-400 text-blue-950 border-blue-500/50',
  green: 'bg-emerald-400 text-emerald-950 border-emerald-500/50',
  pink: 'bg-pink-400 text-pink-950 border-pink-500/50',
};

export default function NotesManager({ notes, setNotes }: NotesManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<DailyNote | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: 'yellow' as NoteColor,
  });

  const sortedNotes = [...notes]
    .filter(n => 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingNote) {
      setNotes(notes.map(n => n.id === editingNote.id ? {
        ...n,
        title: formData.title,
        content: formData.content,
        color: formData.color,
      } : n));
    } else {
      const newNote: DailyNote = {
        id: Math.random().toString(36).substr(2, 9),
        title: formData.title,
        content: formData.content,
        color: formData.color,
        timestamp: new Date().toISOString(),
        pinned: false,
      };
      setNotes([newNote, ...notes]);
    }
    closeForm();
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingNote(null);
    setFormData({ title: '', content: '', color: 'yellow' });
  };

  const openEdit = (note: DailyNote) => {
    setEditingNote(note);
    setFormData({ title: note.title, content: note.content, color: note.color });
    setShowForm(true);
  };

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this note?')) {
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <StickyNoteIcon className="w-6 h-6 text-yellow-400" />
            Quick Notes
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">Jot down your thoughts for today</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-yellow-950 font-bold rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-yellow-400/10"
        >
          <Plus className="w-5 h-5" /> New Note
        </button>
      </div>

      {/* Search and Filters */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input 
          type="text" 
          placeholder="Filter notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#1e293b]/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-200 focus:ring-2 focus:ring-yellow-400/50 transition-all placeholder:text-slate-600"
        />
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {sortedNotes.length > 0 ? (
            sortedNotes.map((note) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => openEdit(note)}
                className={cn(
                  "group relative p-6 rounded-3xl cursor-pointer transition-all hover:-translate-y-1 hover:rotate-1",
                  COLOR_MAP[note.color],
                  "shadow-xl shadow-black/10"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <button 
                    onClick={(e) => togglePin(note.id, e)}
                    className="p-1.5 rounded-full hover:bg-black/10 transition-colors"
                  >
                    {note.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={(e) => deleteNote(note.id, e)}
                    className="p-1.5 rounded-full hover:bg-black/10 scale-0 group-hover:scale-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <h3 className="font-bold text-lg mb-2 line-clamp-1">{note.title || 'Untitled Note'}</h3>
                <p className="text-sm leading-relaxed line-clamp-6 opacity-90">{note.content}</p>
                
                <div className="mt-6 pt-4 border-t border-black/5 flex justify-between items-center opacity-60">
                  <span className="text-[10px] font-bold uppercase tracking-widest italic font-mono">
                    {new Date(note.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                  <StickyNoteIcon className="w-4 h-4" />
                </div>

                {note.pinned && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-black rounded-full flex items-center justify-center text-white scale-75 shadow-lg border-2 border-white/20">
                    <Pin className="w-4 h-4 fill-white" />
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-24 text-center">
              <div className="w-24 h-24 bg-slate-800/30 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-700">
                <StickyNoteIcon className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-bold text-slate-400">Empty pinboard</h3>
              <p className="text-slate-500 mt-3 max-w-sm mx-auto italic font-medium leading-relaxed">
                Take a moment to write down your ideas, reminders, or goals for today.
              </p>
              <button 
                onClick={() => setShowForm(true)}
                className="mt-8 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl transition-all"
              >
                Create First Note
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Note Form Dialog */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeForm}
              className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-800 mt-20 md:mt-0"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  {editingNote ? 'Edit Note' : 'Create Note'}
                  <div className={cn("w-3 h-3 rounded-full", COLOR_MAP[formData.color].split(' ')[0])}></div>
                </h3>
                <button onClick={closeForm} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveNote} className="space-y-6">
                <div className="space-y-2">
                  <input 
                    autoFocus
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    type="text" 
                    placeholder="Note Title..."
                    className="w-full bg-transparent border-b border-slate-800 px-0 py-4 text-2xl font-bold text-white placeholder:text-slate-700 focus:outline-none focus:border-yellow-400 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <textarea 
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    rows={6}
                    placeholder="Start typing your thoughts..."
                    className="w-full bg-slate-800/30 border border-slate-800 rounded-2xl p-6 text-slate-300 placeholder:text-slate-700 focus:ring-1 focus:ring-yellow-400/20 focus:border-transparent outline-none transition-all resize-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Palette className="w-4 h-4 text-slate-500" />
                    <div className="flex gap-2">
                      {(['yellow', 'blue', 'green', 'pink'] as NoteColor[]).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFormData({...formData, color: c})}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all",
                            COLOR_MAP[c].split(' ')[0],
                            formData.color === c ? "border-white ring-2 ring-slate-800" : "border-transparent"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-3 min-w-[200px]">
                    <button 
                      type="button"
                      onClick={closeForm}
                      className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={!formData.content.trim()}
                      className="flex-[2] py-3 px-6 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-yellow-950 rounded-xl font-bold shadow-lg shadow-yellow-400/10 transition-all"
                    >
                      {editingNote ? 'Update Note' : 'Save Note'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
