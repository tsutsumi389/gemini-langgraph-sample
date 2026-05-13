import { cn } from "@/lib/utils";

type Props = {
  from: "user" | "assistant";
  children: React.ReactNode;
};

export function MessageBubble({ from, children }: Props) {
  return (
    <div
      className={cn(
        "rounded-lg px-4 py-3 max-w-[85%] whitespace-pre-wrap text-sm",
        from === "user"
          ? "self-end bg-primary text-primary-foreground"
          : "self-start bg-muted text-foreground",
      )}
    >
      {children}
    </div>
  );
}
