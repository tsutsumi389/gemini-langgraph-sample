"use client";

import { PanelLeft } from "lucide-react";
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
    <div className="flex h-dvh w-full bg-background">
      <aside className="hidden h-full w-64 shrink-0 md:flex">{sidebar}</aside>

      <main className="flex h-full min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b bg-background px-4 py-2.5">
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

          <div className="flex min-w-0 flex-col">
            <h1 className="truncate text-sm font-semibold">{title}</h1>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">{children}</div>
      </main>
    </div>
  );
}
