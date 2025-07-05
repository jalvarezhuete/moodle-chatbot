export enum AppStatus {
  AWAITING_UPLOAD,
  PROCESSING_PDFS,
  READY_TO_CHAT,
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