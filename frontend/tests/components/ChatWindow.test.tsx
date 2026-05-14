import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChatWindow } from "@/components/ChatWindow";
import type { AssistantMessage, ChatMessage, UserMessage } from "@/types/agent";

const noop = () => {};

function userMsg(content: string, id = "u1"): UserMessage {
  return { id, role: "user", content, createdAt: 0 };
}

function asstMsg(
  partial: Partial<AssistantMessage> & Pick<AssistantMessage, "content" | "status">,
  id = "a1",
): AssistantMessage {
  return {
    id,
    role: "assistant",
    trace: [],
    error: null,
    createdAt: 0,
    sourceQuestion: "q",
    ...partial,
  };
}

describe("ChatWindow", () => {
  it("shows a placeholder and sample chips when empty", () => {
    render(
      <ChatWindow
        messages={[]}
        activeAssistantId={null}
        onSampleClick={noop}
        onRegenerate={noop}
      />,
    );
    expect(screen.getByText(/質問を入力/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
  });

  it("calls onSampleClick when a sample chip is clicked", async () => {
    const onSampleClick = vi.fn();
    const user = userEvent.setup();
    render(
      <ChatWindow
        messages={[]}
        activeAssistantId={null}
        onSampleClick={onSampleClick}
        onRegenerate={noop}
      />,
    );
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[0]);
    expect(onSampleClick).toHaveBeenCalledTimes(1);
    expect(onSampleClick.mock.calls[0][0]).toEqual(expect.any(String));
  });

  it("renders user and assistant messages", () => {
    const messages: ChatMessage[] = [
      userMsg("capital of france?", "u1"),
      asstMsg({ content: "Paris.", status: "done" }, "a1"),
    ];
    render(
      <ChatWindow
        messages={messages}
        activeAssistantId={null}
        onSampleClick={noop}
        onRegenerate={noop}
      />,
    );
    expect(screen.getByText("capital of france?")).toBeInTheDocument();
    expect(screen.getByText("Paris.")).toBeInTheDocument();
  });

  it("renders streaming indicator while assistant is streaming with no content", () => {
    const messages: ChatMessage[] = [
      userMsg("hello?", "u1"),
      asstMsg({ content: "", status: "streaming" }, "a1"),
    ];
    render(
      <ChatWindow
        messages={messages}
        activeAssistantId="a1"
        onSampleClick={noop}
        onRegenerate={noop}
      />,
    );
    expect(screen.getByText(/考え中/i)).toBeInTheDocument();
  });

  it("renders an error message when assistant has error status", () => {
    const messages: ChatMessage[] = [
      userMsg("x", "u1"),
      asstMsg({ content: "", status: "error", error: "boom" }, "a1"),
    ];
    render(
      <ChatWindow
        messages={messages}
        activeAssistantId={null}
        onSampleClick={noop}
        onRegenerate={noop}
      />,
    );
    expect(screen.getByText(/boom/)).toBeInTheDocument();
  });

  it("calls onRegenerate when regenerate button is clicked", async () => {
    const onRegenerate = vi.fn();
    const user = userEvent.setup();
    const messages: ChatMessage[] = [
      userMsg("x", "u1"),
      asstMsg({ content: "answer", status: "done" }, "a1"),
    ];
    render(
      <ChatWindow
        messages={messages}
        activeAssistantId={null}
        onSampleClick={noop}
        onRegenerate={onRegenerate}
      />,
    );
    await user.click(screen.getByRole("button", { name: /regenerate/i }));
    expect(onRegenerate).toHaveBeenCalledWith("a1");
  });
});
