import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Database,
  Play,
  Sparkles,
  FileText,
  Copy,
  Download,
  ChevronRight,
  Activity,
  Lightbulb,
} from "lucide-react";

type ApiResponse = {
  status: "success" | "error";
  query_id?: string;
  rows?: number;
  data?: (string | number)[][];
  columns?: string[];
  message?: string;
  summary?: string;
};

type SQLGenResponse = {
  sql: string;
  used_tables: string[];
};

type DataSource = {
  id: number;
  name: string;
  type: string;
};

type DBConfig = {
  dialect: string;
  username: string;
  password: string;
  host: string;
  port: number;
  database: string;
};

export default function QueryRunner() {
  const [sql, setSql] = useState("");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [generatedSQL, setGeneratedSQL] = useState<SQLGenResponse | null>(null);
  const [genLoading, setGenLoading] = useState(false);

  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [dbConfig, setDbConfig] = useState<DBConfig | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/datasources")
      .then((res) => res.json())
      .then((data) => setDataSources(data.data_sources))
      .catch((err) => console.error("Failed to fetch data sources", err));
  }, []);

  useEffect(() => {
    if (!selectedSourceId) return;

    fetch(
      `http://localhost:8000/suggest_queries?tables=all&datasource_id=${selectedSourceId}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data?.suggestions) {
          setSuggestions(data.suggestions);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch suggested queries", err);
        setSuggestions([]);
      });
  }, [selectedSourceId, dataSources]);

  const fetchDbConfig = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/datasource/${id}/config`);
      const result: DBConfig = await res.json();
      setDbConfig(result);
    } catch (err) {
      console.error("Failed to fetch DB config", err);
      setDbConfig(null);
    }
  };

  const exportToCSV = async (queryId: string | number) => {
    try {
      const res = await fetch(
        `http://localhost:8000/get_query_result?query_id=${queryId}&format=csv`
      );

      if (!res.ok) throw new Error("Failed to fetch CSV");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `export_data.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export to CSV", err);
    }
  };

  const handleSourceChange = async (id: string) => {
    const numId = Number(id);
    setSelectedSourceId(numId);
    await fetchDbConfig(numId);
  };

  const runQuery = async () => {
    if (!dbConfig) return;

    const cleanedSql = sql.replace(/\n/g, " ").trim();
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("http://localhost:8000/execute_sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...dbConfig, sql: cleanedSql }),
      });
      const result: ApiResponse = await res.json();
      setResponse(result);
    } catch (err) {
      console.error("Query failed", err);
      setResponse({ status: "error", message: "Failed to send request" });
    } finally {
      setLoading(false);
    }
  };

  const generateSQL = async () => {
    if (!selectedSourceId) return;

    setGenLoading(true);
    setGeneratedSQL(null);

    try {
      const res = await fetch("http://localhost:8000/generate_sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, datasource_id: selectedSourceId }),
      });
      const result: SQLGenResponse = await res.json();
      setGeneratedSQL(result);
    } catch (err) {
      console.error("SQL generation failed", err);
    } finally {
      setGenLoading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text");
    const cleaned = paste.replace(/\s+/g, " ").trim();
    const textarea = e.target as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const updated = sql.slice(0, start) + cleaned + sql.slice(end);
    setSql(updated);
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + cleaned.length;
    }, 0);
  };

  const selectedSource = dataSources.find((ds) => ds.id === selectedSourceId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-full px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  SQL Query Runner
                </h1>
                <p className="text-slate-600">
                  Generate and Execute SQL from Natural Language
                </p>
              </div>
            </div>

            {selectedSource && (
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
                <Database className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  {selectedSource.name}
                </span>
                <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded">
                  {selectedSource.type}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
          {/* Data Source Selection */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">Data Source</h3>
            </div>
            <Select
              value={selectedSourceId?.toString() || ""}
              onValueChange={handleSourceChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a data source" />
              </SelectTrigger>
              <SelectContent>
                {dataSources.map((ds) => (
                  <SelectItem key={ds.id} value={ds.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span>{ds.name}</span>
                      <span className="text-xs text-slate-500">
                        ({ds.type})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* AI Query Generation */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-slate-900">Ask to Query</h3>
            </div>
            <div className="space-y-3">
              <Input
                placeholder="Ask a question about your data..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={!selectedSourceId}
                className="w-full"
              />
              <Button
                onClick={generateSQL}
                disabled={genLoading || !question.trim() || !selectedSourceId}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {genLoading ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate SQL
                  </>
                )}
              </Button>
            </div>

            {suggestions.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <h4 className="font-semibold text-slate-900">
                    Try These Queries
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestions.map((query, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuestion(query)}
                      className="text-left text-sm text-slate-800 border border-slate-200 rounded-md px-3 py-2 hover:bg-slate-50 transition"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {generatedSQL && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">
                    Generated Query
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedSQL.sql);
                      setSql(generatedSQL.sql);
                    }}
                    className="text-xs flex items-center"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Use
                  </Button>
                </div>
                <pre className="text-sm text-blue-800 bg-white p-3 rounded border overflow-auto max-h-64 whitespace-pre-wrap break-words">
                  {generatedSQL.sql}
                </pre>
                {generatedSQL.used_tables.length > 0 && (
                  <div className="mt-2 text-xs text-blue-700">
                    <span className="font-medium">Tables:</span>{" "}
                    {generatedSQL.used_tables.join(", ")}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Query History / Tips */}
          <div className="p-6 flex-1">
            <h3 className="font-semibold text-slate-900 mb-4">Query Tips</h3>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-slate-400" />
                <span>Use Ctrl+Enter to run queries quickly</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-slate-400" />
                <span>Paste multi-line SQL - it auto-formats</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 mt-0.5 text-slate-400" />
                <span>Results are limited to first 1000 rows</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* SQL Editor */}
          <div className="p-6 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-600" />
                <h3 className="font-semibold text-slate-900">SQL Editor</h3>
              </div>
              <Button
                onClick={runQuery}
                disabled={loading || !sql.trim() || !dbConfig}
                className="bg-green-600 hover:bg-green-700 text-white px-6"
              >
                {loading ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Query
                  </>
                )}
              </Button>
            </div>

            <Textarea
              placeholder={
                selectedSourceId
                  ? "Write your SQL query here..."
                  : "Please select a data source first..."
              }
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  runQuery();
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  setSql((prev) => prev + " ");
                }
              }}
              className="w-full h-48 font-mono text-sm resize-none"
              disabled={!selectedSourceId}
            />
          </div>

          {/* Results Area */}
          <div className="flex-1 p-6 bg-slate-50 overflow-hidden">
            {response?.status === "success" &&
            response.columns &&
            response.data ? (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="font-medium text-slate-900">
                      Query returned: {response.rows} row(s)
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportToCSV(response.query_id)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>

                {/* <div className="flex-1 bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <div className="overflow-auto h-full">
                    <table className="min-w-full">
                      <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr>
                          {response.columns.map((col, index) => (
                            <th
                              key={col}
                              className="px-4 py-3 text-left text-sm font-semibold text-slate-900 border-r border-slate-200 last:border-r-0"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {response.data.map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-slate-50">
                            {row.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200 last:border-r-0"
                              >
                                {cell === null || cell === undefined ? (
                                  <span className="text-slate-400 italic">
                                    NULL
                                  </span>
                                ) : (
                                  String(cell)
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div> */}
                <div className="flex-1 bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <p className="text-sm text-slate-700 font-medium">
                      {response.summary ??
                        "This is a summary of the results returned by your query."}
                    </p>
                  </div>
                  <div className="overflow-auto h-full">
                    <table className="min-w-full">
                      <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr>
                          {response.columns.map((col, index) => (
                            <th
                              key={col}
                              className="px-4 py-3 text-left text-sm font-semibold text-slate-900 border-r border-slate-200 last:border-r-0"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {response.data.map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-slate-50">
                            {row.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="px-4 py-3 text-sm text-slate-900 border-r border-slate-200 last:border-r-0"
                              >
                                {cell === null || cell === undefined ? (
                                  <span className="text-slate-400 italic">
                                    NULL
                                  </span>
                                ) : (
                                  String(cell)
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : response?.status === "error" ? (
              <div className="flex items-center justify-center h-full">
                <div className="max-w-md text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Query Error
                  </h3>
                  <p className="text-slate-600 text-sm">
                    {response.message || "An unknown error occurred."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Ready to Query
                  </h3>
                  <p className="text-slate-600 max-w-md">
                    {!selectedSourceId
                      ? "Select a data source and write your SQL query to get started."
                      : "Write your SQL query above and click 'Run Query' to see results."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
