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

type NodeTheme = {
  icon: string;
  iconActive: string;
  bg: string;
  border: string;
  ring: string;
  dot: string;
};

const NODE_THEME: Record<string, NodeTheme> = {
  research: {
    icon: "text-cyan-600/80 dark:text-cyan-400/80",
    iconActive: "text-cyan-600 dark:text-cyan-300",
    bg: "bg-cyan-500/5",
    border: "border-cyan-500/30",
    ring: "shadow-[0_0_0_3px_color-mix(in_oklab,oklch(0.7_0.13_220)_18%,transparent)]",
    dot: "border-cyan-500/60 text-cyan-600 dark:text-cyan-300",
  },
  reflection: {
    icon: "text-accent-brand/80",
    iconActive: "text-accent-brand",
    bg: "bg-accent-brand/5",
    border: "border-accent-brand/30",
    ring: "shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent-brand)_22%,transparent)]",
    dot: "border-accent-brand/60 text-accent-brand",
  },
  answer: {
    icon: "text-emerald-600/80 dark:text-emerald-400/80",
    iconActive: "text-emerald-600 dark:text-emerald-300",
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/30",
    ring: "shadow-[0_0_0_3px_color-mix(in_oklab,oklch(0.7_0.15_150)_18%,transparent)]",
    dot: "border-emerald-500/60 text-emerald-600 dark:text-emerald-300",
  },
};

const DEFAULT_THEME: NodeTheme = {
  icon: "text-muted-foreground",
  iconActive: "text-foreground",
  bg: "bg-background/40",
  border: "border-border/60",
  ring: "",
  dot: "border-border text-muted-foreground",
};

type Props = {
  trace: TraceItem[];
  active?: boolean;
};

export function AgentTrace({ trace, active = false }: Props) {
  if (trace.length === 0) return null;

  return (
    <ol className="relative flex flex-col gap-1.5 pl-5">
      <span
        aria-hidden="true"
        className="absolute top-2 bottom-2 left-[7px] w-px bg-gradient-to-b from-border via-border/70 to-transparent"
      />
      {trace.map((item, idx) => {
        const isLast = idx === trace.length - 1;
        const isActive = isLast && active;
        const NodeIcon = NODE_ICON[item.node];
        const theme = NODE_THEME[item.node] ?? DEFAULT_THEME;
        return (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: trace は SSE 受信順の追記専用リストで並び替えなし
            key={idx}
            data-testid="trace-item"
            data-active={isActive ? "true" : "false"}
            className={cn(
              "relative flex flex-col gap-0.5 rounded-lg border px-3 py-1.5 text-[11px] transition-all",
              theme.border,
              theme.bg,
              isActive && theme.ring,
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "-translate-x-1/2 absolute top-2 left-[-13px] flex h-3.5 w-3.5 items-center justify-center rounded-full border bg-background",
                isActive ? theme.dot : "border-border text-muted-foreground",
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
                  className={cn("h-3 w-3", isActive ? theme.iconActive : theme.icon)}
                />
              )}
              <span
                data-testid="trace-node-label"
                className={cn(
                  "font-medium uppercase tracking-wide",
                  isActive ? theme.iconActive : "text-muted-foreground",
                )}
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
