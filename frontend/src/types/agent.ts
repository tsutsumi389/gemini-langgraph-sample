export type TraceItem = {
  node: string;
  update: Record<string, string>;
};

export type StreamStatus = "idle" | "streaming" | "done" | "error";

export type UserMessage = {
  id: string;
  role: "user";
  content: string;
  createdAt: number;
};

export type AssistantMessage = {
  id: string;
  role: "assistant";
  content: string;
  trace: TraceItem[];
  status: "streaming" | "done" | "error";
  error: string | null;
  createdAt: number;
  sourceQuestion: string;
};

export type ChatMessage = UserMessage | AssistantMessage;

export type ChatState = {
  messages: ChatMessage[];
  activeAssistantId: string | null;
  status: StreamStatus;
};

export type ChatEvent =
  | { type: "graph_start"; payload: { question: string } }
  | { type: "node_update"; payload: TraceItem }
  | { type: "final"; payload: { answer: string } }
  | { type: "error"; payload: { message: string } };
