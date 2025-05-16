
import { cn } from "@/lib/utils";

export function LoadingIndicator() {
  return (
    <div className="flex justify-start w-full">
      <div className="rounded-2xl px-4 py-3 bg-gray-100 text-gray-800">
        <div className="flex space-x-2 items-center">
          <div className="w-2 h-2 bg-holly-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-holly-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-holly-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}
