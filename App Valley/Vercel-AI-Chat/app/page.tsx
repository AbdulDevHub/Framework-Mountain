'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react'; // 1. Import useState

export default function Chat() {
  // 2. Manage input state locally
  const [input, setInput] = useState('');
  
  // 3. Extract messages, sendMessage, and status from the hook
  const { messages, sendMessage, status } = useChat();

  // 4. Derive isLoading from the new status field
  const isLoading = status === 'submitted' || status === 'streaming';

  // 5. Create a custom form submit handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    sendMessage({ text: input }); // Send the text object
    setInput('');                 // Manually clear the input field
  };

  return (
    <main className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      {/* Message history */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && (
          <p className="text-gray-400 text-center mt-20">
            Start a conversation...
          </p>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-3 rounded-lg max-w-[80%] ${
              message.role === 'user'
                ? 'bg-blue-600 text-white ml-auto'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            <p className="text-xs font-bold mb-1 opacity-70">
              {message.role === 'user' ? 'You' : 'Assistant'}
            </p>
            {/* Render text parts of the message */}
            {message.parts.map((part, i) =>
              part.type === 'text' ? <p key={i}>{part.text}</p> : null
            )}
          </div>
        ))}

        {isLoading && (
          <div className="bg-gray-100 text-gray-900 p-3 rounded-lg max-w-[80%]">
            <p className="text-xs font-bold mb-1 opacity-70">Assistant</p>
            <p className="animate-pulse">Thinking...</p>
          </div>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleFormSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)} // Direct state handler
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-blue-700"
        >
          Send
        </button>
      </form>
    </main>
  );
}
