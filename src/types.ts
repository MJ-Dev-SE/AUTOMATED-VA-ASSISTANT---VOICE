/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MeetingType = 'Video Call' | 'In-Person' | 'Phone Call';

export type MeetingStatus = 'UPCOMING' | 'IN_PROGRESS' | 'DONE';

export type MeetingPriority = 'Urgent' | 'Important' | 'Standard' | 'Personal';

export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface MeetingProceedings {
  minutes: string;
  actionItems: ActionItem[];
  decisions: string;
  nextSteps: string;
}

export interface Meeting {
  id: string;
  title: string;
  dateTime: string; // ISO string
  attendees: string[];
  description: string;
  type: MeetingType;
  priority: MeetingPriority;
  status: MeetingStatus;
  proceedings?: MeetingProceedings;
  createdAt: string;
}

export type NoteColor = 'yellow' | 'blue' | 'green' | 'pink';

export interface DailyNote {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  timestamp: string;
  pinned: boolean;
}

export interface VoiceChat {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: VoiceChat[];
  timestamp: string;
}
