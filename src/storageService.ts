/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Meeting, DailyNote, VoiceChat } from './types';

const STORAGE_KEYS = {
  MEETINGS: 'smartassist_meetings',
  NOTES: 'smartassist_notes',
  VOICE_HISTORY: 'smartassist_voice_history',
};

export const storageService = {
  getMeetings: (): Meeting[] => {
    const data = localStorage.getItem(STORAGE_KEYS.MEETINGS);
    return data ? JSON.parse(data) : [];
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
  getVoiceHistory: (): VoiceChat[] => {
    const data = localStorage.getItem(STORAGE_KEYS.VOICE_HISTORY);
    return data ? JSON.parse(data) : [];
  },
  saveVoiceHistory: (history: VoiceChat[]) => {
    localStorage.setItem(STORAGE_KEYS.VOICE_HISTORY, JSON.stringify(history));
  },
};
