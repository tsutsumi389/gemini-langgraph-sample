import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { useChat } from "@/hooks/useAgentStream";
import { server } from "../mocks/server";

const BASE_URL = "http://localhost:8000";
const SERVER_ID = "11111111-1111-1111-1111-111111111111";

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

describe("useChat persistence integration", () => {
  it("hydrates conversations from the server on mount", async () => {
    server.use(
      http.get(`${BASE_URL}/conversations`, () =>
        HttpResponse.json([
          {
            id: SERVER_ID,
            title: "Previous chat",
            created_at: "2026-05-19T00:00:00Z",
            updated_at: "2026-05-19T00:00:00Z",
          },
        ]),
      ),
    );

    const { result } = renderHook(() => useChat());

    await waitFor(() => {
      expect(result.current.conversations.some((c) => c.id === SERVER_ID)).toBe(true);
    });
    expect(result.current.activeConversationId).toBe(SERVER_ID);
  });

  it("rebinds a local conversation id to the server id from graph_start", async () => {
    server.use(
      http.post(
        `${BASE_URL}/chat`,
        () =>
          new HttpResponse(
            sseStream([
              frame("graph_start", { question: "hi", conversation_id: SERVER_ID }),
              frame("node_update", { node: "answer", update: { answer: "yo" } }),
              frame("final", { answer: "yo" }),
            ]),
            { headers: { "content-type": "text/event-stream" } },
          ),
      ),
    );

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.send("hi");
    });

    await waitFor(() => expect(result.current.status).toBe("done"));
    expect(result.current.activeConversationId).toBe(SERVER_ID);
    expect(result.current.conversations.map((c) => c.id)).toContain(SERVER_ID);
  });

  it("calls DELETE /conversations/{id} for server-persisted conversations", async () => {
    let deletedId: string | null = null;
    server.use(
      http.get(`${BASE_URL}/conversations`, () =>
        HttpResponse.json([
          {
            id: SERVER_ID,
            title: "to be deleted",
            created_at: "2026-05-19T00:00:00Z",
            updated_at: "2026-05-19T00:00:00Z",
          },
        ]),
      ),
      http.delete(`${BASE_URL}/conversations/:id`, ({ params }) => {
        deletedId = params.id as string;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { result } = renderHook(() => useChat());

    await waitFor(() =>
      expect(result.current.conversations.some((c) => c.id === SERVER_ID)).toBe(true),
    );

    act(() => {
      result.current.deleteConversation(SERVER_ID);
    });

    await waitFor(() => expect(deletedId).toBe(SERVER_ID));
  });
});
