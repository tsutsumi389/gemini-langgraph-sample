import { Bot, User } from "lucide-react";
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
      className={cn("flex w-full items-start gap-2.5", isUser && "flex-row-reverse")}
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
            className="px-1 font-mono text-[11px] text-muted-foreground tabular-nums"
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
  const Icon = isUser ? User : Bot;
  return (
    <div
      data-testid={`avatar-${from}`}
      aria-hidden="true"
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm",
        isUser
          ? "border-primary/40 bg-primary text-primary-foreground"
          : "border-border bg-gradient-to-br from-muted to-card text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}
