import { Database } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import PromptInputBar from "./PromptInputBar";

interface PromptBarProps {
  selectedSourceId: number | null;
  dataSources: { id: number; name: string; type: string }[];
  handleSourceChange: (value: string) => void;
  question: string;
  loading: boolean;
  setQuestion: (value: string) => void;
  onAsk: () => void;
}

export default function PromptBar({
  selectedSourceId,
  dataSources,
  handleSourceChange,
  question,
  loading,
  setQuestion,
  onAsk,
}: PromptBarProps) {
  return (
    <div className="border-t border-slate-200 bg-white py-4 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-4">
        {/* Label + Selector */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-600" />
            <h3 className="font-semibold text-slate-800 text-sm whitespace-nowrap">
              Data Source
            </h3>
          </div>
          <Select
            value={selectedSourceId?.toString() || ""}
            onValueChange={handleSourceChange}
          >
            <SelectTrigger className="h-11 min-w-[220px] px-4 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 shadow-none flex items-center">
              <SelectValue placeholder="Select a data source" />
            </SelectTrigger>
            <SelectContent>
              {dataSources.map((ds) => (
                <SelectItem key={ds.id} value={ds.id.toString()}>
                  <div className="flex items-center justify-between">
                    <span>{ds.name}&nbsp;</span>
                    <span className="text-xs text-slate-500">({ds.type})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Input */}
        <PromptInputBar
          question={question}
          loading={loading}
          setQuestion={setQuestion}
          onAsk={onAsk}
          disabled={!selectedSourceId}
        />
      </div>
    </div>
  );
}
