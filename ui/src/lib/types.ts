// types.ts

export interface DataSource {
    id: number;
    name: string;
}

export interface DBConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    // Add others if needed
}

export interface StreamEvent {
    type: "step" | "sql";
    content?: string;
    chunk?: string;
}

export interface Log {
    query_id: string;
    user_query: string;
    sql_query: string;
    status: string;
    execution_time_ms: number;
    created_at: string;
};

export interface StepTimelineProps {
    steps: StreamEvent[];
    loading: boolean;
}

export interface GroupedStep {
    title: string;
    status: string;
    items: (StreamEvent & { originalIndex: number })[];
}
