"use client";

import { useCallback, useReducer, useRef } from "react";
import { chatEndpoint } from "@/lib/api";
import { parseSSEChunk } from "@/lib/sse";
import type {
  AssistantMessage,
  ChatEvent,
  ChatMessage,
  ChatState,
  Conversation,
  StreamStatus,
  TraceItem,
} from "@/types/agent";

type Action =
  | {
      type: "start";
      conversationId: string;
      question: string;
      userId: string;
      assistantId: string;
    }
  | {
      type: "regenerate";
      conversationId: string;
      assistantId: string;
      question: string;
      replaceId: string;
    }
  | { type: "event"; conversationId: string; assistantId: string; event: ChatEvent }
  | { type: "finish"; conversationId: string; assistantId: string }
  | {
      type: "fail";
      conversationId: string;
      assistantId: string | null;
      message: string;
    }
  | { type: "create_conversation"; id: string }
  | { type: "select_conversation"; id: string }
  | { type: "delete_conversation"; id: string; fallbackId: string }
  | { type: "reset"; id: string };

const NEW_CHAT_TITLE = "New chat";
const TITLE_MAX = 24;

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function emptyConversation(id: string): Conversation {
  return {
    id,
    title: NEW_CHAT_TITLE,
    messages: [],
    activeAssistantId: null,
    status: "idle",
    createdAt: Date.now(),
  };
}

function deriveTitle(question: string): string {
  const oneLine = question.replace(/\s+/g, " ").trim();
  if (oneLine.length <= TITLE_MAX) return oneLine || NEW_CHAT_TITLE;
  return `${oneLine.slice(0, TITLE_MAX)}…`;
}

function initialState(): ChatState {
  const id = newId();
  return {
    conversations: [emptyConversation(id)],
    activeConversationId: id,
  };
}

function updateConversation(
  state: ChatState,
  id: string,
  fn: (c: Conversation) => Conversation,
): ChatState {
  return {
    ...state,
    conversations: state.conversations.map((c) => (c.id === id ? fn(c) : c)),
  };
}

function applyEventToMessage(msg: AssistantMessage, ev: ChatEvent): AssistantMessage {
  switch (ev.type) {
    case "graph_start":
      return msg;
    case "node_update": {
      const trace: TraceItem[] = [...msg.trace, ev.payload];
      return { ...msg, trace };
    }
    case "final":
      return { ...msg, content: ev.payload.answer };
    case "error":
      return { ...msg, status: "error", error: ev.payload.message };
    default:
      return msg;
  }
}

