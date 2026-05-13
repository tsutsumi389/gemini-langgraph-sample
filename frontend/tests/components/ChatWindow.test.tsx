import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatWindow } from "@/components/ChatWindow";

describe("ChatWindow", () => {
  it("shows a placeholder when there is no question and no answer", () => {
    render(<ChatWindow question="" answer="" status="idle" />);
    expect(screen.getByText(/質問を入力/i)).toBeInTheDocument();
  });

  it("renders the question and a streaming indicator while streaming", () => {
    render(<ChatWindow question="hello?" answer="" status="streaming" />);
    expect(screen.getByText("hello?")).toBeInTheDocument();
    expect(screen.getByText(/考え中/i)).toBeInTheDocument();
  });

  it("renders the answer when done", () => {
    render(<ChatWindow question="capital of france?" answer="Paris." status="done" />);
    expect(screen.getByText("capital of france?")).toBeInTheDocument();
    expect(screen.getByText("Paris.")).toBeInTheDocument();
  });

  it("renders an error message when status is error", () => {
    render(<ChatWindow question="x" answer="" status="error" error="boom" />);
    expect(screen.getByText(/boom/)).toBeInTheDocument();
  });
});
