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
      className={cn("flex w-full items-start gap-2", isUser && "flex-row-reverse")}
    >
      <Avatar from={from} />
      <div className={cn("flex max-w-[85%] flex-col gap-1", isUser ? "items-end" : "items-start")}>
        {typeof content === "string" ? (
          <MessageBubble from={from} content={content} />
        ) : (
          <MessageBubble from={from}>{content}</MessageBubble>
        )}
        {createdAt !== undefined && createdAt > 0 && (
          <time
            data-testid="message-time"
            dateTime={new Date(createdAt).toISOString()}
            className="px-1 text-[10px] text-muted-foreground"
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
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
        isUser
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </div>
  );
}
