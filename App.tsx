import React, { useState, useCallback, useEffect } from 'react';
import { AppStatus, ChatMessage, MessageSender, Source, GeminiHistoryEntry } from './types';
import { AppTitle, MoodleIcon, TrashIcon } from './constants';
import ChatInterface from './components/ChatInterface';
import { getMoodleAnswerStream } from './services/geminiService';

const initialBotMessage: ChatMessage = {
  id: 'initial-bot-message',
  sender: MessageSender.BOT,
  text: '¡Hola! Soy tu asistente experto en Moodle. Mi conocimiento se basa en la documentación oficial y puedo buscar en la web para temas específicos. ¿En qué puedo ayudarte hoy?',
};

export default function App() {
  const [status, setStatus] = useState<AppStatus>(AppStatus.READY);
  const [messages, setMessages] = useState<ChatMessage[]>([initialBotMessage]);

  const handleSendMessage = useCallback(async (prompt: string) => {
    if (!prompt.trim() || status === AppStatus.GENERATING_ANSWER) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: MessageSender.USER,
      text: prompt,
    };
    
    const botMessageId = `bot-${Date.now()}`;
    const botMessagePlaceholder: ChatMessage = {
      id: botMessageId,
      sender: MessageSender.BOT,
      text: '',
      isStreaming: true,
      sources: [],
    };

    const currentMessages = [...messages, userMessage, botMessagePlaceholder];
    setMessages(currentMessages);
    setStatus(AppStatus.GENERATING_ANSWER);

    // Construct history for the API, excluding the placeholder message
    const history: GeminiHistoryEntry[] = currentMessages
      .slice(0, -1) // Exclude the bot placeholder
      .map(msg => ({
          role: msg.sender === MessageSender.USER ? 'user' : 'model',
          parts: [{ text: msg.text }]
      }));

    try {
      const stream = getMoodleAnswerStream(prompt, history);
      const sourceMap = new Map<string, Source>();
      
      for await (const chunk of stream) {
          const chunkText = chunk.text;
          setMessages(prev =>
              prev.map(msg =>
                  msg.id === botMessageId
                      ? { ...msg, text: msg.text + chunkText }
                      : msg
              )
          );
          
          const metadata = chunk.candidates?.[0]?.groundingMetadata;
          if (metadata?.groundingChunks) {
              for (const a of metadata.groundingChunks) {
                if (a.web) {
                    if (!sourceMap.has(a.web.uri)) {
                        sourceMap.set(a.web.uri, { uri: a.web.uri, title: a.web.title || a.web.uri });
                    }
                }
              }
          }
      }
      
      const finalSources = Array.from(sourceMap.values());

      setMessages(prev =>
        prev.map(msg =>
          msg.id === botMessageId ? { ...msg, isStreaming: false, sources: finalSources.length > 0 ? finalSources : undefined } : msg
        )
      );

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error("Error generating answer:", e);
      const errorBotMessage: ChatMessage = {
          id: botMessageId,
          sender: MessageSender.BOT,
          text: `Lo siento, encontré un error: ${errorMessage}`
      }
      setMessages(prev => [...prev.slice(0, -1), errorBotMessage]);
    } finally {
      setStatus(AppStatus.READY);
    }
  }, [messages, status]);

  const handleClearChat = useCallback(() => {
    setMessages([
      {
        ...initialBotMessage,
        id: `initial-bot-message-${Date.now()}`,
      }
    ]);
  }, []);

  return (
    <div className="flex flex-col h-screen font-sans bg-gray-50 text-gray-800">
      <header className="flex items-center p-4 border-b border-gray-200 bg-white shadow-sm">
        <MoodleIcon />
        <h1 className="text-xl font-bold ml-3">{AppTitle}</h1>
        <div className="ml-auto flex items-center space-x-3">
            <button onClick={handleClearChat} className="flex items-center space-x-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg text-sm transition-colors">
            <TrashIcon />
            <span>Borrar Chat</span>
            </button>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-4xl h-full flex flex-col">
          <ChatInterface 
            messages={messages} 
            onSendMessage={handleSendMessage}
            isSending={status === AppStatus.GENERATING_ANSWER}
          />
        </div>
      </main>

       <footer className="text-center p-3 text-xs text-gray-400 border-t border-gray-200 bg-white">
        Desarrollado con la API de Gemini. Las respuestas se basan en conocimiento precargado de Moodle y búsquedas web.
      </footer>
    </div>
  );
}
