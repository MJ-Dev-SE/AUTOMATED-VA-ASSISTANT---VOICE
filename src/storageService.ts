/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Meeting, DailyNote, VoiceChat, ChatSession } from './types';

const STORAGE_KEYS = {
  MEETINGS: 'smartassist_meetings',
  NOTES: 'smartassist_notes',
  CHAT_SESSIONS: 'smartassist_chat_sessions',
};

export const storageService = {
  getMeetings: (): Meeting[] => {
    const data = localStorage.getItem(STORAGE_KEYS.MEETINGS);
    if (!data) return [];
    try {
      const meetings: Meeting[] = JSON.parse(data);
      // Ensure existing meetings have a priority
      return meetings.map(m => ({
        ...m,
        priority: m.priority || 'Standard'
      }));
    } catch (e) {
      console.error('Failed to parse meetings', e);
      return [];
    }
  },
  saveMeetings: (meetings: Meeting[]) => {
    localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(meetings));
  },
  getNotes: (): DailyNote[] => {
    const data = localStorage.getItem(STORAGE_KEYS.NOTES);
    return data ? JSON.parse(data) : [];
  },
  saveNotes: (notes: DailyNote[]) => {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
  },
  getChatSessions: (): ChatSession[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CHAT_SESSIONS);
    return data ? JSON.parse(data) : [];
  },
  saveChatSessions: (sessions: ChatSession[]) => {
    localStorage.setItem(STORAGE_KEYS.CHAT_SESSIONS, JSON.stringify(sessions));
  },
};
