"use client";

import { Bot, MessageSquarePlus, Trash2 } from "lucide-react";
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
      className="flex h-full w-full flex-col gap-3 border-r border-border/60 bg-card p-3"
    >
      <div className="flex items-center gap-2 px-1 pt-1">
        <div
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary"
        >
          <Bot className="h-4 w-4" />
        </div>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-[13px] font-semibold tracking-tight">Gemini Agent</span>
          <span className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
            Conversations
          </span>
        </div>
      </div>

      <Button
        type="button"
        onClick={onCreate}
        className="w-full justify-start gap-2 rounded-lg shadow-sm"
      >
        <MessageSquarePlus className="h-4 w-4" />
        New chat
      </Button>

      <ScrollArea className="-mx-1 flex-1">
        <ul className="flex flex-col gap-1 px-1">
          {conversations.map((c) => {
            const isActive = c.id === activeConversationId;
            return (
              <li key={c.id}>
                <div
                  data-testid="conversation-item"
                  data-active={isActive ? "true" : "false"}
                  className={cn(
                    "group flex items-center gap-1 rounded-md border px-2 py-1.5 text-sm transition-colors",
                    isActive
                      ? "border-primary/30 bg-accent text-accent-foreground shadow-sm"
                      : "border-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    aria-current={isActive ? "true" : undefined}
                    className="flex flex-1 items-center gap-2 truncate text-left"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full transition-shadow",
                        c.status === "streaming"
                          ? "animate-pulse bg-primary"
                          : c.status === "error"
                            ? "bg-destructive"
                            : "bg-muted-foreground/40",
                        isActive && c.status === "streaming" && "ring-2 ring-primary/30",
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
                    className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </ScrollArea>

      <div className="flex items-center justify-end border-t border-border/60 pt-3">
        <ThemeToggle />
      </div>
    </aside>
  );
}
