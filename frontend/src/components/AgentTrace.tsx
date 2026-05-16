import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TraceItem } from "@/types/agent";

const NODE_LABEL: Record<string, string> = {
  research: "Research",
  reflection: "Reflection",
  answer: "Answer",
};

type Props = {
  trace: TraceItem[];
  active?: boolean;
};

export function AgentTrace({ trace, active = false }: Props) {
  if (trace.length === 0) return null;

  return (
    <ol className="flex flex-col gap-1.5">
      {trace.map((item, idx) => {
        const isLast = idx === trace.length - 1;
        const isActive = isLast && active;
        return (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: trace は SSE 受信順の追記専用リストで並び替えなし
            key={idx}
            data-testid="trace-item"
            data-active={isActive ? "true" : "false"}
            className={cn(
              "flex flex-col gap-0.5 rounded-md border px-3 py-1.5 text-[11px]",
              isActive && "border-primary bg-primary/5",
            )}
          >
            <span className="flex items-center gap-1.5">
              {isActive ? (
                <Loader2
                  data-testid="trace-status-active"
                  className="h-3 w-3 animate-spin text-primary"
                  aria-hidden="true"
                />
              ) : (
                <Check
                  data-testid="trace-status-done"
                  className="h-3 w-3 text-primary"
                  aria-hidden="true"
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
