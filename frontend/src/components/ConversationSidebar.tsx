"use client";

import { MessageSquarePlus, Sparkles, Trash2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types/agent";

type Props = {
  conversations: Conversation[];
  activeConversationId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
};

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

  return (
    <aside
      data-testid="conversation-sidebar"
      className="flex h-full w-full flex-col gap-3 border-r border-border/60 bg-sidebar/95 p-3 backdrop-blur"
    >
      <div className="flex items-center gap-2.5 px-1 pt-1">
        <div
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-accent-brand/30 bg-gradient-to-br from-accent-brand to-accent-brand/65 text-accent-brand-foreground shadow-sm shadow-accent-brand/25"
        >
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate font-heading text-[13px] font-semibold tracking-tight">
            Gemini Agent
          </span>
          <span className="truncate text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Conversations
          </span>
        </div>
      </div>

      <Button
        type="button"
        onClick={onCreate}
        className="w-full justify-start gap-2 rounded-xl bg-accent-brand text-accent-brand-foreground shadow-sm shadow-accent-brand/20 transition-colors hover:bg-accent-brand/90"
      >
        <MessageSquarePlus className="h-4 w-4" />
        New chat
      </Button>

      <ScrollArea className="-mx-1 flex-1">
        <ul className="flex flex-col gap-0.5 px-1">
          {conversations.map((c) => {
            const isActive = c.id === activeConversationId;
            return (
              <li key={c.id}>
                <div
                  data-testid="conversation-item"
                  data-active={isActive ? "true" : "false"}
                  className={cn(
                    "group relative flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/55 hover:text-foreground",
                  )}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-accent-brand shadow-[0_0_8px] shadow-accent-brand/50"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    aria-current={isActive ? "true" : undefined}
                    className="flex flex-1 items-center gap-2 truncate pl-1.5 text-left"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full transition-shadow",
                        c.status === "streaming"
                          ? "animate-pulse bg-accent-brand ring-2 ring-accent-brand/30"
                          : c.status === "error"
                            ? "bg-destructive"
                            : isActive
                              ? "bg-accent-brand/60"
                              : "bg-muted-foreground/40",
                      )}
                    />
                    <span className="truncate" title={c.title}>
                      {c.title}
                    </span>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`delete ${c.title}`}
                    onClick={() => handleDelete(c.id, c.title)}
                    className="h-6 w-6 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </ScrollArea>

      <div className="flex items-center justify-between border-t border-border/60 pt-3">
        <span className="px-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          Theme
        </span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
