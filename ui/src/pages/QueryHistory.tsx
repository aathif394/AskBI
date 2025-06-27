"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  History,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Filter,
  MoreVertical,
  Search,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { Log } from "@/lib/types";

export default function QueryHistory() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<Log[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetch("http://localhost:8000/query_logs")
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.queries);
        setFilteredLogs(data.queries);
      });
  }, []);

  useEffect(() => {
    let filtered = logs;
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.sql_query.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.user_query.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((log) => log.status === statusFilter);
    }
    setFilteredLogs(filtered);
  }, [logs, searchTerm, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleDownloadCSV = async (queryId: string) => {
    try {
      const res = await fetch(
        `http://localhost:8000/get_query_result?query_id=${queryId}&format=csv`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "export_data.csv";
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Exported data successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Could not export data.");
    }
  };

  const formatTime = (ms: number) =>
    ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;

  const getStatusIcon = (status: string) => {
    const iconProps = "w-4 h-4 mr-1";
    switch (status) {
      case "success":
        return <CheckCircle className={`${iconProps} text-green-600`} />;
      case "error":
        return <XCircle className={`${iconProps} text-red-600`} />;
      default:
        return <AlertCircle className={`${iconProps} text-yellow-600`} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="outline" className="text-green-700 border-green-200">
            {getStatusIcon(status)}Success
          </Badge>
        );
      case "error":
        return (
          <Badge variant="outline" className="text-red-700 border-red-200">
            {getStatusIcon(status)}Error
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="text-yellow-700 border-yellow-200"
          >
            {getStatusIcon(status)}
            {status}
          </Badge>
        );
    }
  };

  const uniqueStatuses = [...new Set(logs.map((l) => l.status))];

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <History className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Query History</h1>
            <p className="text-sm text-muted-foreground">
              Your past query executions
            </p>
          </div>
        </div>
        <Badge variant="secondary">
          {filteredLogs.length} of {logs.length} shown
        </Badge>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 sticky top-2 z-10">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-1/2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search query text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" /> All
            </Button>
            {uniqueStatuses.map((status) => (
              <Button
                key={status}
                size="sm"
                variant={statusFilter === status ? "default" : "outline"}
                onClick={() => setStatusFilter(status)}
                className="flex items-center gap-2 capitalize"
              >
                {getStatusIcon(status)}
                {status}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardContent className="p-4 flex gap-3 items-center">
            <div className="bg-green-100 p-2 rounded-md">
              <CheckCircle className="text-green-600 w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Success</p>
              <p className="text-xl font-semibold">
                {logs.filter((log) => log.status === "success").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex gap-3 items-center">
            <div className="bg-red-100 p-2 rounded-md">
              <XCircle className="text-red-600 w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Errors</p>
              <p className="text-xl font-semibold">
                {logs.filter((log) => log.status === "error").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex gap-3 items-center">
            <div className="bg-blue-100 p-2 rounded-md">
              <Clock className="text-blue-600 w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Time</p>
              <p className="text-xl font-semibold">
                {logs.length > 0
                  ? formatTime(
                      logs.reduce((acc, l) => acc + l.execution_time_ms, 0) /
                        logs.length
                    )
                  : "0ms"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="overflow-auto bg-white rounded-lg border shadow-sm m-4">
        <table className="min-w-full divide-y divide-gray-200 text-sm text-slate-700">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">SQL Query</th>
              <th className="px-4 py-2 text-left font-semibold">
                User Question
              </th>
              <th className="px-4 py-2 text-left font-semibold">Status</th>
              <th className="px-4 py-2 text-left font-semibold">Exec Time</th>
              <th className="px-4 py-2 text-left font-semibold">Timestamp</th>
              <th className="px-4 py-2 text-right font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {filteredLogs
              .slice(
                (currentPage - 1) * itemsPerPage,
                currentPage * itemsPerPage
              )
              .map((log) => (
                <tr key={log.query_id} className="hover:bg-slate-50 transition">
                  {/* SQL Query */}
                  <td
                    className="px-4 py-3 max-w-[320px] truncate"
                    title={log.sql_query}
                  >
                    <code className="text-muted-foreground">
                      {log.sql_query}
                    </code>
                  </td>

                  {/* User Question */}
                  <td
                    className="px-4 py-3 max-w-[320px] truncate"
                    title={log.user_query}
                  >
                    <code className="text-muted-foreground">
                      {log.user_query}
                    </code>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">{getStatusBadge(log.status)}</td>

                  {/* Execution Time */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatTime(log.execution_time_ms)}
                  </td>

                  {/* Timestamp */}
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                    {new Date(log.created_at).toLocaleString()}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDownloadCSV(log.query_id)}
                          disabled={log.status !== "success"}
                          className={
                            log.status !== "success"
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Results
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-4 py-4 border-t bg-white text-sm">
          <span className="text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-700">
              {(currentPage - 1) * itemsPerPage + 1}–
              {Math.min(currentPage * itemsPerPage, filteredLogs.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-700">
              {filteredLogs.length}
            </span>{" "}
            results
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {[...Array(totalPages)].map((_, i) => (
              <Button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                size="icon"
                variant={currentPage === i + 1 ? "default" : "ghost"}
                className="h-8 w-8"
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
