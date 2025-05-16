'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../components/ChatUI/ChatMessage';
import { ChatInput } from '../components/ChatUI/ChatInput';
import { LoadingIndicator } from '../components/ChatUI/LoadingIndicator';

/**
 * Represents a chat message with role, content, and timestamp
 * @typedef {Object} Message
 */
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

/**
 * Main chat interface component
 * @returns {JSX.Element} The rendered chat UI
 */
const Index = (): JSX.Element => {
  // Oh boy, here we go with state management again... 🙄
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! How can I assist you today?',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // This ref is like that one friend who always remembers where we left off
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll effect - because nobody likes manual scrolling, am I right?
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Scrolls to the bottom of the chat
   * Because who wants to read old messages anyway?
   */
  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Handles sending a new message
   * @param message - The message text to send
   */
  const handleSendMessage = async (message: string): Promise<void> => {
    // No empty messages allowed! That's just wasteful.
    if (!message.trim() || isLoading) return;

    // Create and add the user message - simple stuff!
    const userMessage: Message = {
      id: Date.now().toString(), // Not UUID but good enough for this demo!
      content: message,
      role: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        content: 'Sorry, there was an error processing your request.',
        role: 'assistant',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Format timestamp for display
   * Because raw Date objects are just... ew.
   * @param date - The date to format
   * @returns {string} Formatted time string
   */
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header - keeping it simple, unlike my coffee order */}
      <header className="bg-white shadow-sm py-4 px-6">
        <h1 className="text-xl font-semibold text-gray-800">Holly Chat Assistant (Take Home)</h1>
      </header>
      
      {/* Chat Messages - where the magic happens! ✨ */}
      <div className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full">
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              content={message.content}
              role={message.role}
              timestamp={message.timestamp}
            />
          ))}
          
          {isLoading && <LoadingIndicator />}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Chat Input - the user's gateway to our magnificent AI 🧠 */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-3xl mx-auto">
          <ChatInput 
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholder="Type your message here..."
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
