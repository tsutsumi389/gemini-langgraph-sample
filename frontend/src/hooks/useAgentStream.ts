"use client";

import { useCallback, useReducer, useRef } from "react";
import { chatEndpoint } from "@/lib/api";
import { parseSSEChunk } from "@/lib/sse";
import type { AssistantMessage, ChatEvent, ChatMessage, ChatState, TraceItem } from "@/types/agent";

type Action =
  | { type: "start"; question: string; userId: string; assistantId: string }
  | { type: "regenerate"; assistantId: string; question: string; replaceId: string }
  | { type: "event"; assistantId: string; event: ChatEvent }
  | { type: "finish"; assistantId: string }
  | { type: "fail"; assistantId: string | null; message: string }
  | { type: "reset" };

const initialState: ChatState = {
  messages: [],
  activeAssistantId: null,
  status: "idle",
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
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
      return {
        messages: [...state.messages, userMsg, assistantMsg],
        activeAssistantId: action.assistantId,
        status: "streaming",
      };
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
      const idx = state.messages.findIndex((m) => m.id === action.replaceId);
      const next =
        idx >= 0
          ? [...state.messages.slice(0, idx), assistantMsg, ...state.messages.slice(idx + 1)]
          : [...state.messages, assistantMsg];
      return { messages: next, activeAssistantId: action.assistantId, status: "streaming" };
    }
    case "event": {
      const messages = state.messages.map((m) =>
        m.id === action.assistantId && m.role === "assistant"
          ? applyEventToMessage(m, action.event)
          : m,
      );
      const status = action.event.type === "error" ? "error" : state.status;
      return { ...state, messages, status };
    }
    case "finish":
      return {
        ...state,
        status: state.status === "error" ? "error" : "done",
        activeAssistantId: null,
        messages: state.messages.map((m) =>
          m.id === action.assistantId && m.role === "assistant" && m.status === "streaming"
            ? { ...m, status: "done" }
            : m,
        ),
      };
    case "fail":
      return {
        ...state,
        status: "error",
        activeAssistantId: null,
        messages: state.messages.map((m) =>
          action.assistantId && m.id === action.assistantId && m.role === "assistant"
            ? { ...m, status: "error", error: action.message }
            : m,
        ),
      };
    case "reset":
      return initialState;
    default:
      return state;
  }
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

export type UseChatResult = ChatState & {
  send: (question: string) => Promise<void>;
  regenerate: (assistantId: string) => Promise<void>;
  abort: () => void;
  reset: () => void;
};

export function useChat(): UseChatResult {
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortRef = useRef<AbortController | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    abort();
    dispatch({ type: "reset" });
  }, [abort]);

  const runStream = useCallback(async (assistantId: string, question: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

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
        assistantId,
        message: e instanceof Error ? e.message : "network error",
      });
      return;
    }

    if (!response.ok || !response.body) {
      dispatch({
        type: "fail",
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
          if (parsed) dispatch({ type: "event", assistantId, event: parsed });
        }
      }
      const tail = buffer + decoder.decode();
      if (tail.trim()) {
        const { events } = parseSSEChunk(`${tail}\n\n`);
        for (const e of events) {
          const parsed = decodeEvent(e.event, e.data);
          if (parsed) dispatch({ type: "event", assistantId, event: parsed });
        }
      }
      dispatch({ type: "finish", assistantId });
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      dispatch({
        type: "fail",
        assistantId,
        message: e instanceof Error ? e.message : "stream error",
      });
    }
  }, []);

  const send = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;
      const userId = newId();
      const assistantId = newId();
      dispatch({ type: "start", question: trimmed, userId, assistantId });
      await runStream(assistantId, trimmed);
    },
    [runStream],
  );

  const regenerate = useCallback(
    async (assistantId: string) => {
      const target = stateRef.current.messages.find(
        (m): m is AssistantMessage => m.id === assistantId && m.role === "assistant",
      );
      if (!target) return;
      const newAssistantId = newId();
      dispatch({
        type: "regenerate",
        assistantId: newAssistantId,
        question: target.sourceQuestion,
        replaceId: assistantId,
      });
      await runStream(newAssistantId, target.sourceQuestion);
    },
    [runStream],
  );

  return { ...state, send, regenerate, abort, reset };
}

// 後方互換: 既存テスト/利用者向けの薄いラッパ。多ターン状態を旧APIにフラット化して返す。
export type UseAgentStreamResult = {
  status: import("@/types/agent").StreamStatus;
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
