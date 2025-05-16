'use client';

import React, { useState, useEffect } from 'react';
import { handleChatMessage } from '../../app/actions';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from user preference if available
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get AI response
      const response = await handleChatMessage(input);
      
      // Add assistant message
      const assistantMessage: Message = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`flex flex-col h-[600px] max-w-2xl mx-auto p-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow-lg transition-colors duration-300`}>
      {/* Dark mode toggle */}
      <div className="flex justify-end mb-4">
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-800'}`}
        >
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg ${message.role === 'user'
                ? 'bg-blue-600 text-white ml-auto' 
                : darkMode ? 'bg-gray-700' : 'bg-gray-100'
            } max-w-[80%] ${darkMode && message.role === 'assistant' ? 'text-white' : ''}`}
          >
            {message.content}
          </div>
        ))}
        {isLoading && (
          <div className={`p-3 rounded-lg max-w-[80%] ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100'}`}>
            Thinking...
          </div>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about jobs..."
          className={`flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : ''}`}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
} 