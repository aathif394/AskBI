"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Database, Eye, Save } from "lucide-react";
import { Table as TableIcon } from "lucide-react";

export default function ViewDataSources() {
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [tableDescriptions, setTableDescriptions] = useState<
    Record<string, string>
  >({});
  const [initialTableDescriptions, setInitialTableDescriptions] = useState<
    Record<string, string>
  >({});
  const [schema, setSchema] = useState<Record<string, Record<string, string>>>(
    {}
  );
  const [initialSchema, setInitialSchema] = useState<
    Record<string, Record<string, string>>
  >({});

  useEffect(() => {
    fetch("http://localhost:8000/datasources")
      .then((res) => res.json())
      .then((data) => setDataSources(data.data_sources));
  }, []);

  useEffect(() => {
    if (selectedSourceId) {
      fetch(`http://localhost:8000/tables`)
        .then((res) => res.json())
        .then((data) => {
          setTableDescriptions(data);
          setInitialTableDescriptions(data);
        });

      fetch(
        `http://localhost:8000/schema?tables=all&datasource_id=${selectedSourceId}`
      )
        .then((res) => res.json())
        .then((data) => {
          const parsed: Record<string, Record<string, string>> = {};
          data.forEach((tableObj: any) => {
            const tableName = Object.keys(tableObj)[0];
            parsed[tableName] = tableObj[tableName];
          });
          setSchema(parsed);
          setInitialSchema(JSON.parse(JSON.stringify(parsed))); // deep copy
        });
    }
  }, [selectedSourceId]);

  const handleTableDescChange = (table: string, desc: string) => {
    setTableDescriptions((prev) => ({ ...prev, [table]: desc }));
  };

  const handleColumnDescChange = (
    table: string,
    column: string,
    desc: string
  ) => {
    setSchema((prev) => ({
      ...prev,
      [table]: {
        ...prev[table],
        [column]: desc,
      },
    }));
  };

  const handleSaveDescriptions = async () => {
    if (!selectedSourceId) return;

    // Compare current with initial, build changes
    const changedTables: Record<string, string> = {};
    const changedColumns: Record<string, string> = {};

    Object.entries(tableDescriptions).forEach(([table, desc]) => {
      if (desc !== initialTableDescriptions[table]) {
        changedTables[table] = desc;
      }
    });

    Object.entries(schema).forEach(([table, columns]) => {
      Object.entries(columns).forEach(([column, desc]) => {
        const initialDesc = initialSchema?.[table]?.[column] || "";
        if (desc !== initialDesc) {
          // changedColumns[`${table}.${column}`] = desc;
          changedColumns[`${column}`] = desc;
        }
      });
    });

    const payload = {
      data_source_id: selectedSourceId,
      tables: changedTables,
      columns: changedColumns,
    };

    if (
      Object.keys(changedTables).length === 0 &&
      Object.keys(changedColumns).length === 0
    ) {
      alert("No changes to save.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8000/save_descriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      console.log(JSON.stringify(payload));
      if (!res.ok) throw new Error("Failed to save");

      alert("Changes saved successfully.");

      // Reset baselines to current values
      setInitialTableDescriptions({ ...tableDescriptions });
      setInitialSchema(JSON.parse(JSON.stringify(schema)));
    } catch (err) {
      console.error(err);
      alert("Failed to save descriptions.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b bg-white px-8 py-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <Eye className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Data Sources
            </h1>
            <p className="text-sm text-slate-600">
              View and manage table and column descriptions
            </p>
          </div>
        </div>
        {selectedSourceId && (
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSaveDescriptions}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6 px-8 py-8">
        {/* Sidebar */}
        <div className="col-span-3">
          <div className="space-y-2">
            {dataSources.map((ds) => (
              <Card
                key={ds.id}
                onClick={() => setSelectedSourceId(ds.id)}
                className={`cursor-pointer px-4 py-3 border hover:border-slate-300 transition-all ${
                  selectedSourceId === ds.id
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "bg-white"
                }`}
              >
                <CardContent className="p-0">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-slate-600" />
                    <div className="truncate">
                      <p className="text-sm font-medium truncate">{ds.name}</p>
                      <p className="text-xs text-slate-500 capitalize truncate">
                        {ds.config.dialect}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Schema Viewer */}
        <div className="col-span-9">
          <div className="bg-white border rounded-xl shadow-sm p-6">
            {selectedSourceId && Object.keys(schema).length ? (
              <Accordion type="multiple" className="space-y-4">
                {Object.keys(schema).map((tableName) => (
                  <AccordionItem key={tableName} value={tableName}>
                    <AccordionTrigger className="px-2 py-3 hover:bg-slate-50 border-b">
                      <div className="flex items-center gap-2 text-slate-800">
                        <TableIcon className="w-4 h-4 text-slate-600" />
                        <span className="font-medium text-sm">{tableName}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 py-4 space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Table Description
                        </label>
                        <Textarea
                          className="mt-1 w-full text-sm"
                          rows={3}
                          placeholder="Add table description..."
                          value={tableDescriptions[tableName] || ""}
                          onChange={(e) =>
                            handleTableDescChange(tableName, e.target.value)
                          }
                        />
                      </div>

                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 border-b">
                            <th className="px-3 py-2 text-left w-1/4">
                              Column
                            </th>
                            <th className="px-3 py-2 text-left">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(schema[tableName]).map(
                            ([columnName, desc]) => (
                              <tr key={columnName} className="border-b">
                                <td className="px-3 py-2 font-medium text-slate-800">
                                  {columnName}
                                </td>
                                <td className="px-3 py-2">
                                  <Input
                                    className="w-full text-sm"
                                    value={desc}
                                    onChange={(e) =>
                                      handleColumnDescChange(
                                        tableName,
                                        columnName,
                                        e.target.value
                                      )
                                    }
                                    placeholder="Describe this column..."
                                  />
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-slate-500 text-sm text-center py-12">
                Select a data source to view its schema.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
