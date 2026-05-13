import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChatInput } from "@/components/ChatInput";

describe("ChatInput", () => {
  it("calls onSend with the typed question when submitted", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} disabled={false} />);

    const textbox = screen.getByRole("textbox", { name: /question/i });
    await user.type(textbox, "what is x?");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(onSend).toHaveBeenCalledWith("what is x?");
  });

  it("does not submit when empty", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} disabled={false} />);

    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(onSend).not.toHaveBeenCalled();
  });

  it("disables the button when disabled prop is true", () => {
    render(<ChatInput onSend={() => {}} disabled />);
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("clears input after submit", async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatInput onSend={onSend} disabled={false} />);

    const textbox = screen.getByRole("textbox", { name: /question/i });
    await user.type(textbox, "hi");
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(textbox).toHaveValue("");
  });
});