function reducer(state: ChatState, action: Action): ChatState {
  switch (action.type) {
    case "start": {
      const now = Date.now();
      const userMsg: ChatMessage = {
        id: action.userId,
        role: "user",
        content: action.question,
        createdAt: now,
      };
      const assistantMsg: AssistantMessage = {
        id: action.assistantId,
        role: "assistant",
        content: "",
        trace: [],
        status: "streaming",
        error: null,
        createdAt: now,
        sourceQuestion: action.question,
      };
      return updateConversation(state, action.conversationId, (c) => ({
        ...c,
        title: c.title === NEW_CHAT_TITLE ? deriveTitle(action.question) : c.title,
        messages: [...c.messages, userMsg, assistantMsg],
        activeAssistantId: action.assistantId,
        status: "streaming",
      }));
    }
    case "regenerate": {
      const now = Date.now();
      const assistantMsg: AssistantMessage = {
        id: action.assistantId,
        role: "assistant",
        content: "",
        trace: [],
        status: "streaming",
        error: null,
        createdAt: now,
        sourceQuestion: action.question,
      };
      return updateConversation(state, action.conversationId, (c) => {
        const idx = c.messages.findIndex((m) => m.id === action.replaceId);
        const messages =
          idx >= 0
            ? [...c.messages.slice(0, idx), assistantMsg, ...c.messages.slice(idx + 1)]
            : [...c.messages, assistantMsg];
        return {
          ...c,
          messages,
          activeAssistantId: action.assistantId,
          status: "streaming",
        };
      });
    }
    case "event": {
      return updateConversation(state, action.conversationId, (c) => {
        const messages = c.messages.map((m) =>
          m.id === action.assistantId && m.role === "assistant"
            ? applyEventToMessage(m, action.event)
            : m,
        );
        const status: StreamStatus = action.event.type === "error" ? "error" : c.status;
        return { ...c, messages, status };
      });
    }
    case "finish":
      return updateConversation(state, action.conversationId, (c) => ({
        ...c,
        status: c.status === "error" ? "error" : "done",
        activeAssistantId: null,
        messages: c.messages.map((m) =>
          m.id === action.assistantId && m.role === "assistant" && m.status === "streaming"
            ? { ...m, status: "done" }
            : m,
        ),
      }));
    case "fail":
      return updateConversation(state, action.conversationId, (c) => ({
        ...c,
        status: "error",
        activeAssistantId: null,
        messages: c.messages.map((m) =>
          action.assistantId && m.id === action.assistantId && m.role === "assistant"
            ? { ...m, status: "error", error: action.message }
            : m,
        ),
      }));
    case "create_conversation": {
      const next = emptyConversation(action.id);
      return {
        conversations: [next, ...state.conversations],
        activeConversationId: next.id,
      };
    }
    case "select_conversation": {
      if (!state.conversations.some((c) => c.id === action.id)) return state;
      return { ...state, activeConversationId: action.id };
    }
    case "delete_conversation": {
      const remaining = state.conversations.filter((c) => c.id !== action.id);
      if (remaining.length === 0) {
        const next = emptyConversation(action.fallbackId);
        return { conversations: [next], activeConversationId: next.id };
      }
      const activeId =
        state.activeConversationId === action.id ? remaining[0].id : state.activeConversationId;
      return { conversations: remaining, activeConversationId: activeId };
    }
    case "reset":
      return { conversations: [emptyConversation(action.id)], activeConversationId: action.id };
    default:
      return state;
  }
}

function decodeEvent(event: string, data: string): ChatEvent | null {
  try {
    const payload = JSON.parse(data);
    if (
      event === "graph_start" ||
      event === "node_update" ||
      event === "final" ||
      event === "error"
    ) {
      return { type: event, payload } as ChatEvent;
    }
  } catch {
    return null;
  }
  return null;
}

export type UseChatResult = {
  conversations: Conversation[];
  activeConversationId: string;
  activeConversation: Conversation;
  messages: ChatMessage[];
  activeAssistantId: string | null;
  status: StreamStatus;
  send: (question: string) => Promise<void>;
  regenerate: (assistantId: string) => Promise<void>;
  abort: () => void;
  reset: () => void;
  createConversation: () => string;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
};

