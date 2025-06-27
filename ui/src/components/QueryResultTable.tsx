"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function QueryResultTable({
  queryResult,
}: {
  queryResult: any;
}) {
  return (
    <div className="mt-6 space-y-2">
      <div className="text-sm text-slate-500">
        &nbsp;&nbsp;&nbsp;Showing {queryResult.rows} rows
      </div>

      <div className="max-h-[600px] overflow-auto border rounded-md">
        <Table className="min-w-full text-sm border-collapse">
          <TableHeader className="sticky top-0 bg-slate-100 z-10">
            <TableRow>
              {queryResult.columns.map((col: string, idx: number) => (
                <TableHead
                  key={idx}
                  className="px-3 py-2 border border-slate-200 text-left text-slate-600 font-medium"
                >
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {queryResult.data
              .slice(0, 500)
              .map((row: any[], rowIdx: number) => (
                <TableRow key={rowIdx} className="even:bg-slate-50">
                  {row.map((cell, cellIdx: number) => (
                    <TableCell
                      key={cellIdx}
                      className="px-3 py-2 border border-slate-200 whitespace-nowrap max-w-[200px] truncate"
                      title={String(cell)}
                    >
                      {String(cell)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
