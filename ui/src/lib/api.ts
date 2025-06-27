// lib/api.ts

export const runQuery = async (dbConfig: any, sql: string, user_query: string) => {
    const res = await fetch("http://localhost:8000/execute_sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...dbConfig, sql, user_query }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Unknown error");
    return data;
};

// export const generateSqlStream = async (
//     question: string,
//     sourceId: number,
//     onStep: (e: any) => void,
//     onSql: (chunk: string) => void
// ) => {
//     const res = await fetch(
//         `http://localhost:8000/generate_sql_stream?question=${encodeURIComponent(
//             question
//         )}&datasource_id=${sourceId}`
//     );

//     const reader = res.body?.getReader();
//     const decoder = new TextDecoder("utf-8");
//     let buffer = "";

//     while (true) {
//         const { done, value } = await reader!.read();
//         if (done) break;

//         buffer += decoder.decode(value, { stream: true });
//         const events = buffer.split("\n\n");
//         buffer = events.pop() || "";

//         for (const raw of events) {
//             if (!raw.startsWith("data: ")) continue;
//             const json = JSON.parse(raw.slice(6));

//             if (json.type === "step") onStep(json);
//             else if (json.type === "sql") onSql(json.chunk);
//         }
//     }
// };


export const generateSqlStream = async (
    question: string,
    sourceId: number,
    onStep: (e: any) => void,
    onSql: (chunk: string) => void,
    context: any[] // new param
) => {
    const res = await fetch("http://localhost:8000/generate_sql_stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            question,
            datasource_id: sourceId,
            context,
        }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const raw of events) {
            if (!raw.startsWith("data: ")) continue;
            const json = JSON.parse(raw.slice(6));

            if (json.type === "step") onStep(json);
            else if (json.type === "sql") onSql(json.chunk);
        }
    }
};
