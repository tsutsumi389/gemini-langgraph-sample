"use client";

import { PanelLeft, Sparkles } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type Props = {
  sidebar: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AppShell({ sidebar, title, subtitle, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex h-dvh w-full bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_-10%,color-mix(in_oklab,var(--accent-brand)_10%,transparent),transparent_70%)] dark:bg-[radial-gradient(70%_55%_at_50%_-10%,color-mix(in_oklab,var(--accent-brand)_18%,transparent),transparent_72%)]"
      />
      <aside className="hidden h-full w-64 shrink-0 md:flex">{sidebar}</aside>

      <main className="relative flex h-full min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-border/60 bg-background/75 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/55 md:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="open sidebar"
                  className="md:hidden"
                />
              }
            >
              <PanelLeft className="h-4 w-4" />
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 max-w-[80vw] border-r p-0"
              showCloseButton={false}
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Conversations</SheetTitle>
                <SheetDescription>会話一覧</SheetDescription>
              </SheetHeader>
              <div
                className="h-full"
                onClickCapture={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest("[data-testid='conversation-item'] button")) {
                    setOpen(false);
                  }
                }}
              >
                {sidebar}
              </div>
            </SheetContent>
          </Sheet>

          <div
            aria-hidden="true"
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-accent-brand/30 bg-gradient-to-br from-accent-brand to-accent-brand/70 text-accent-brand-foreground shadow-sm shadow-accent-brand/20 md:flex"
          >
            <Sparkles className="h-4 w-4" />
          </div>

          <div className="flex min-w-0 flex-col leading-tight">
            <h1 className="truncate font-heading text-sm font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1 flex-col gap-3 px-4 pt-4 pb-3 md:px-6 md:pt-5 md:pb-4">
          {children}
        </div>
      </main>
    </div>
  );
}
