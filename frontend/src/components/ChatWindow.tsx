"use client";

import { useEffect, useRef } from "react";
import { AgentTrace } from "@/components/AgentTrace";
import { MessageActions } from "@/components/MessageActions";
import { MessageBubble } from "@/components/MessageBubble";
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: messages.length が増えたときだけ末尾へスクロールしたい
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const isEmpty = messages.length === 0;

  return (
    <ScrollArea className="flex-1 w-full rounded-md border bg-card">
      <div className="flex flex-col gap-3 p-4 min-h-[280px]">
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
            <MessageBubble key={m.id} from="user" content={m.content} />
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
  return (
    <div className="flex flex-col gap-1.5 self-start max-w-[85%]">
      {message.trace.length > 0 && (
        <AgentTrace trace={message.trace} active={isActive && message.status === "streaming"} />
      )}
      {message.status === "streaming" && !message.content ? (
        <MessageBubble from="assistant">
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            考え中
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" />
          </span>
        </MessageBubble>
      ) : message.status === "error" ? (
        <MessageBubble from="assistant">
          <span className="text-destructive">エラー: {message.error ?? "unknown"}</span>
        </MessageBubble>
      ) : (
        <MessageBubble from="assistant" content={message.content} />
      )}
      {message.status !== "streaming" && (
        <MessageActions content={message.content} onRegenerate={onRegenerate} disabled={isActive} />
      )}
    </div>
  );
}
