"use client";

import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  onSend: (question: string) => void;
  disabled: boolean;
};

const MAX_ROWS = 8;

export function ChatInput({ onSend, disabled }: Props) {
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
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
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
    if (e.shiftKey) return; // 改行
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
    <form onSubmit={handleSubmit} className="flex items-end gap-2 w-full">
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
        disabled={disabled}
        rows={1}
        className="flex-1 min-h-[40px] max-h-[200px]"
      />
      <Button type="submit" disabled={disabled || !value.trim()}>
        Send
      </Button>
    </form>
  );
}
