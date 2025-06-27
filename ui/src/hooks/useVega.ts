// hooks/useVega.ts
import { useEffect, useRef } from "react";
import vegaEmbed from "vega-embed";

export default function useVega(spec: any) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (spec && containerRef.current) {
            vegaEmbed(containerRef.current, spec, { actions: false }).catch((err) => {
                console.error("Vega render error:", err);
            });
        }
    }, [spec]);

    return containerRef;
}