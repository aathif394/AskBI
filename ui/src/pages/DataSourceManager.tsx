"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import DataSourceCard from "@/components/DataSourceCard";
// import AddDataSourceModal from "@/components/AddDataSourceModal";
// import AddDataSourceSection from "@/components/AddDataSourceModal";
import AddDataSource from "./AddDataSource";
import SchemaEditor from "@/components/SchemaEditor";

export default function DataSourceManager() {
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSource, setEditingSource] = useState<any | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/datasources")
      .then((res) => res.json())
      .then((data) => setDataSources(data.data_sources));
  }, []);

  const handleAddSuccess = (newSource: any) => {
    setDataSources((prev) => [...prev, newSource]);
    setShowAddModal(false);
  };

  return (
    <div className="min-h-screen p-8 bg-slate-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Data Sources</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Data Source
        </Button>
      </div>

      {/* Main layout: Left = 20%, Right = 80% */}
      <div className="flex gap-6">
        {/* Left: Data Source List (20%) */}
        <div className="w-[20%] flex flex-col gap-4 overflow-y-auto">
          {dataSources.map((ds) => (
            <DataSourceCard
              key={ds.id}
              dataSource={ds}
              onEdit={() => setEditingSource(ds)}
            />
          ))}
        </div>

        {/* Right: Schema Editor (80%) */}
        <div className="w-[80%]">
          {editingSource ? (
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
              <SchemaEditor
                dataSource={editingSource}
                onClose={() => setEditingSource(null)}
              />
            </div>
          ) : (
            <div className="text-slate-500 italic">
              Select a data source to edit its schema.
            </div>
          )}
          {showAddModal && <AddDataSource />}
        </div>
      </div>

      {/* Modal */}
      {/* {showAddModal && <AddDataSourceSection onSuccess={handleAddSuccess} />} */}
    </div>
  );
}
