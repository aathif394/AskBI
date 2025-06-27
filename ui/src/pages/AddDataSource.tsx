"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Database, FileText, Server, Upload } from "lucide-react";

type DataSourceType = "database" | "file";

type DatabaseSource = {
  type: "database";
  dialect: "postgresql" | "snowflake" | "mysql" | "oracle" | "sqlite";
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

type FileSource = {
  type: "file";
  name: string;
  file_type: "csv" | "xlsx" | "json" | "parquet";
  file: File;
};

type DataSource = DatabaseSource | FileSource;

export default function AddDataSource() {
  const [sourceType, setSourceType] = useState<"database" | "file">("database");
  const [dbSource, setDbSource] = useState({
    name: "",
    dialect: "postgresql",
    host: "",
    port: "5432",
    username: "",
    password: "",
    database: "",
  });
  const [fileSource, setFileSource] = useState({
    name: "",
    file_type: "csv",
    file: null as File | null,
  });

  const handleSubmit = async () => {
    let payload: any = {};

    if (sourceType === "database") {
      const { name, ...config } = dbSource;
      payload = {
        name,
        type: "database",
        config,
      };
    } else {
      if (!fileSource.file) return alert("Please select a file");

      const fileText = await fileSource.file.text();

      payload = {
        name: fileSource.name,
        type: "file",
        config: {
          file_type: fileSource.file_type,
          file_content: fileText,
        },
      };
    }

    try {
      const res = await fetch("http://localhost:8000/add_datasource", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      alert("Data source added: " + result.status);
    } catch (err) {
      console.error("Failed to add source", err);
      alert("Error adding source.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-full px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Add Data Source
                </h1>
                <p className="text-slate-600 mt-1">
                  Connect your databases or upload files to get started
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left sidebar - Source type selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Source Type
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setSourceType("database")}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 ${
                    sourceType === "database"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <Server className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">Database</div>
                    <div className="text-sm opacity-75">
                      PostgreSQL, Snowflake, MySQL, Oracle, SQLite
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSourceType("file")}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 ${
                    sourceType === "file"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">File Upload</div>
                    <div className="text-sm opacity-75">
                      CSV, Excel, JSON, Parquet
                    </div>
                  </div>
                </button>
              </div>

              {/* Preview card */}
              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-2">Quick Tips</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  {sourceType === "database" ? (
                    <>
                      <li>• Ensure your database is accessible</li>
                      <li>• Test connection before saving</li>
                      <li>• Use read-only credentials when possible</li>
                    </>
                  ) : (
                    <>
                      <li>• Supported formats: CSV, XLSX, JSON, Parquet</li>
                      <li>• Maximum file size: 100MB</li>
                      <li>• Files are processed securely</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Right content - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  {sourceType === "database" ? (
                    <Server className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Upload className="w-5 h-5 text-green-600" />
                  )}
                  <h2 className="text-xl font-semibold text-slate-900">
                    {sourceType === "database"
                      ? "Database Connection"
                      : "File Upload"}
                  </h2>
                </div>
                <p className="text-slate-600 mt-1">
                  {sourceType === "database"
                    ? "Enter your database connection details below"
                    : "Upload a file and provide connection details"}
                </p>
              </div>

              <div className="p-6">
                {sourceType === "database" ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Connection Name
                      </label>
                      <Input
                        placeholder="My Production Database"
                        value={dbSource.name}
                        onChange={(e) =>
                          setDbSource({ ...dbSource, name: e.target.value })
                        }
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Database Type
                      </label>
                      <Select
                        value={dbSource.dialect}
                        onValueChange={(val) =>
                          setDbSource({ ...dbSource, dialect: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select database type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="postgresql">PostgreSQL</SelectItem>
                          <SelectItem value="snowflake">Snowflake</SelectItem>
                          <SelectItem value="mysql">MySQL</SelectItem>
                          <SelectItem value="oracle">Oracle</SelectItem>
                          <SelectItem value="sqlite">SQLite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Host
                      </label>
                      <Input
                        placeholder="localhost or IP address"
                        value={dbSource.host}
                        onChange={(e) =>
                          setDbSource({ ...dbSource, host: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Port
                      </label>
                      <Input
                        placeholder="5432"
                        value={dbSource.port}
                        onChange={(e) =>
                          setDbSource({ ...dbSource, port: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Database Name
                      </label>
                      <Input
                        placeholder="mydatabase"
                        value={dbSource.database}
                        onChange={(e) =>
                          setDbSource({ ...dbSource, database: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Username
                      </label>
                      <Input
                        placeholder="database username"
                        value={dbSource.username}
                        onChange={(e) =>
                          setDbSource({ ...dbSource, username: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Password
                      </label>
                      <Input
                        placeholder="database password"
                        type="password"
                        value={dbSource.password}
                        onChange={(e) =>
                          setDbSource({ ...dbSource, password: e.target.value })
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Source Name
                      </label>
                      <Input
                        placeholder="My Data File"
                        value={fileSource.name}
                        onChange={(e) =>
                          setFileSource({ ...fileSource, name: e.target.value })
                        }
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        File Type
                      </label>
                      <Select
                        value={fileSource.file_type}
                        onValueChange={(val) =>
                          setFileSource({ ...fileSource, file_type: val })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select file type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="parquet">Parquet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Upload File
                      </label>
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors">
                        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <Input
                          type="file"
                          accept=".csv,.xlsx,.json,.parquet"
                          onChange={(e) =>
                            setFileSource({
                              ...fileSource,
                              file: e.target.files?.[0] || null,
                            })
                          }
                          className="w-full max-w-sm mx-auto"
                        />
                        {fileSource.file && (
                          <p className="text-sm text-slate-600 mt-2">
                            Selected: {fileSource.file.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
                  <Button variant="outline">Cancel</Button>
                  <Button
                    onClick={handleSubmit}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                  >
                    Add Data Source
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
