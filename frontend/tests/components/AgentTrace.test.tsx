import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentTrace } from "@/components/AgentTrace";
import type { TraceItem } from "@/types/agent";

describe("AgentTrace", () => {
  it("renders nothing visible when trace is empty", () => {
    const { container } = render(<AgentTrace trace={[]} />);
    expect(container.textContent ?? "").not.toMatch(/research|reflection|answer/i);
  });

  it("renders each node label in order", () => {
    const trace: TraceItem[] = [
      { node: "research", update: { iteration: "1" } },
      { node: "reflection", update: { needs_more_research: "false" } },
      { node: "answer", update: { answer: "Paris." } },
    ];
    render(<AgentTrace trace={trace} />);
    const labels = screen.getAllByTestId("trace-node-label").map((el) => el.textContent);
    expect(labels).toEqual([
      expect.stringMatching(/research/i),
      expect.stringMatching(/reflection/i),
      expect.stringMatching(/answer/i),
    ]);
  });

  it("marks the last step as active when active prop is true", () => {
    const trace: TraceItem[] = [{ node: "research", update: { iteration: "1" } }];
    render(<AgentTrace trace={trace} active />);
    const items = screen.getAllByTestId("trace-item");
    expect(items[items.length - 1].dataset.active).toBe("true");
  });
});
