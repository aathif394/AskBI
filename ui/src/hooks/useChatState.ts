// hooks/useChatState.ts
import { useEffect, useRef, useState } from "react";
import type { DBConfig, DataSource, StreamEvent } from "@/lib/types"; // adjust paths as needed

export const useChatState = () => {
    const [question, setQuestion] = useState("");
    const [steps, setSteps] = useState<StreamEvent[]>([]);
    const [sqlOutput, setSqlOutput] = useState("");
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    return {
        question,
        setQuestion,
        steps,
        setSteps,
        sqlOutput,
        setSqlOutput,
        loading,
        setLoading,
        chatEndRef,
    };
};
