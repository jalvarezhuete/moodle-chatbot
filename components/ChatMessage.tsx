import React from 'react';
import { ChatMessage, MessageSender, Source } from '../types';
import { BotIcon, UserIcon } from '../constants';

interface ChatMessageProps {
  message: ChatMessage;
}

const ChatMessageBubble: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === MessageSender.USER;

  const thinkingCursor = message.isStreaming ? '<span class="animate-pulse">▍</span>' : '';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
          <BotIcon />
        </div>
      )}

      <div
        className={`max-w-xl p-4 rounded-2xl flex flex-col ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-lg'
            : 'bg-gray-200 text-gray-800 rounded-bl-lg'
        }`}
      >
        <div 
          className="prose prose-sm max-w-none" 
          dangerouslySetInnerHTML={{ __html: message.text.replace(/\n/g, '<br />') + thinkingCursor }} 
        />
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-300">
            <h4 className="font-semibold text-xs mb-2">Fuentes:</h4>
            <ol className="list-decimal list-inside space-y-1">
              {message.sources.map((source, index) => (
                <li key={index} className="text-xs truncate">
                  <a 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:underline"
                    title={source.title}
                  >
                    {source.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
          <UserIcon />
        </div>
      )}
    </div>
  );
};

export default ChatMessageBubble;