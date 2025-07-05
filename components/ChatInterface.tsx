import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import ChatMessageBubble from './ChatMessage';
import { SendIcon, LoadingSpinner } from '../constants';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (prompt: string) => void;
  isSending: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isSending }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isSending) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-white rounded-lg shadow-md">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex flex-col space-y-4">
          {messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Haz una pregunta sobre Moodle..."
            className="flex-1 p-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow placeholder:text-gray-400"
            disabled={isSending}
            aria-label="Chat input"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="bg-orange-500 text-white rounded-lg p-3 h-12 w-12 flex items-center justify-center
                       hover:bg-orange-600 transition-colors
                       disabled:bg-orange-300 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            {isSending ? <LoadingSpinner /> : <SendIcon />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
