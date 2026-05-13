"use client";

import { useCallback, useReducer, useRef } from "react";
import { chatEndpoint } from "@/lib/api";
import { parseSSEChunk } from "@/lib/sse";
import type { ChatEvent, StreamState, TraceItem } from "@/types/agent";

type Action =
  | { type: "start"; question: string }
  | { type: "event"; event: ChatEvent }
  | { type: "finish" }
  | { type: "fail"; message: string }
  | { type: "reset" };

const initialState: StreamState = {
  status: "idle",
  question: "",
  trace: [],
  answer: "",
  error: null,
};

function reducer(state: StreamState, action: Action): StreamState {
  switch (action.type) {
    case "start":
      return {
        status: "streaming",
        question: action.question,
        trace: [],
        answer: "",
        error: null,
      };
    case "event":
      return applyEvent(state, action.event);
    case "finish":
      return state.status === "error" ? state : { ...state, status: "done" };
    case "fail":
      return { ...state, status: "error", error: action.message };
    case "reset":
      return initialState;
    default:
      return state;
  }
}

function applyEvent(state: StreamState, ev: ChatEvent): StreamState {
  switch (ev.type) {
    case "graph_start":
      return { ...state, question: ev.payload.question };
    case "node_update":
      return { ...state, trace: [...state.trace, ev.payload as TraceItem] };
    case "final":
      return { ...state, answer: ev.payload.answer };
    case "error":
      return { ...state, status: "error", error: ev.payload.message };
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

export type UseAgentStreamResult = StreamState & {
  send: (question: string) => Promise<void>;
  abort: () => void;
  reset: () => void;
};

export function useAgentStream(): UseAgentStreamResult {
  const [state, dispatch] = useReducer(reducer, initialState);
  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    abort();
    dispatch({ type: "reset" });
  }, [abort]);

  const send = useCallback(async (question: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    dispatch({ type: "start", question });

    let response: Response;
    try {
      response = await fetch(chatEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });
    } catch (e) {
      dispatch({
        type: "fail",
        message: e instanceof Error ? e.message : "network error",
      });
      return;
    }

    if (!response.ok || !response.body) {
      dispatch({ type: "fail", message: `request failed (${response.status})` });
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
          if (parsed) dispatch({ type: "event", event: parsed });
        }
      }
      // flush remaining buffer
      const tail = buffer + decoder.decode();
      if (tail.trim()) {
        const { events } = parseSSEChunk(`${tail}\n\n`);
        for (const e of events) {
          const parsed = decodeEvent(e.event, e.data);
          if (parsed) dispatch({ type: "event", event: parsed });
        }
      }
      dispatch({ type: "finish" });
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
      dispatch({
        type: "fail",
        message: e instanceof Error ? e.message : "stream error",
      });
    }
  }, []);

  return { ...state, send, abort, reset };
}
