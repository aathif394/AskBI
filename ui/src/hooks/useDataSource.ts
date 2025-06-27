// hooks/useDataSource.ts
import { useEffect, useState } from "react";
import type { DataSource, DBConfig } from "@/lib/types";

export const useDataSource = () => {
    const [dataSources, setDataSources] = useState<DataSource[]>([]);
    const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
    const [dbConfig, setDbConfig] = useState<DBConfig | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    useEffect(() => {
        fetch("http://localhost:8000/datasources")
            .then((res) => res.json())
            .then((data) => setDataSources(data.data_sources))
            .catch((err) => console.error("Failed to fetch data sources", err));
    }, []);

    useEffect(() => {
        if (!selectedSourceId) return;
        setLoadingSuggestions(true);

        fetch(`http://localhost:8000/suggest_queries?tables=all&datasource_id=${selectedSourceId}`)
            .then((res) => res.json())
            .then((data) => {
                setSuggestions(data?.suggestions ?? []);
            })
            .catch((err) => {
                console.error("Failed to fetch suggested queries", err);
                setSuggestions([]);
            })
            .finally(() => setLoadingSuggestions(false));
    }, [selectedSourceId]);

    const handleSourceChange = async (id: string) => {
        const numId = Number(id);
        setSelectedSourceId(numId);
        await fetchDbConfig(numId);
    };

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

    return {
        dataSources,
        selectedSourceId,
        handleSourceChange,
        dbConfig,
        suggestions,
        loadingSuggestions,
    };
};
