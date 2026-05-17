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
        "max-w-full text-sm leading-relaxed",
        from === "user"
          ? "self-end rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-primary-foreground shadow-sm"
          : "self-start rounded-2xl rounded-tl-md border border-border/60 bg-muted/70 px-4 py-3 text-foreground",
      )}
    >
      {content !== undefined ? <Markdown source={content} /> : children}
    </div>
  );
}
