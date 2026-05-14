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
    <div className="mt-1 flex items-center gap-1 self-start text-muted-foreground">
      <button
        type="button"
        onClick={handleCopy}
        disabled={!content}
        aria-label="copy answer"
        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
      <button
        type="button"
        onClick={onRegenerate}
        disabled={disabled}
        aria-label="regenerate answer"
        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
      >
        <RotateCcw className="h-3 w-3" />
        Regenerate
      </button>
    </div>
  );
}
