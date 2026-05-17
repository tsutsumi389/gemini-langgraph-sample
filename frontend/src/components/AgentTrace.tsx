import { Brain, Check, Loader2, type LucideIcon, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TraceItem } from "@/types/agent";

const NODE_LABEL: Record<string, string> = {
  research: "Research",
  reflection: "Reflection",
  answer: "Answer",
};

const NODE_ICON: Record<string, LucideIcon> = {
  research: Search,
  reflection: Brain,
  answer: Sparkles,
};

type Props = {
  trace: TraceItem[];
  active?: boolean;
};

export function AgentTrace({ trace, active = false }: Props) {
  if (trace.length === 0) return null;

  return (
    <ol className="relative flex flex-col gap-1.5 pl-5">
      <span aria-hidden="true" className="absolute top-2 bottom-2 left-[7px] w-px bg-border" />
      {trace.map((item, idx) => {
        const isLast = idx === trace.length - 1;
        const isActive = isLast && active;
        const NodeIcon = NODE_ICON[item.node];
        return (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: trace は SSE 受信順の追記専用リストで並び替えなし
            key={idx}
            data-testid="trace-item"
            data-active={isActive ? "true" : "false"}
            className={cn(
              "relative flex flex-col gap-0.5 rounded-md border px-3 py-1.5 text-[11px] transition-colors",
              isActive
                ? "border-primary/40 bg-primary/5 shadow-sm"
                : "border-border/60 bg-background/40",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "-translate-x-1/2 absolute top-2 left-[-13px] flex h-3.5 w-3.5 items-center justify-center rounded-full border bg-background",
                isActive ? "border-primary text-primary" : "border-border text-muted-foreground",
              )}
            >
              {isActive ? (
                <Loader2 data-testid="trace-status-active" className="h-2.5 w-2.5 animate-spin" />
              ) : (
                <Check data-testid="trace-status-done" className="h-2.5 w-2.5" />
              )}
            </span>
            <span className="flex items-center gap-1.5">
              {NodeIcon && (
                <NodeIcon
                  aria-hidden="true"
                  className={cn("h-3 w-3", isActive ? "text-primary" : "text-muted-foreground")}
                />
              )}
              <span
                data-testid="trace-node-label"
                className="font-medium uppercase tracking-wide text-muted-foreground"
              >
                {NODE_LABEL[item.node] ?? item.node}
              </span>
            </span>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5 text-muted-foreground">
              {Object.entries(item.update).map(([k, v]) => (
                <span key={k} className="contents">
                  <dt>{k}</dt>
                  <dd className="truncate" title={String(v)}>
                    {String(v)}
                  </dd>
                </span>
              ))}
            </dl>
          </li>
        );
      })}
    </ol>
  );
}
