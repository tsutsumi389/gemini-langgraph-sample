import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useChat } from "@/hooks/useAgentStream";

describe("useChat (multi-conversation)", () => {
  it("starts with a single empty conversation", () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.conversations[0].title).toBe("New chat");
    expect(result.current.activeConversationId).toBe(result.current.conversations[0].id);
    expect(result.current.messages).toEqual([]);
  });

  it("prepends a new conversation and switches to it", () => {
    const { result } = renderHook(() => useChat());
    const firstId = result.current.activeConversationId;

    let newId = "";
    act(() => {
      newId = result.current.createConversation();
    });

    expect(result.current.conversations).toHaveLength(2);
    expect(result.current.conversations[0].id).toBe(newId);
    expect(result.current.activeConversationId).toBe(newId);

    act(() => {
      result.current.selectConversation(firstId);
    });
    expect(result.current.activeConversationId).toBe(firstId);
  });

  it("creates a fresh empty conversation when deleting the last one", () => {
    const { result } = renderHook(() => useChat());
    const onlyId = result.current.activeConversationId;

    act(() => {
      result.current.deleteConversation(onlyId);
    });

    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.conversations[0].id).not.toBe(onlyId);
    expect(result.current.conversations[0].title).toBe("New chat");
    expect(result.current.activeConversationId).toBe(result.current.conversations[0].id);
  });

  it("falls back to a sibling conversation when active is deleted", () => {
    const { result } = renderHook(() => useChat());
    const firstId = result.current.activeConversationId;

    act(() => {
      result.current.createConversation();
    });
    const secondId = result.current.activeConversationId;
    expect(secondId).not.toBe(firstId);

    act(() => {
      result.current.deleteConversation(secondId);
    });

    expect(result.current.conversations.map((c) => c.id)).toEqual([firstId]);
    expect(result.current.activeConversationId).toBe(firstId);
  });

  it("ignores selectConversation for unknown ids", () => {
    const { result } = renderHook(() => useChat());
    const before = result.current.activeConversationId;
    act(() => {
      result.current.selectConversation("does-not-exist");
    });
    expect(result.current.activeConversationId).toBe(before);
  });
});
