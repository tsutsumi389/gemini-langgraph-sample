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
          ? "self-end rounded-2xl rounded-tr-md bg-gradient-to-br from-primary to-primary/85 px-4 py-2.5 text-primary-foreground shadow-sm shadow-primary/15"
          : "self-start px-1 py-0.5 text-foreground",
      )}
    >
      {content !== undefined ? <Markdown source={content} /> : children}
    </div>
  );
}
