import { Markdown } from "@/components/Markdown";
import { cn } from "@/lib/utils";

type Props = {
  from: "user" | "assistant";
  children?: React.ReactNode;
  content?: string;
};

export function MessageBubble({ from, children, content }: Props) {
  return (
    <div
      data-testid="message-bubble"
      data-from={from}
      className={cn(
        "rounded-lg px-4 py-3 max-w-[85%] text-sm",
        from === "user"
          ? "self-end bg-primary text-primary-foreground"
          : "self-start bg-muted text-foreground",
      )}
    >
      {content !== undefined ? <Markdown source={content} /> : children}
    </div>
  );
}
