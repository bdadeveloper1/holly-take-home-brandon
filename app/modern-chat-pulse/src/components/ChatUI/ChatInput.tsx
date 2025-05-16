import { Send } from "lucide-react";
import { useState, FormEvent } from "react";
import { cn } from '../../lib/utils';

/**
 * Props for the ChatInput component 
 * @interface ChatInputProps
 */
interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

/**
 * Chat input form with send button
 * The unsung hero of every chat app!
 * 
 * @param props - Component props
 * @returns {JSX.Element} Rendered input component
 */
export function ChatInput({ 
  onSendMessage, 
  isLoading = false, 
  placeholder 
}: ChatInputProps): JSX.Element {
  // State: the necessary evil of React components
  const [input, setInput] = useState<string>("");

  /**
   * Handles form submission
   * Don't worry, we prevent that pesky page reload! 👍
   * 
   * @param e - Form event
   */
  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    
    // Empty messages are like empty promises - we don't accept them
    if (!input.trim() || isLoading) return;
    
    onSendMessage(input);
    setInput(""); // Clean slate! Like my brain after a long meeting.
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="flex w-full items-center gap-2 border border-gray-200 rounded-lg p-2 bg-white"
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder || "Type a message..."} // Fallback - because we think of everything!
        className="flex-1 outline-none px-3 py-2 text-gray-800 text-sm"
        disabled={isLoading}
        aria-label="Message input"
      />
      <button
        type="submit"
        className={cn(
          "rounded-lg p-2 transition-colors",
          input.trim() && !isLoading
            ? "bg-holly-primary hover:bg-holly-secondary text-white"
            : "bg-gray-200 text-gray-400 cursor-not-allowed" // Visually disabled - UX matters!
        )}
        disabled={!input.trim() || isLoading}
        aria-label="Send message"
      >
        <Send size={18} />
      </button>
    </form>
  );
}
