import { Sparkles, User } from "lucide-react";
import { MessageBubble } from "@/components/MessageBubble";
import { formatHm } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  from: "user" | "assistant";
  createdAt?: number;
  content?: React.ReactNode;
};

export function MessageRow({ from, createdAt, content }: Props) {
  const isUser = from === "user";
  return (
    <div
      data-testid="message-row"
      data-from={from}
      className={cn("flex w-full items-start gap-3", isUser && "flex-row-reverse")}
    >
      <Avatar from={from} />
      <div
        className={cn(
          "flex max-w-[min(85%,48rem)] flex-col gap-1.5",
          isUser ? "items-end" : "items-start",
        )}
      >
        {typeof content === "string" ? (
          <MessageBubble from={from} content={content} />
        ) : (
          <MessageBubble from={from}>{content}</MessageBubble>
        )}
        {createdAt !== undefined && createdAt > 0 && (
          <time
            data-testid="message-time"
            dateTime={new Date(createdAt).toISOString()}
            className="px-1.5 font-medium font-mono text-[10.5px] text-muted-foreground/70 tabular-nums tracking-tight"
          >
            {formatHm(createdAt)}
          </time>
        )}
      </div>
    </div>
  );
}

function Avatar({ from }: { from: "user" | "assistant" }) {
  const isUser = from === "user";
  const Icon = isUser ? User : Sparkles;
  return (
    <div className="relative shrink-0">
      {!isUser && (
        <span
          aria-hidden="true"
          className="halo absolute inset-0 rounded-xl bg-accent-brand/25 blur-md"
        />
      )}
      <div
        data-testid={`avatar-${from}`}
        aria-hidden="true"
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-xl shadow-[var(--shadow-elev-1)] ring-1 ring-inset",
          isUser
            ? "bg-[linear-gradient(135deg,var(--accent-grad-from),var(--accent-grad-to))] text-accent-brand-foreground ring-white/10"
            : "bg-surface-1 text-accent-brand ring-hairline-strong",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}
