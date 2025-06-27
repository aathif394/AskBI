// ChatBubble.tsx
import { Database, Code, Table } from "lucide-react";
import StepTimeline from "./StepTimeline";
import QueryResultTable from "./QueryResultTable";

export default function ChatBubble({ message }: { message: any }) {
  const { role, type, content } = message;

  const isUser = role === "user";
  const isAssistant = role === "assistant";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`rounded-xl px-4 py-3 max-w-xl text-sm shadow ${
          isUser ? "bg-blue-100 text-slate-900" : "bg-gray-100 text-slate-800"
        }`}
      >
        {type === "text" && content.text}
        {type === "thinking" && (
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
        {type === "query_result" && (
          <>
            <StepTimeline steps={content.steps} loading={false} />
            <div className="mt-4 p-2 rounded bg-slate-50 border text-xs font-mono text-slate-800 whitespace-pre-wrap">
              {content.sql}
            </div>
          </>
        )}
        {type === "data_preview" && (
          <div className="mt-2">
            <QueryResultTable queryResult={content.data} />
          </div>
        )}
      </div>
    </div>
  );
}
