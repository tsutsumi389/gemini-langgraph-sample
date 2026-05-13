export type TraceItem = {
  node: string;
  update: Record<string, string>;
};

export type StreamStatus = "idle" | "streaming" | "done" | "error";

export type StreamState = {
  status: StreamStatus;
  question: string;
  trace: TraceItem[];
  answer: string;
  error: string | null;
};

export type ChatEvent =
  | { type: "graph_start"; payload: { question: string } }
  | { type: "node_update"; payload: TraceItem }
  | { type: "final"; payload: { answer: string } }
  | { type: "error"; payload: { message: string } };
