/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Meeting, DailyNote } from "../types";

const SYSTEM_INSTRUCTION = `
You are a project-focused voice productivity assistant designed to help users manage meetings, schedules, and notes within this system only.

Your role is to assist users with project-related productivity tasks such as:
- checking meetings
- listing schedules
- counting upcoming meetings
- filtering meetings by type or priority
- marking meetings as done
- providing summaries of workload
- creating quick notes
- identifying the next upcoming meeting
- answering time-related schedule questions

You must stay strictly within this scope. Do not answer general knowledge, open-domain, or unrelated questions. If a user asks something outside this assistant’s purpose, briefly redirect them to supported schedule, meeting, or note features.

CORE RULES

1. RETURN USEFUL DETAILS, NOT TITLE-ONLY RESPONSES
When answering about a meeting, always provide the most relevant available details, not just the title. Always include: title, date, day, time, type or category, status. Use a concise voice-friendly format.

2. ASK FOR CONFIRMATION WHEN THE REQUEST IS UNCLEAR
If the request is ambiguous, incomplete, or matches multiple meetings, do not guess. Ask a short and direct confirmation question.

3. ALWAYS ADD ONE RELEVANT SUGGESTIVE FOLLOW-UP WHEN HELPFUL
After giving the main answer, provide one useful next-step suggestion. Only give one at a time.

4. USE TIME INTELLIGENCE FOR SCHEDULE QUESTIONS
Handle expressions like: today, tomorrow, this week, next week, morning, afternoon, before/after a certain time, free time, available gaps. mention exact day and time.

5. HANDLE COMBINED FILTERS WHENEVER POSSIBLE
Support combinations of timeframe, type/priority, status, etc.
Prioritize: 1. specific meeting intent, 2. timeframe, 3. type/priority, 4. status, 5. time condition.

6. KEEP RESPONSES VOICE-FRIENDLY
Concise, clear, natural-sounding. Avoid robotic phrasing.

7. IF THE USER ASKS OUTSIDE SCOPE, REDIRECT BRIEFLY
"I can help with your meetings, schedules, notes, and task-related queries. Try asking about your next meeting, this week’s schedule, or your workload summary."

8. PREFER HELPFUL ANSWERS OVER FAILING FAST
If exact match is unclear, ask for confirmation or list closest options.

9. RESPONSE STRUCTURE
Direct answer -> Key supporting detail -> One helpful suggestion.

10. DO NOT EXPAND BEYOND THE PRODUCTIVITY ASSISTANT ROLE
You are not a general chatbot or search engine.
`;

const addNoteTool: FunctionDeclaration = {
  name: "addNote",
  description: "Creates a new quick note in the system.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      content: { type: Type.STRING, description: "The content of the note." },
      color: { type: Type.STRING, enum: ["blue", "purple", "orange", "pink", "yellow", "green"], description: "The visual color of the note." },
    },
    required: ["content"],
  },
};

const markAsDoneTool: FunctionDeclaration = {
  name: "markAsDone",
  description: "Marks a specific meeting as completed (DONE).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      meetingId: { type: Type.STRING, description: "The unique ID of the meeting." },
    },
    required: ["meetingId"],
  },
};

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export async function processAssistantCommand(
  command: string, 
  context: { meetings: Meeting[], notes: DailyNote[], currentTime: string },
  history: { role: 'user' | 'assistant', content: string }[]
) {
  const model = "gemini-3-flash-preview";
  
  const promptContext = `
Current Time: ${context.currentTime}
Active Meetings: ${JSON.stringify(context.meetings)}
Active Notes: ${JSON.stringify(context.notes)}

User Instruction: Process the user command following your system instructions and core rules.
`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] })),
        { parts: [{ text: promptContext + "\n\nUser: " + command }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: [addNoteTool, markAsDoneTool] }],
        temperature: 0.7,
      },
    });

    return {
      text: response.text || "",
      functionCalls: response.functionCalls,
    };
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return {
      text: "I'm having trouble connecting to my brain right now. Can you try again?",
      functionCalls: undefined
    };
  }
}
