import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MessageRow } from "@/components/MessageRow";

describe("MessageRow", () => {
  it("renders user avatar and HH:MM timestamp", () => {
    const createdAt = new Date(2026, 0, 1, 9, 5).getTime();
    render(<MessageRow from="user" content="hello" createdAt={createdAt} />);

    expect(screen.getByTestId("avatar-user")).toBeInTheDocument();
    expect(screen.getByTestId("message-time")).toHaveTextContent("09:05");
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("renders assistant avatar with children content", () => {
    render(
      <MessageRow from="assistant">
        <span>streaming…</span>
      </MessageRow>,
    );

    expect(screen.getByTestId("avatar-assistant")).toBeInTheDocument();
    expect(screen.getByText("streaming…")).toBeInTheDocument();
  });

  it("hides timestamp when createdAt is not provided", () => {
    render(<MessageRow from="assistant" content="x" />);
    expect(screen.queryByTestId("message-time")).not.toBeInTheDocument();
  });
});
