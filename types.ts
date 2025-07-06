export enum AppStatus {
  READY,
  GENERATING_ANSWER,
}

export enum MessageSender {
  USER = 'user',
  BOT = 'bot',
}

export interface Source {
  uri: string;
  title: string;
}

export interface ChatMessage {
  id: string;
  sender: MessageSender;
  text: string;
  isStreaming?: boolean;
  sources?: Source[];
}

// Defines the structure for conversation history entries sent to the Gemini API
export interface GeminiHistoryEntry {
  role: 'user' | 'model';
  parts: { text: string }[];
}
