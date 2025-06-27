import { useState } from "react";
import ChatBubble from "./ChatBubble";
import StepTimeline from "./StepTimeline";
import QueryControls from "./QueryControls";
import QueryResultTable from "./QueryResultTable";

interface ChatMessageRendererProps {
  message: any;
  question?: string;
  editableSql?: string;
  setEditableSql?: (val: string) => void;
  queryResult?: any;
  queryError?: string | null;
  setQueryError?: (e: any) => void;
  showData?: boolean;
  setShowData?: (flag: boolean) => void;
  onRun?: () => void;
  readOnly?: boolean;
  running?: boolean;
}

export default function ChatMessageRenderer({
  message,
  question = "",
  editableSql = "",
  setEditableSql = () => {},
  queryResult = null,
  queryError = null,
  setQueryError = () => {},
  showData = false,
  setShowData = () => {},
  onRun = () => {},
  readOnly = false,
  running = false,
}: ChatMessageRendererProps) {
  const [showSteps, setShowSteps] = useState(false);

  if (message.type === "text") {
    return <ChatBubble message={message} />;
  }

  if (message.type === "query_result") {
    const { steps } = message.content;

    return (
      <div className="space-y-6">
        <ChatBubble
          message={{
            role: "assistant",
            type: "thinking",
            content: { text: "Here's how I prepared the answer." },
          }}
        />

        <button
          onClick={() => setShowSteps((prev) => !prev)}
          className="text-sm text-blue-600 hover:underline"
        >
          {showSteps ? "Hide steps" : "Show steps"}
        </button>

        {showSteps && <StepTimeline steps={steps} loading={false} />}

        <QueryControls
          editableSql={editableSql}
          setEditableSql={readOnly ? () => {} : setEditableSql}
          queryError={queryError}
          queryResult={queryResult}
          showData={showData}
          setShowData={readOnly ? () => {} : setShowData}
          onRun={readOnly ? () => {} : onRun}
          running={running}
          question={question}
        />
        {showData && queryResult && (
          <QueryResultTable queryResult={queryResult} />
        )}
      </div>
    );
  }

  if (message.type === "data_preview") {
    return <QueryResultTable queryResult={message.content.data} />;
  }

  return null;
}
