"use client";

import { ArrowDown, Bot, Sparkles } from "lucide-react";
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
      <ScrollArea className="h-full w-full rounded-xl border border-border/60 bg-card/60">
        <div className="mx-auto flex min-h-[280px] w-full max-w-3xl flex-col gap-5 px-4 py-5 md:px-6">
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
          className="absolute right-5 bottom-5 h-9 w-9 rounded-full border bg-card/90 shadow-lg backdrop-blur"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function EmptyState({ onSampleClick }: { onSampleClick: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-5 py-10">
      <div
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary"
      >
        <Bot className="h-6 w-6" />
      </div>
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h2 className="text-base font-semibold tracking-tight">何でも聞いてください</h2>
        <p className="text-sm text-muted-foreground">
          質問を入力してエージェントに問い合わせてください。
        </p>
      </div>
      <ul className="grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
        {SAMPLE_QUESTIONS.map((q) => (
          <li key={q}>
            <button
              type="button"
              onClick={() => onSampleClick(q)}
              className="group flex w-full items-start gap-2 rounded-lg border bg-background/40 px-3 py-2.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-background hover:text-foreground focus-visible:border-primary/60 focus-visible:outline-none"
            >
              <Sparkles
                aria-hidden="true"
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/70 group-hover:text-primary"
              />
              <span className="line-clamp-2 leading-snug">{q}</span>
            </button>
          </li>
        ))}
      </ul>
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
      <ThinkingDots />
    ) : message.status === "error" ? (
      <span className="text-destructive">エラー: {message.error ?? "unknown"}</span>
    ) : (
      message.content
    );

  return (
    <div className="group/turn message-enter flex flex-col gap-1.5">
      {message.trace.length > 0 && (
        <div className="ml-10">
          <AgentTrace trace={message.trace} active={isActive && isStreaming} />
        </div>
      )}
      <MessageRow from="assistant" content={content} createdAt={message.createdAt} />
      {!isStreaming && (
        <div className="ml-10">
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
