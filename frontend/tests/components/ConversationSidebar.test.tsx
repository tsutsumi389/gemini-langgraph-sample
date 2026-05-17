import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import type { Conversation } from "@/types/agent";

function conv(partial: Partial<Conversation> & Pick<Conversation, "id" | "title">): Conversation {
  return {
    messages: [],
    activeAssistantId: null,
    status: "idle",
    createdAt: 0,
    ...partial,
  };
}

const noop = () => {};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ConversationSidebar", () => {
  it("renders all conversations and highlights the active one", () => {
    render(
      <ConversationSidebar
        conversations={[
          conv({ id: "a", title: "First chat" }),
          conv({ id: "b", title: "Second chat" }),
        ]}
        activeConversationId="b"
        onSelect={noop}
        onCreate={noop}
        onDelete={noop}
      />,
    );

    const items = screen.getAllByTestId("conversation-item");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAttribute("data-active", "false");
    expect(items[1]).toHaveAttribute("data-active", "true");
    expect(within(items[1]).getByRole("button", { name: "Second chat" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("calls onSelect when a conversation is clicked", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <ConversationSidebar
        conversations={[conv({ id: "a", title: "First" }), conv({ id: "b", title: "Second" })]}
        activeConversationId="a"
        onSelect={onSelect}
        onCreate={noop}
        onDelete={noop}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Second" }));
    expect(onSelect).toHaveBeenCalledWith("b");
  });

  it("calls onCreate when 'New chat' is clicked", async () => {
    const onCreate = vi.fn();
    const user = userEvent.setup();
    render(
      <ConversationSidebar
        conversations={[conv({ id: "a", title: "First" })]}
        activeConversationId="a"
        onSelect={noop}
        onCreate={onCreate}
        onDelete={noop}
      />,
    );
    await user.click(screen.getByRole("button", { name: /new chat/i }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("calls onDelete after confirm", async () => {
    const onDelete = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(
      <ConversationSidebar
        conversations={[conv({ id: "a", title: "Hello world" })]}
        activeConversationId="a"
        onSelect={noop}
        onCreate={noop}
        onDelete={onDelete}
      />,
    );
    await user.click(screen.getByRole("button", { name: /delete hello world/i }));
    expect(onDelete).toHaveBeenCalledWith("a");
  });

  it("does not call onDelete when confirm is cancelled", async () => {
    const onDelete = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(
      <ConversationSidebar
        conversations={[conv({ id: "a", title: "Hello" })]}
        activeConversationId="a"
        onSelect={noop}
        onCreate={noop}
        onDelete={onDelete}
      />,
    );
    await user.click(screen.getByRole("button", { name: /delete hello/i }));
    expect(onDelete).not.toHaveBeenCalled();
  });
});
