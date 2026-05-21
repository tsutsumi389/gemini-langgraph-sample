"use client";

import { AlertCircle, MessageSquarePlus, Sparkles, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Conversation, StreamStatus } from "@/types/agent";

type Props = {
  conversations: Conversation[];
  activeConversationId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
};

type Bucket = "today" | "yesterday" | "earlier";

const BUCKET_LABELS: Record<Bucket, string> = {
  today: "Today",
  yesterday: "Yesterday",
  earlier: "Earlier",
};
const BUCKET_ORDER: ReadonlyArray<Bucket> = ["today", "yesterday", "earlier"];
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function bucketize(createdAt: number, now: number): Bucket {
  const today = startOfDay(now);
  if (createdAt >= today) return "today";
  if (createdAt >= today - DAY_MS) return "yesterday";
  return "earlier";
}

function formatRelative(createdAt: number, now: number): string {
  const diffMs = Math.max(0, now - createdAt);
  if (diffMs < 60_000) return "just now";
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function StatusIndicator({ status, isActive }: { status: StreamStatus; isActive: boolean }) {
  if (status === "error") {
    return <AlertCircle aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-destructive" />;
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "h-2.5 w-2.5 shrink-0 rounded-full transition-shadow",
        status === "streaming"
          ? "animate-pulse bg-accent-brand ring-2 ring-accent-brand/25"
          : isActive
            ? "bg-accent-brand/60"
            : "bg-muted-foreground/40",
      )}
    />
  );
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelect,
  onCreate,
  onDelete,
}: Props) {
  const handleDelete = (id: string, title: string) => {
    if (typeof window !== "undefined" && !window.confirm(`「${title}」を削除しますか？`)) return;
    onDelete(id);
  };

  const { buckets, now } = useMemo(() => {
    const nowTs = Date.now();
    const result: Record<Bucket, Conversation[]> = { today: [], yesterday: [], earlier: [] };
    const indexed = conversations.map((c, i) => ({ c, i }));
    indexed.sort((a, b) => {
      if (b.c.createdAt !== a.c.createdAt) return b.c.createdAt - a.c.createdAt;
      return a.i - b.i;
    });
    for (const { c } of indexed) {
      result[bucketize(c.createdAt, nowTs)].push(c);
    }
    return { buckets: result, now: nowTs };
  }, [conversations]);

  const isEmpty = conversations.length === 0;

  return (
    <aside
      data-testid="conversation-sidebar"
      className="relative flex h-full w-full flex-col gap-3 border-r border-hairline bg-sidebar/80 p-3 backdrop-blur-xl"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(70%_80%_at_30%_0%,var(--accent-brand-haze),transparent_70%)]"
      />
      <div className="relative flex items-center gap-2.5 px-1 pt-1 pb-1">
        <div className="relative">
          <span
            aria-hidden="true"
            className="halo absolute inset-0 rounded-xl bg-accent-brand/30 blur-md"
          />
          <div
            aria-hidden="true"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--accent-grad-from),var(--accent-grad-to))] text-accent-brand-foreground shadow-[var(--shadow-elev-1)] ring-1 ring-inset ring-white/15"
          >
            <Sparkles className="h-4 w-4" />
          </div>
        </div>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate font-heading font-semibold text-[13.5px] tracking-[-0.01em]">
            Gemini Agent
          </span>
          <span className="truncate text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground/70">
            Conversations
          </span>
        </div>
      </div>

      <Button
        type="button"
        onClick={onCreate}
        className="relative w-full justify-start gap-2 rounded-xl bg-[linear-gradient(135deg,var(--accent-grad-from),var(--accent-grad-to))] text-accent-brand-foreground shadow-[0_1px_0_oklch(1_0_0/0.15)_inset,0_4px_12px_-4px_var(--accent-brand)] transition-all hover:brightness-110 hover:shadow-[0_1px_0_oklch(1_0_0/0.15)_inset,0_6px_18px_-4px_var(--accent-brand)] active:translate-y-px"
      >
        <MessageSquarePlus className="h-4 w-4" />
        New chat
      </Button>

      <ScrollArea className="-mx-1 flex-1">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-10 text-center">
            <div
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-muted/40 text-muted-foreground/50"
            >
              <MessageSquarePlus className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium text-muted-foreground">会話はまだありません</p>
            <p className="text-[11px] text-muted-foreground/70">上の New chat から始めましょう</p>
          </div>
        ) : (
          <div className="flex flex-col px-1">
            {BUCKET_ORDER.map((bucket) => {
              const items = buckets[bucket];
              if (items.length === 0) return null;
              return (
                <section key={bucket} className="flex flex-col">
                  <h2 className="px-2.5 pt-3 pb-1 font-semibold text-[9.5px] uppercase tracking-[0.20em] text-muted-foreground/60">
                    <span className="inline-flex w-full items-center gap-2">
                      {BUCKET_LABELS[bucket]}
                      <span aria-hidden="true" className="h-px flex-1 bg-hairline" />
                    </span>
                  </h2>
                  <ul className="flex flex-col gap-0.5">
                    {items.map((c) => {
                      const isActive = c.id === activeConversationId;
                      const msgCount = c.messages.length;
                      const meta =
                        formatRelative(c.createdAt, now) +
                        (msgCount > 0 ? ` · ${msgCount} msg${msgCount === 1 ? "" : "s"}` : "");
                      return (
                        <li key={c.id} className="message-enter">
                          <div
                            data-testid="conversation-item"
                            data-active={isActive ? "true" : "false"}
                            className={cn(
                              "group relative flex items-center gap-1 rounded-lg px-2.5 py-2.5 text-sm transition-colors duration-150",
                              isActive
                                ? "bg-[linear-gradient(90deg,var(--accent-brand-soft),transparent_85%)] text-foreground shadow-[inset_0_0_0_1px_var(--accent-brand-haze)]"
                                : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                            )}
                          >
                            {isActive && (
                              <span
                                aria-hidden="true"
                                className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-[linear-gradient(180deg,var(--accent-grad-from),var(--accent-grad-to))] shadow-[0_0_10px_var(--accent-brand),0_0_2px_var(--accent-brand)]"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => onSelect(c.id)}
                              aria-current={isActive ? "true" : undefined}
                              aria-label={c.title}
                              className="flex min-w-0 flex-1 items-center gap-2 pl-1.5 text-left"
                            >
                              <StatusIndicator status={c.status} isActive={isActive} />
                              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                                <span
                                  className={cn(
                                    "truncate text-sm font-medium",
                                    isActive ? "text-accent-foreground" : "text-foreground/90",
                                  )}
                                  title={c.title}
                                >
                                  {c.title}
                                </span>
                                <span
                                  aria-hidden="true"
                                  className="truncate text-[10px] text-muted-foreground/80"
                                >
                                  {meta}
                                </span>
                              </span>
                            </button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`delete ${c.title}`}
                              onClick={() => handleDelete(c.id, c.title)}
                              className="h-7 w-7 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-60"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <div className="relative flex items-center justify-between pt-3">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--hairline-strong)_20%,var(--hairline-strong)_80%,transparent)]"
        />
        <span className="px-1 font-semibold text-[9.5px] uppercase tracking-[0.20em] text-muted-foreground/70">
          Theme
        </span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
