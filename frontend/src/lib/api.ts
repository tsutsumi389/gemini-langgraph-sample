import type { ChatMessage, Conversation, TraceItem } from "@/types/agent";

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const chatEndpoint = `${apiBaseUrl}/chat`;

type ConversationSummaryDto = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type MessageDto = {
  id: string;
  role: "user" | "assistant";
  content: string;
  trace: TraceItem[] | null;
  status: "done" | "error";
  error: string | null;
  source_question: string | null;
  created_at: string;
};

type ConversationDetailDto = ConversationSummaryDto & {
  messages: MessageDto[];
};

function summaryToConversation(dto: ConversationSummaryDto): Conversation {
  return {
    id: dto.id,
    title: dto.title,
    messages: [],
    activeAssistantId: null,
    status: "idle",
    createdAt: new Date(dto.created_at).getTime(),
  };
}

function messageDtoToChatMessage(dto: MessageDto): ChatMessage {
  const createdAt = new Date(dto.created_at).getTime();
  if (dto.role === "user") {
    return { id: dto.id, role: "user", content: dto.content, createdAt };
  }
  return {
    id: dto.id,
    role: "assistant",
    content: dto.content,
    trace: dto.trace ?? [],
    status: dto.status,
    error: dto.error,
    createdAt,
    sourceQuestion: dto.source_question ?? "",
  };
}

export async function listConversations(): Promise<Conversation[]> {
  const res = await fetch(`${apiBaseUrl}/conversations`);
  if (!res.ok) throw new Error(`failed to list conversations (${res.status})`);
  const data = (await res.json()) as ConversationSummaryDto[];
  return data.map(summaryToConversation);
}

export async function getConversation(id: string): Promise<Conversation> {
  const res = await fetch(`${apiBaseUrl}/conversations/${id}`);
  if (!res.ok) throw new Error(`failed to load conversation (${res.status})`);
  const data = (await res.json()) as ConversationDetailDto;
  return {
    id: data.id,
    title: data.title,
    messages: data.messages.map(messageDtoToChatMessage),
    activeAssistantId: null,
    status: "idle",
    createdAt: new Date(data.created_at).getTime(),
  };
}

export async function deleteConversation(id: string): Promise<void> {
  const res = await fetch(`${apiBaseUrl}/conversations/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404) {
    throw new Error(`failed to delete conversation (${res.status})`);
  }
}
