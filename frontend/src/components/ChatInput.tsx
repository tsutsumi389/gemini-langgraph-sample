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
    <div className="relative mx-auto w-full max-w-3xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-[calc(var(--radius)*2.2+1px)] bg-[conic-gradient(from_180deg_at_50%_50%,var(--accent-grad-from),transparent_45%,transparent_55%,var(--accent-grad-to))] opacity-0 transition-opacity duration-300 group-focus-within/input:opacity-60"
      />
      <form
        onSubmit={handleSubmit}
        className="group/input relative flex w-full items-end gap-2 rounded-3xl border border-hairline-strong bg-surface-1 p-2 shadow-[var(--shadow-elev-1)] backdrop-blur-xl transition-all focus-within:border-transparent focus-within:shadow-[var(--shadow-elev-2)]"
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
          className="max-h-[200px] min-h-[40px] flex-1 resize-none border-0 bg-transparent px-3 py-2 shadow-none placeholder:tracking-tight placeholder:text-muted-foreground/60 focus-visible:ring-0"
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
            className="relative gap-1.5 rounded-2xl bg-[linear-gradient(135deg,var(--accent-grad-from),var(--accent-grad-to))] text-accent-brand-foreground shadow-[0_1px_0_oklch(1_0_0/0.15)_inset,0_6px_16px_-6px_var(--accent-brand)] transition-all hover:brightness-110 hover:shadow-[0_1px_0_oklch(1_0_0/0.15)_inset,0_8px_22px_-6px_var(--accent-brand)] active:translate-y-px disabled:bg-muted disabled:bg-none disabled:text-muted-foreground disabled:shadow-none"
          >
            <Send className="h-3.5 w-3.5" />
            Send
          </Button>
        )}
      </form>
    </div>
  );
}
