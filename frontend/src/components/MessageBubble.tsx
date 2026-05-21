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
          ? "self-end rounded-2xl rounded-tr-md bg-[linear-gradient(135deg,var(--accent-grad-from),var(--accent-grad-to))] px-4 py-2.5 text-accent-brand-foreground shadow-[var(--shadow-elev-1)] ring-1 ring-inset ring-white/10 dark:ring-white/5"
          : "self-start rounded-2xl rounded-tl-md bg-surface-2 px-4 py-2.5 text-foreground ring-1 ring-inset ring-hairline backdrop-blur-[2px]",
      )}
    >
      {content !== undefined ? <Markdown source={content} /> : children}
    </div>
  );
}
