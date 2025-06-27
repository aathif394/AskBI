"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Pencil } from "lucide-react";

export default function DataSourceCard({
  dataSource,
  onEdit,
}: {
  dataSource: any;
  onEdit: () => void;
}) {
  return (
    <Card
      className="group relative cursor-pointer border hover:shadow-md transition"
      onClick={onEdit}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{dataSource.name}</h3>
            <p className="text-sm text-slate-500 capitalize">
              {dataSource.config?.dialect || "Unknown Dialect"}
            </p>
          </div>

          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-blue-600"
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering the card click
              onEdit();
            }}
            title="Edit Schema"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
