import { describe, expect, it } from "vitest";
import { parseSSEChunk } from "@/lib/sse";

describe("parseSSEChunk", () => {
  it("parses a complete event with event and data lines", () => {
    const buf = "event: graph_start\ndata: {\"question\":\"hi\"}\n\n";
    const { events, rest } = parseSSEChunk(buf);
    expect(events).toEqual([
      { event: "graph_start", data: '{"question":"hi"}' },
    ]);
    expect(rest).toBe("");
  });

  it("parses multiple events in a single buffer", () => {
    const buf =
      "event: a\ndata: 1\n\nevent: b\ndata: 2\n\n";
    const { events, rest } = parseSSEChunk(buf);
    expect(events.map((e) => e.event)).toEqual(["a", "b"]);
    expect(events.map((e) => e.data)).toEqual(["1", "2"]);
    expect(rest).toBe("");
  });

  it("returns trailing incomplete data as rest", () => {
    const buf = "event: a\ndata: 1\n\nevent: b\ndata: 2";
    const { events, rest } = parseSSEChunk(buf);
    expect(events).toEqual([{ event: "a", data: "1" }]);
    expect(rest).toBe("event: b\ndata: 2");
  });

  it("defaults event to 'message' when omitted", () => {
    const buf = "data: just data\n\n";
    const { events } = parseSSEChunk(buf);
    expect(events).toEqual([{ event: "message", data: "just data" }]);
  });

  it("normalizes CRLF line endings", () => {
    const buf = "event: x\r\ndata: y\r\n\r\n";
    const { events } = parseSSEChunk(buf);
    expect(events).toEqual([{ event: "x", data: "y" }]);
  });

  it("supports multi-line data (concatenated with newline)", () => {
    const buf = "event: x\ndata: line1\ndata: line2\n\n";
    const { events } = parseSSEChunk(buf);
    expect(events).toEqual([{ event: "x", data: "line1\nline2" }]);
  });

  it("ignores empty blocks", () => {
    const buf = "\n\n\n\nevent: a\ndata: 1\n\n";
    const { events } = parseSSEChunk(buf);
    expect(events).toEqual([{ event: "a", data: "1" }]);
  });
});
