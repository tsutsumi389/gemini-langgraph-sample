"use client";

import { MessageSquarePlus, Trash2 } from "lucide-react";
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
      className="flex h-full w-full flex-col gap-3 border-r bg-card p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Conversations
        </span>
      </div>

      <Button
        type="button"
        variant="secondary"
        onClick={onCreate}
        className="w-full justify-start gap-2"
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
                    "group flex items-center gap-1 rounded-md border border-transparent px-2 py-1.5 text-sm",
                    isActive
                      ? "border-border bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
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
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        c.status === "streaming"
                          ? "animate-pulse bg-primary"
                          : c.status === "error"
                            ? "bg-destructive"
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
                    className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </ScrollArea>

      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-[10px] text-muted-foreground">メモリ保持・揮発</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
