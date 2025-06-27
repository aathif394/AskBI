"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export default function AddDataSourceSection({
  onSuccess,
}: {
  onSuccess: (ds: any) => void;
}) {
  const [name, setName] = useState("");
  const [dialect, setDialect] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !dialect) {
      toast.warning("Please fill out all fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/datasources", {
        method: "POST",
        body: JSON.stringify({ name, config: { dialect }, type: "database" }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to create data source");

      const data = await res.json();
      toast.success("Data source added.");
      onSuccess(data);
      setName("");
      setDialect("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add data source.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm max-w-xl">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">
        Add Data Source
      </h2>
      <div className="space-y-4">
        <Input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          placeholder="Dialect (e.g., postgres)"
          value={dialect}
          onChange={(e) => setDialect(e.target.value)}
        />
        <Button className="w-full" onClick={handleSubmit} disabled={loading}>
          {loading ? "Adding..." : "Add Data Source"}
        </Button>
      </div>
    </div>
  );
}
