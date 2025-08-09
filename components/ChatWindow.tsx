
import React, { useState, useRef, useEffect } from 'react';
import { Character, ChatMessage } from '../types';
import { getChatResponseStream as getGeminiChatResponseStream } from '../services/geminiService';
import { getChatResponseStream as getMockChatResponseStream } from '../services/mockService';
import type { GenerateContentResponse } from "@google/genai";

const TranslateButton: React.FC<{ onTranslate: () => void }> = ({ onTranslate }) => (
    <button onClick={onTranslate} className="text-xs text-blue-400 hover:underline hover:text-blue-300 transition-colors">
        Translate to Arabic
    </button>
);

interface ChatWindowProps {
  character: Character;
  onClose: () => void;
  incrementApiCount: () => void;
  onProvoke: (characterId: string, message: string) => void;
  onTranslate: (id: string, text: string) => void;
  translations: Record<string, string>;
  useFreeModel: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ character, onClose, incrementApiCount, onProvoke, onTranslate, translations, useFreeModel }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading || character.isBanned) return;

    const currentInput = input;
    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', parts: [{ text: currentInput }] };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    onProvoke(character.id, currentInput);
    if (!useFreeModel) {
        incrementApiCount();
    }
    
    try {
      const getChatStream = useFreeModel ? getMockChatResponseStream : getGeminiChatResponseStream;
      const stream = await getChatStream(character, messages, currentInput);
      setIsLoading(false);
      
      const modelMessageId = Date.now().toString() + '-model';
      let newModelMessage: ChatMessage = { id: modelMessageId, role: 'model', parts: [{ text: '' }] };
      setMessages((prev) => [...prev, newModelMessage]);

      for await (const chunk of stream) {
        const chunkText = (chunk as GenerateContentResponse).text;
        if(chunkText) {
          newModelMessage.parts[0].text += chunkText;
          setMessages(prev => {
              const updatedMessages = [...prev];
              const messageIndex = updatedMessages.findIndex(m => m.id === modelMessageId);
              if (messageIndex !== -1) {
                updatedMessages[messageIndex] = {...newModelMessage};
              }
              return updatedMessages;
          });
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = { id: Date.now().toString(), role: 'model', parts: [{ text: "Sorry, I'm having trouble connecting right now." }] };
      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const header = (
    <header className="flex items-center justify-between p-3 bg-gray-900 lg:rounded-t-lg border-b border-gray-700">
        <div className="flex items-center gap-3">
          <span className={`w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-2xl ${character.isBanned ? 'grayscale' : ''}`} aria-label={character.name}>{character.avatar}</span>
          <div>
            <h3 className="font-bold text-white">{character.name}</h3>
            {character.isBanned && <p className="text-xs text-red-400 font-bold">BLOCKED</p>}
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl lg:text-2xl">&times;</button>
    </header>
  );

  if (character.isBanned) {
      return (
        <div className="fixed bottom-0 right-0 w-full h-full lg:h-auto lg:w-96 lg:right-[20rem] bg-gray-800 border-t-2 lg:border-2 border-gray-700 lg:rounded-t-lg shadow-2xl flex flex-col z-40">
            {header}
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                <span className="text-5xl mb-4" role="img" aria-label="Blocked">🚫</span>
                <h4 className="font-bold text-lg text-white">You have been blocked</h4>
                <p className="text-gray-400 mt-1">You can no longer send messages to {character.name}.</p>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed bottom-0 right-0 w-full h-full lg:h-[32rem] lg:w-96 lg:right-[20rem] bg-gray-800 border-t-2 lg:border-2 border-gray-700 lg:rounded-t-lg shadow-2xl flex flex-col z-40">
      {header}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const translation = translations[msg.id];
          return (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && <span className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xl self-end" aria-label={character.name}>{character.avatar}</span>}
              <div className={`max-w-xs md:max-w-sm lg:max-w-md rounded-2xl px-4 py-2 ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                {translation && <p className="text-blue-200 bg-black/20 p-1.5 mt-2 rounded-md whitespace-pre-wrap text-sm text-right" dir="rtl">{translation}</p>}
                {!translation && msg.parts[0].text && <div className="mt-1"><TranslateButton onTranslate={() => onTranslate(msg.id, msg.parts[0].text)} /></div>}
              </div>
            </div>
          )
        })}
        {isLoading && (messages.length === 0 || messages[messages.length-1]?.role === 'user') &&(
          <div className="flex gap-3 justify-start">
             <span className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xl self-end" aria-label={character.name}>{character.avatar}</span>
             <div className="max-w-xs rounded-2xl px-4 py-2 bg-gray-700 text-gray-200 rounded-bl-none">
                <div className="flex items-center justify-center gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-0"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></span>
                </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t border-gray-700">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${character.name}...`}
            className="w-full bg-gray-700 border border-gray-600 rounded-full py-2 px-4 text-sm text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || character.isBanned}
          />
          <button type="submit" className="bg-blue-600 text-white rounded-full p-2 disabled:bg-gray-500" disabled={isLoading || character.isBanned}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086L2.279 16.76a.75.75 0 00.95.826l16-5.333a.75.75 0 000-1.496l-16-5.333z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};
