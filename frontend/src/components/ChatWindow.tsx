"use client";

import { ArrowDown, ArrowUpRight, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AgentTrace } from "@/components/AgentTrace";
import { MessageActions } from "@/components/MessageActions";
import { MessageRow } from "@/components/MessageRow";
import { ThinkingDots } from "@/components/ThinkingDots";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SAMPLE_QUESTIONS } from "@/lib/samples";
import type { AssistantMessage, ChatMessage } from "@/types/agent";

type Props = {
  messages: ChatMessage[];
  activeAssistantId: string | null;
  onSampleClick: (q: string) => void;
  onRegenerate: (assistantId: string) => void;
};

export function ChatWindow({ messages, activeAssistantId, onSampleClick, onRegenerate }: Props) {
  const endRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    const sentinel = endRef.current;
    if (!sentinel) return;
    const viewport = sentinel.closest('[data-slot="scroll-area-viewport"]');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setIsAtBottom(entry.isIntersecting);
        }
      },
      { root: viewport, threshold: 0.01, rootMargin: "0px 0px 32px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    endRef.current?.scrollIntoView?.({ behavior: smooth ? "smooth" : "auto", block: "end" });
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: ストリーミングで messages 参照が更新されるたびに末尾追従させたい
  useEffect(() => {
    if (!isAtBottom) return;
    scrollToBottom(false);
  }, [messages, isAtBottom, scrollToBottom]);

  const isEmpty = messages.length === 0;

  return (
    <div className="relative flex-1">
      <ScrollArea className="h-full w-full">
        <div className="mx-auto flex min-h-[280px] w-full max-w-3xl flex-col gap-7 px-4 py-8 md:px-6 md:py-10">
          {isEmpty && <EmptyState onSampleClick={onSampleClick} />}

          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="message-enter">
                <MessageRow from="user" content={m.content} createdAt={m.createdAt} />
              </div>
            ) : (
              <AssistantTurn
                key={m.id}
                message={m}
                isActive={m.id === activeAssistantId}
                onRegenerate={() => onRegenerate(m.id)}
              />
            ),
          )}

          <div ref={endRef} />
        </div>
      </ScrollArea>

      {!isAtBottom && (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label="scroll to bottom"
          onClick={() => scrollToBottom(true)}
          className="absolute right-4 bottom-4 h-9 w-9 rounded-full bg-surface-1 shadow-[var(--shadow-elev-2)] ring-1 ring-hairline-strong backdrop-blur-xl transition-all hover:-translate-y-px hover:ring-accent-brand/40"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function EmptyState({ onSampleClick }: { onSampleClick: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-6 py-12 md:py-16">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span
          aria-hidden="true"
          className="halo absolute -inset-4 rounded-full bg-accent-brand/15 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-accent-brand/20 blur-xl"
        />
        <span
          aria-hidden="true"
          className="absolute inset-[-2px] rounded-2xl ring-1 ring-accent-brand/20"
        />
        <div
          aria-hidden="true"
          className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--accent-grad-from),var(--accent-grad-to))] text-accent-brand-foreground shadow-[var(--shadow-elev-2)] ring-1 ring-inset ring-white/15"
        >
          <Sparkles className="h-7 w-7" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-gradient-brand font-heading font-semibold text-[22px] tracking-[-0.02em]">
          何でも聞いてください
        </h2>
        <p className="max-w-md text-[13px] leading-relaxed text-muted-foreground/85">
          質問を入力するだけで、research → reflection → answer のループで Gemini
          が最適な回答を組み立てます。
        </p>
      </div>
      <ul className="grid w-full max-w-2xl grid-cols-1 gap-2.5 sm:grid-cols-2">
        {SAMPLE_QUESTIONS.map((q) => (
          <li key={q}>
            <button
              type="button"
              onClick={() => onSampleClick(q)}
              className="group relative flex w-full items-start gap-2.5 overflow-hidden rounded-2xl border border-hairline-strong bg-surface-2 px-4 py-3.5 text-left text-[12.5px] text-muted-foreground shadow-[var(--shadow-elev-1)] transition-all duration-200 hover:-translate-y-[2px] hover:border-transparent hover:bg-surface-1 hover:text-foreground hover:shadow-[var(--shadow-elev-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-brand/30"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(80%_120%_at_0%_0%,var(--accent-brand-haze),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <Sparkles
                aria-hidden="true"
                className="relative mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-brand/70 group-hover:text-accent-brand"
              />
              <span className="relative line-clamp-2 flex-1 leading-snug">{q}</span>
              <ArrowUpRight
                aria-hidden="true"
                className="relative mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100"
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StreamingPlaceholder() {
  return (
    <div className="flex w-full flex-col gap-2.5">
      <ThinkingDots />
      <div aria-hidden="true" className="flex flex-col gap-1.5">
        <div className="h-3 w-[88%] rounded-md shimmer-bar" />
        <div className="h-3 w-[72%] rounded-md shimmer-bar" />
        <div className="h-3 w-[60%] rounded-md shimmer-bar" />
      </div>
    </div>
  );
}

function AssistantTurn({
  message,
  isActive,
  onRegenerate,
}: {
  message: AssistantMessage;
  isActive: boolean;
  onRegenerate: () => void;
}) {
  const isStreaming = message.status === "streaming";
  const content =
    isStreaming && !message.content ? (
      <StreamingPlaceholder />
    ) : message.status === "error" ? (
      <span className="text-destructive">エラー: {message.error ?? "unknown"}</span>
    ) : (
      message.content
    );

  return (
    <div className="group/turn message-enter flex flex-col gap-2">
      {message.trace.length > 0 && (
        <div className="ml-11">
          <AgentTrace trace={message.trace} active={isActive && isStreaming} />
        </div>
      )}
      <MessageRow from="assistant" content={content} createdAt={message.createdAt} />
      {!isStreaming && (
        <div className="ml-11">
          <MessageActions
            content={message.content}
            onRegenerate={onRegenerate}
            disabled={isActive}
          />
        </div>
      )}
    </div>
  );
}
