import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StreamStatus, TraceItem } from "@/types/agent";

const NODE_LABEL: Record<string, string> = {
  research: "Research",
  reflection: "Reflection",
  answer: "Answer",
};

type Props = {
  trace: TraceItem[];
  status: StreamStatus;
};

export function AgentTrace({ trace, status }: Props) {
  if (trace.length === 0) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Agent trace
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-2">
          {trace.map((item, idx) => {
            const isLast = idx === trace.length - 1;
            const active = isLast && status === "streaming";
            return (
              <li
                key={idx}
                data-testid="trace-item"
                data-active={active ? "true" : "false"}
                className={cn(
                  "flex flex-col gap-1 rounded-md border px-3 py-2 text-xs",
                  active && "border-primary bg-primary/5",
                )}
              >
                <span
                  data-testid="trace-node-label"
                  className="font-medium uppercase tracking-wide"
                >
                  {NODE_LABEL[item.node] ?? item.node}
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
      </CardContent>
    </Card>
  );
}
