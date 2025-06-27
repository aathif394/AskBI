// src/components/SchemaAccordion.tsx
"use client";

import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export default function SchemaAccordion({
  table,
  tableDesc,
  columns,
  onTableChange,
  onColumnChange,
}: {
  table: string;
  tableDesc: string;
  columns: Record<string, string>;
  onTableChange: (value: string) => void;
  onColumnChange: (column: string, value: string) => void;
}) {
  return (
    <AccordionItem value={table} className="border rounded-md bg-white mb-2">
      <AccordionTrigger className="px-4 py-2 text-left font-medium text-slate-800 hover:bg-slate-50">
        {table}
      </AccordionTrigger>

      <AccordionContent className="px-4 pb-4 pt-2">
        <Textarea
          className="w-full text-sm mb-4"
          rows={2}
          value={tableDesc}
          onChange={(e) => onTableChange(e.target.value)}
          placeholder="Enter table description"
        />

        <table className="w-full text-sm table-fixed border-collapse">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-2 w-1/3 border">Column</th>
              <th className="p-2 border">Description</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(columns).map(([col, desc]) => (
              <tr key={col} className="border-t">
                <td className="p-2 border">{col}</td>
                <td className="p-2 border">
                  <Input
                    className="w-full text-sm"
                    value={desc}
                    onChange={(e) => onColumnChange(col, e.target.value)}
                    placeholder="Enter column description"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AccordionContent>
    </AccordionItem>
  );
}
