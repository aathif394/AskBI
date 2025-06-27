"use client";

import { useEffect, useState } from "react";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";
import SchemaAccordion from "@/components/SchemaAccordion";

export default function SchemaEditor({
  dataSource,
  onClose,
}: {
  dataSource: any;
  onClose: () => void;
}) {
  const [tables, setTables] = useState<Record<string, string>>({});
  const [columns, setColumns] = useState<
    Record<string, Record<string, string>>
  >({});

  const [initialTableDescriptions, setInitialTableDescriptions] = useState<
    Record<string, string>
  >({});
  const [initialSchema, setInitialSchema] = useState<
    Record<string, Record<string, string>>
  >({});

  useEffect(() => {
    if (!dataSource?.id) return;

    fetch(`http://localhost:8000/tables`)
      .then((res) => res.json())
      .then((data) => {
        setTables(data);
        setInitialTableDescriptions(data);
      });

    fetch(
      `http://localhost:8000/schema?tables=all&datasource_id=${dataSource.id}`
    )
      .then((res) => res.json())
      .then((data) => {
        const parsed: Record<string, Record<string, string>> = {};
        data.forEach((tableObj: any) => {
          const tableName = tableObj.table_name;
          const colMap: Record<string, string> = {};
          tableObj.columns.forEach((col: any) => {
            colMap[col.name] = col.description || "";
          });
          parsed[tableName] = colMap;
        });
        setColumns(parsed);
        setInitialSchema(JSON.parse(JSON.stringify(parsed))); // deep copy
      });
  }, [dataSource]);

  const handleSave = async () => {
    const changedTables: Record<string, string> = {};
    const changedColumns: Record<string, string> = {};

    Object.entries(tables).forEach(([table, desc]) => {
      if (desc !== initialTableDescriptions[table]) {
        changedTables[table] = desc;
      }
    });

    Object.entries(columns).forEach(([table, cols]) => {
      Object.entries(cols).forEach(([col, desc]) => {
        const initialDesc = initialSchema?.[table]?.[col] || "";
        if (desc !== initialDesc) {
          changedColumns[`${table}.${col}`] = desc;
        }
      });
    });

    if (
      Object.keys(changedTables).length === 0 &&
      Object.keys(changedColumns).length === 0
    ) {
      toast.info("No changes to save.");
      return;
    }

    const payload = {
      data_source_id: dataSource.id,
      tables: changedTables,
      columns: changedColumns,
    };

    try {
      const res = await fetch("http://localhost:8000/save_descriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success("Descriptions saved.");
      setInitialTableDescriptions({ ...tables });
      setInitialSchema(JSON.parse(JSON.stringify(columns)));
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save descriptions.");
    }
  };

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-lg">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b flex justify-between items-center px-4 py-3">
        <h2 className="text-lg font-semibold text-slate-800">
          Edit Schema: {dataSource.name}
        </h2>
        <button onClick={onClose} className="text-slate-500 hover:text-red-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 p-4">
        <Accordion type="multiple">
          {Object.entries(columns).map(([table, cols]) => (
            <SchemaAccordion
              key={table}
              table={table}
              tableDesc={tables[table] || ""}
              columns={cols}
              onTableChange={(value) =>
                setTables((prev) => ({ ...prev, [table]: value }))
              }
              onColumnChange={(col, value) =>
                setColumns((prev) => ({
                  ...prev,
                  [table]: {
                    ...prev[table],
                    [col]: value,
                  },
                }))
              }
            />
          ))}
        </Accordion>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 z-10 bg-white p-4 border-t flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="bg-blue-600 text-white">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
