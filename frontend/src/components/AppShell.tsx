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
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_-12%,color-mix(in_oklab,var(--accent-brand)_9%,transparent),transparent_65%)] dark:bg-[radial-gradient(80%_60%_at_50%_-12%,color-mix(in_oklab,var(--accent-brand)_16%,transparent),transparent_68%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_40%_at_10%_110%,color-mix(in_oklab,var(--accent-brand)_5%,transparent),transparent_70%)] dark:bg-[radial-gradient(45%_40%_at_10%_110%,color-mix(in_oklab,var(--accent-brand)_10%,transparent),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-fine opacity-60 [mask-image:radial-gradient(70%_55%_at_50%_30%,black,transparent_75%)] dark:opacity-40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-noise opacity-[0.35] mix-blend-overlay dark:opacity-[0.5]"
      />
      <aside className="hidden h-full w-64 shrink-0 md:flex">{sidebar}</aside>

      <main className="relative flex h-full min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-hairline-strong bg-surface-1 px-4 py-3.5 backdrop-blur-xl md:px-6">
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

          <div className="relative hidden shrink-0 md:block">
            <span
              aria-hidden="true"
              className="halo absolute inset-0 rounded-xl bg-accent-brand/30 blur-md"
            />
            <div
              aria-hidden="true"
              className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--accent-grad-from),var(--accent-grad-to))] text-accent-brand-foreground shadow-[var(--shadow-elev-1)] ring-1 ring-inset ring-white/15"
            >
              <Sparkles className="h-4 w-4" />
            </div>
          </div>

          <div className="flex min-w-0 flex-col leading-tight">
            <h1 className="truncate font-heading text-[13px] font-semibold tracking-[-0.01em]">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-[11px] text-muted-foreground/80 tracking-tight">
                {subtitle}
              </p>
            )}
          </div>
        </header>

        <div className="relative flex min-h-0 flex-1 flex-col gap-3 px-4 pt-4 pb-3 md:px-6 md:pt-5 md:pb-4">
          {children}
        </div>
      </main>
    </div>
  );
}
