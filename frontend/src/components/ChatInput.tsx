"use client";

import { Send, Square } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  onSend: (question: string) => void;
  isStreaming: boolean;
  onAbort?: () => void;
};

const MAX_ROWS = 8;

export function ChatInput({ onSend, isStreaming, onAbort }: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const isComposingRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight || "20");
    const max = lineHeight * MAX_ROWS + 16;
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  }, []);

  const submit = () => {
    if (isStreaming) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
    if (ref.current) ref.current.style.height = "auto";
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return;
    if (e.shiftKey) return;
    if (isComposingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    submit();
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight || "20");
    const max = lineHeight * MAX_ROWS + 16;
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-3xl border border-border/70 bg-card/95 p-2 shadow-sm backdrop-blur transition-all focus-within:border-accent-brand/50 focus-within:shadow-md focus-within:ring-2 focus-within:ring-accent-brand/15"
    >
      <Textarea
        ref={ref}
        aria-label="question"
        placeholder="質問を入力... (Enter で送信 / Shift+Enter で改行)"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={() => {
          isComposingRef.current = false;
        }}
        rows={1}
        className="max-h-[200px] min-h-[40px] flex-1 resize-none border-0 bg-transparent px-3 py-2 shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-0"
      />
      {isStreaming ? (
        <Button
          type="button"
          variant="secondary"
          aria-label="stop"
          onClick={() => onAbort?.()}
          className="gap-1.5 rounded-2xl"
        >
          <Square className="h-3.5 w-3.5 fill-current" />
          Stop
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={!value.trim()}
          className="gap-1.5 rounded-2xl bg-accent-brand text-accent-brand-foreground shadow-sm shadow-accent-brand/25 transition-colors hover:bg-accent-brand/90 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
        >
          <Send className="h-3.5 w-3.5" />
          Send
        </Button>
      )}
    </form>
  );
}
