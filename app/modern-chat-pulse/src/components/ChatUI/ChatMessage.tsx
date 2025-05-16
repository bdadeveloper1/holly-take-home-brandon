import { cn } from '../../lib/utils';

/**
 * Props for the ChatMessage component
 * @interface ChatMessageProps
 */
export interface ChatMessageProps {
  content: string;
  role: "user" | "assistant";
  timestamp?: Date;
}

/**
 * Displays a chat message with styling based on sender role
 * 
 * @param props - Component props
 * @returns {JSX.Element} Rendered chat message
 */
export function ChatMessage({ content, role, timestamp }: ChatMessageProps): JSX.Element {
  /**
   * Formats timestamp into readable format
   * Because raw timestamps are about as readable as my handwriting
   * 
   * @param date - Optional date object
   * @returns {string} Formatted time string
   */
  const formatTime = (date?: Date): string => {
    return date?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "";
  };

  // Bubble styles are like opinions - everyone's got their own!
  return (
    <div className={cn(
      "flex w-full",
      role === "user" ? "justify-start" : "justify-end" // User on left, AI on right
    )}>
      <div className={cn(
        "rounded-2xl px-4 py-3 max-w-[80%] break-words",
        role === "user"
          ? "bg-blue-600 text-white" // User messages are blue
          : "bg-green-600 text-white", // Assistant messages are green
        "animate-fade-in" // A little pizzazz never hurt anyone!
      )}>
        <div className="text-sm">{content}</div>
        {timestamp && (
          <div className={cn(
            "text-xs mt-1",
            role === "user" ? "text-blue-100" : "text-green-100"
          )}>
            {formatTime(timestamp)}
          </div>
        )}
      </div>
    </div>
  );
}
