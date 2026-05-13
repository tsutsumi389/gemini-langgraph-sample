import { act, renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { useAgentStream } from "@/hooks/useAgentStream";
import { server } from "../mocks/server";

const CHAT_URL = "http://localhost:8000/chat";

function sseStream(frames: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for (const frame of frames) {
        controller.enqueue(enc.encode(frame));
      }
      controller.close();
    },
  });
}

function frame(event: string, data: object): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

describe("useAgentStream", () => {
  it("starts idle", () => {
    const { result } = renderHook(() => useAgentStream());
    expect(result.current.status).toBe("idle");
    expect(result.current.trace).toEqual([]);
    expect(result.current.answer).toBe("");
  });

  it("streams events and reaches 'done' with final answer", async () => {
    server.use(
      http.post(CHAT_URL, () =>
        new HttpResponse(
          sseStream([
            frame("graph_start", { question: "hello?" }),
            frame("node_update", {
              node: "research",
              update: { research_notes: '["fact1"]', iteration: "1" },
            }),
            frame("node_update", {
              node: "reflection",
              update: { needs_more_research: "false", reflection: "ok" },
            }),
            frame("node_update", {
              node: "answer",
              update: { answer: "Hi there." },
            }),
            frame("final", { answer: "Hi there." }),
          ]),
          { headers: { "content-type": "text/event-stream" } },
        ),
      ),
    );

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.send("hello?");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("done");
    });

    expect(result.current.answer).toBe("Hi there.");
    expect(result.current.trace.map((t) => t.node)).toEqual([
      "research",
      "reflection",
      "answer",
    ]);
  });

  it("transitions to error on error event", async () => {
    server.use(
      http.post(CHAT_URL, () =>
        new HttpResponse(
          sseStream([
            frame("graph_start", { question: "x" }),
            frame("error", { message: "boom" }),
          ]),
          { headers: { "content-type": "text/event-stream" } },
        ),
      ),
    );

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.send("x");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.error).toBe("boom");
  });

  it("transitions to error if HTTP status is not 2xx", async () => {
    server.use(
      http.post(CHAT_URL, () => new HttpResponse("nope", { status: 500 })),
    );

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      await result.current.send("x");
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).not.toBeNull();
  });
});
