import { parseTableInfo, parseListItems } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  MessageSquare,
  Database,
  Code,
  Loader2,
  Table,
  X,
  Send,
  PlayCircle,
} from "lucide-react";
import { useChatState } from "../hooks/useChatState";
import { useDataSource } from "../hooks/useDataSource";
import { runQuery, generateSqlStream } from "../lib/api";

import StepTimeline from "@/components/StepTimeline";
import QueryControls from "@/components/QueryControls";
import QueryResultTable from "@/components/QueryResultTable";
import SuggestedQueries from "@/components/SuggestedQueries";
import PromptBar from "@/components/PromptBar";

export default function PromptStudio() {
  const {
    question,
    setQuestion,
    steps,
    setSteps,
    sqlOutput,
    setSqlOutput,
    loading,
    setLoading,
    chatEndRef,
  } = useChatState();

  const {
    dataSources,
    selectedSourceId,
    handleSourceChange,
    dbConfig,
    suggestions,
    loadingSuggestions,
  } = useDataSource();

  const [editableSql, setEditableSql] = useState("");
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [showData, setShowData] = useState(false);
  const [chatContext, setChatContext] = useState({});

  useEffect(() => {
    if (sqlOutput) setEditableSql(sqlOutput);
  }, [sqlOutput]);

  const handleCancel = () => {
    setLoading(false);
    // In a real implementation, you'd cancel the fetch request here
  };

  const onAsk = async () => {
    setLoading(true);
    setSteps([]);
    setSqlOutput("");

    await generateSqlStream(
      question,
      selectedSourceId!,
      (step) => setSteps((prev) => [...prev, step]),
      (chunk) => setSqlOutput((prev) => prev + chunk)
    );

    setLoading(false);
  };

  const onRun = async () => {
    if (!dbConfig) return;
    setRunning(true);
    setQueryError(null);
    setQueryResult(null);

    try {
      const data = await runQuery(dbConfig, editableSql, question);
      if (data.status === "success") setQueryResult(data);
      else setQueryError(data);
    } catch (e: any) {
      setQueryError(e.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="relative h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-slate-900">
            SQL AI Assistant
          </h1>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-screen-lg mx-auto space-y-6">
          {(steps.length > 0 || loading) && (
            <>
              {/* Step Title & Cancel */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Database className="w-4 h-4 text-purple-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-700">
                    Answer preparation steps
                  </h2>
                </div>
                {loading && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>

              <StepTimeline steps={steps} loading={loading} />

              {sqlOutput && (
                <>
                  <QueryControls
                    editableSql={editableSql}
                    setEditableSql={setEditableSql}
                    queryError={queryError}
                    queryResult={queryResult}
                    showData={showData}
                    setShowData={setShowData}
                    onRun={onRun}
                    running={running}
                    question={question}
                  />
                  {showData && queryResult && (
                    <QueryResultTable queryResult={queryResult} />
                  )}
                </>
              )}
            </>
          )}

          {/* Empty state */}
          {steps.length === 0 && !loading && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Ask me anything about your data
              </h3>
              <p className="text-slate-600 max-w-md mx-auto mb-6">
                I'll analyze your question, find the relevant tables, and
                generate the perfect SQL query for you.
              </p>
            </div>
          )}
        </div>

        <div ref={chatEndRef} />
      </div>

      {/* Fixed Bottom: Suggested Queries & PromptBar */}
      <div className="sticky bottom-0 z-10 bg-white border-t border-slate-200">
        <SuggestedQueries
          suggestions={suggestions}
          loading={loadingSuggestions}
          onSelect={(q) => setQuestion(q)}
        />
        <PromptBar
          selectedSourceId={selectedSourceId}
          dataSources={dataSources}
          handleSourceChange={handleSourceChange}
          question={question}
          loading={loading}
          setQuestion={setQuestion}
          onAsk={onAsk}
        />
      </div>
    </div>
  );
}
