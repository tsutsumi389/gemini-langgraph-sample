"use client";

import { ArrowDown } from "lucide-react";
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
      <ScrollArea className="h-full w-full rounded-md border bg-card">
        <div className="flex min-h-[280px] flex-col gap-4 p-4">
          {isEmpty && (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-sm text-muted-foreground">
                質問を入力してエージェントに問い合わせてください。
              </p>
              <ul className="flex flex-wrap justify-center gap-2">
                {SAMPLE_QUESTIONS.map((q) => (
                  <li key={q}>
                    <button
                      type="button"
                      onClick={() => onSampleClick(q)}
                      className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
                    >
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <MessageRow key={m.id} from="user" content={m.content} createdAt={m.createdAt} />
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
          className="absolute bottom-4 right-4 h-9 w-9 rounded-full border shadow-md"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
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
    <div className="flex flex-col gap-1.5">
      {message.trace.length > 0 && (
        <div className="ml-9">
          <AgentTrace trace={message.trace} active={isActive && isStreaming} />
        </div>
      )}
      <MessageRow from="assistant" content={content} createdAt={message.createdAt} />
      {!isStreaming && (
        <div className="ml-9">
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
