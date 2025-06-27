import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, X } from "lucide-react";

interface PromptInputBarProps {
  question: string;
  loading: boolean;
  setQuestion: (value: string) => void;
  onAsk: () => void;
  disabled: boolean;
}

export default function PromptInputBar({
  question,
  loading,
  setQuestion,
  onAsk,
  disabled = false,
}: PromptInputBarProps) {
  return (
    <div className="flex items-center gap-3 w-full">
      {/* Input Bar with Clear Button */}
      <div className="flex-1 relative w-full">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={
            disabled
              ? "Select a data source to ask a question..."
              : "Ask anything about your data..."
          }
          className="h-11 px-4 pr-10 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 shadow-none disabled:opacity-50"
          onKeyDown={(e) =>
            e.key === "Enter" &&
            !loading &&
            !disabled &&
            question.trim() &&
            onAsk()
          }
          disabled={loading || disabled}
        />

        {/* Clear (X) Button */}
        {question && !loading && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setQuestion("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Send Button (Outside Input) */}
      <Button
        onClick={onAsk}
        disabled={loading || disabled || !question.trim()}
        size="icon"
        className="h-11 w-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
      >
        <Send className="w-4 h-4 text-white" />
      </Button>
    </div>
  );
}
