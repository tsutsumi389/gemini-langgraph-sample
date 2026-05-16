import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChatInput } from "@/components/ChatInput";

describe("ChatInput", () => {
  it("calls onSend with the typed question when submitted", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} isStreaming={false} />);

    const textbox = screen.getByRole("textbox", { name: /question/i });
    await user.type(textbox, "what is x?");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(onSend).toHaveBeenCalledWith("what is x?");
  });

  it("does not submit when empty", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} isStreaming={false} />);

    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(onSend).not.toHaveBeenCalled();
  });

  it("disables the send button when input is empty", () => {
    render(<ChatInput onSend={() => {}} isStreaming={false} />);
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("clears input after submit", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} isStreaming={false} />);

    const textbox = screen.getByRole("textbox", { name: /question/i });
    await user.type(textbox, "hi");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(textbox).toHaveValue("");
  });

  it("shows a stop button while streaming and calls onAbort when clicked", async () => {
    const onSend = vi.fn();
    const onAbort = vi.fn();
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} isStreaming={true} onAbort={onAbort} />);

    expect(screen.queryByRole("button", { name: /send/i })).not.toBeInTheDocument();
    const stop = screen.getByRole("button", { name: /stop/i });
    await user.click(stop);
    expect(onAbort).toHaveBeenCalledTimes(1);
    expect(onSend).not.toHaveBeenCalled();
  });
});
