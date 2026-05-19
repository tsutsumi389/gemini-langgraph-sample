"use client";

import { Check, Copy, RotateCcw } from "lucide-react";
import { useState } from "react";

type Props = {
  content: string;
  onRegenerate: () => void;
  disabled?: boolean;
};

export function MessageActions({ content, onRegenerate, disabled }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="mt-0.5 flex items-center gap-1 self-start text-muted-foreground opacity-60 transition-opacity group-hover/turn:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
      <button
        type="button"
        onClick={handleCopy}
        disabled={!content}
        aria-label="copy answer"
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {copied ? "Copied" : "Copy"}
      </button>
      <button
        type="button"
        onClick={onRegenerate}
        disabled={disabled}
        aria-label="regenerate answer"
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Regenerate
      </button>
    </div>
  );
}
