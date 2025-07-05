
import React, { useState, useCallback } from 'react';
import { AppStatus, ChatMessage, MessageSender, Source } from './types';
import { AppTitle, MoodleIcon, TrashIcon, ReloadIcon } from './constants';
import PdfUploader from './components/PdfUploader';
import ChatInterface from './components/ChatInterface';
import { getMoodleAnswerStream } from './services/geminiService';

export default function App() {
  const [status, setStatus] = useState<AppStatus>(AppStatus.AWAITING_UPLOAD);
  const [knowledgeBase, setKnowledgeBase] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const initialBotMessageText = "Tu documentación de Moodle ha sido procesada. Estoy listo para responder tus preguntas basándome en lo que has proporcionado.";

  const handleDocumentsProcessed = useCallback((text: string) => {
    setKnowledgeBase(text);
    setStatus(AppStatus.READY_TO_CHAT);
    setMessages([
      {
        id: 'initial-bot-message',
        sender: MessageSender.BOT,
        text: initialBotMessageText,
      },
    ]);
  }, [initialBotMessageText]);

  const handleProcessingStart = useCallback(() => {
    setStatus(AppStatus.PROCESSING_PDFS);
    setError(null);
  }, []);

  const handleProcessingError = useCallback((errorMessage: string) => {
      setError(errorMessage);
      setStatus(AppStatus.AWAITING_UPLOAD);
  }, []);

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

    setMessages(prev => [...prev, userMessage, botMessagePlaceholder]);
    setStatus(AppStatus.GENERATING_ANSWER);
    setError(null);

    try {
      const stream = getMoodleAnswerStream(prompt, knowledgeBase);
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
      setStatus(AppStatus.READY_TO_CHAT);
    }
  }, [knowledgeBase, status]);

  const handleReset = useCallback(() => {
    setStatus(AppStatus.AWAITING_UPLOAD);
    setKnowledgeBase('');
    setMessages([]);
    setError(null);
  }, []);

  const handleClearChat = useCallback(() => {
    setMessages([
      {
        id: 'initial-bot-message-cleared',
        sender: MessageSender.BOT,
        text: initialBotMessageText,
      },
    ]);
  }, [initialBotMessageText]);

  return (
    <div className="flex flex-col h-screen font-sans bg-gray-50 text-gray-800">
      <header className="flex items-center p-4 border-b border-gray-200 bg-white shadow-sm">
        <MoodleIcon />
        <h1 className="text-xl font-bold ml-3">{AppTitle}</h1>
        {status === AppStatus.READY_TO_CHAT && (
           <div className="ml-auto flex items-center space-x-3">
             <button onClick={handleClearChat} className="flex items-center space-x-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg text-sm transition-colors">
               <TrashIcon />
               <span>Borrar Chat</span>
             </button>
             <button onClick={handleReset} className="flex items-center space-x-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg text-sm transition-colors">
              <ReloadIcon />
               <span>Subir Nuevos Docs</span>
             </button>
           </div>
        )}
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-4xl h-full flex flex-col">
        {status === AppStatus.AWAITING_UPLOAD || status === AppStatus.PROCESSING_PDFS ? (
          <PdfUploader 
            onProcessStart={handleProcessingStart}
            onProcessComplete={handleDocumentsProcessed}
            onProcessError={handleProcessingError}
            isProcessing={status === AppStatus.PROCESSING_PDFS}
            error={error}
          />
        ) : (
          <ChatInterface 
            messages={messages} 
            onSendMessage={handleSendMessage}
            isSending={status === AppStatus.GENERATING_ANSWER}
          />
        )}
        </div>
      </main>

       <footer className="text-center p-3 text-xs text-gray-400 border-t border-gray-200 bg-white">
        Desarrollado con la API de Gemini. Las respuestas se basan en los documentos subidos y, si es necesario, en búsquedas web.
      </footer>
    </div>
  );
}