export function useChat(): UseChatResult {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const abortMapRef = useRef<Map<string, AbortController>>(new Map());
  const stateRef = useRef(state);
  stateRef.current = state;

  const abortConversation = useCallback((conversationId: string) => {
    const ctrl = abortMapRef.current.get(conversationId);
    if (ctrl) {
      ctrl.abort();
      abortMapRef.current.delete(conversationId);
    }
  }, []);

  const abort = useCallback(() => {
    abortConversation(stateRef.current.activeConversationId);
  }, [abortConversation]);

  const reset = useCallback(() => {
    for (const ctrl of abortMapRef.current.values()) ctrl.abort();
    abortMapRef.current.clear();
    dispatch({ type: "reset", id: newId() });
  }, []);

  const runStream = useCallback(
    async (conversationId: string, assistantId: string, question: string) => {
      abortConversation(conversationId);
      const controller = new AbortController();
      abortMapRef.current.set(conversationId, controller);

      let response: Response;
      try {
        response = await fetch(chatEndpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ question }),
          signal: controller.signal,
        });
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return;
        dispatch({
          type: "fail",
          conversationId,
          assistantId,
          message: e instanceof Error ? e.message : "network error",
        });
        return;
      }

      if (!response.ok || !response.body) {
        dispatch({
          type: "fail",
          conversationId,
          assistantId,
          message: `request failed (${response.status})`,
        });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const { events, rest } = parseSSEChunk(buffer);
          buffer = rest;
          for (const e of events) {
            const parsed = decodeEvent(e.event, e.data);
            if (parsed) dispatch({ type: "event", conversationId, assistantId, event: parsed });
          }
        }
        const tail = buffer + decoder.decode();
        if (tail.trim()) {
          const { events } = parseSSEChunk(`${tail}\n\n`);
          for (const e of events) {
            const parsed = decodeEvent(e.event, e.data);
            if (parsed) dispatch({ type: "event", conversationId, assistantId, event: parsed });
          }
        }
        dispatch({ type: "finish", conversationId, assistantId });
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return;
        dispatch({
          type: "fail",
          conversationId,
          assistantId,
          message: e instanceof Error ? e.message : "stream error",
        });
      } finally {
        if (abortMapRef.current.get(conversationId) === controller) {
          abortMapRef.current.delete(conversationId);
        }
      }
    },
    [abortConversation],
  );

  const send = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;
      const conversationId = stateRef.current.activeConversationId;
      const userId = newId();
      const assistantId = newId();
      dispatch({ type: "start", conversationId, question: trimmed, userId, assistantId });
      await runStream(conversationId, assistantId, trimmed);
    },
    [runStream],
  );

  const regenerate = useCallback(
    async (assistantId: string) => {
      const conversationId = stateRef.current.activeConversationId;
      const conversation = stateRef.current.conversations.find((c) => c.id === conversationId);
      if (!conversation) return;
      const target = conversation.messages.find(
        (m): m is AssistantMessage => m.id === assistantId && m.role === "assistant",
      );
      if (!target) return;
      const newAssistantId = newId();
      dispatch({
        type: "regenerate",
        conversationId,
        assistantId: newAssistantId,
        question: target.sourceQuestion,
        replaceId: assistantId,
      });
      await runStream(conversationId, newAssistantId, target.sourceQuestion);
    },
    [runStream],
  );

  const createConversation = useCallback((): string => {
    const id = newId();
    dispatch({ type: "create_conversation", id });
    return id;
  }, []);

  const selectConversation = useCallback((id: string) => {
    dispatch({ type: "select_conversation", id });
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      abortConversation(id);
      dispatch({ type: "delete_conversation", id, fallbackId: newId() });
    },
    [abortConversation],
  );

  const activeConversation =
    state.conversations.find((c) => c.id === state.activeConversationId) ?? state.conversations[0];

  return {
    conversations: state.conversations,
    activeConversationId: state.activeConversationId,
    activeConversation,
    messages: activeConversation.messages,
    activeAssistantId: activeConversation.activeAssistantId,
    status: activeConversation.status,
    send,
    regenerate,
    abort,
    reset,
    createConversation,
    selectConversation,
    deleteConversation,
  };
}

// 後方互換: 既存テスト/利用者向けの薄いラッパ。アクティブ会話の最新ターンをフラット化して返す。
export type UseAgentStreamResult = {
  status: StreamStatus;
  question: string;
  trace: TraceItem[];
  answer: string;
  error: string | null;
  send: (question: string) => Promise<void>;
  abort: () => void;
  reset: () => void;
};

export function useAgentStream(): UseAgentStreamResult {
  const chat = useChat();
  const lastAssistant = [...chat.messages]
    .reverse()
    .find((m): m is AssistantMessage => m.role === "assistant");
  const lastUser = [...chat.messages].reverse().find((m) => m.role === "user");
  return {
    status: chat.status,
    question: lastUser?.content ?? "",
    trace: lastAssistant?.trace ?? [],
    answer: lastAssistant?.content ?? "",
    error: lastAssistant?.error ?? null,
    send: chat.send,
    abort: chat.abort,
    reset: chat.reset,
  };
}
