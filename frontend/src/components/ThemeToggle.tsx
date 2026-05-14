"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const ORDER = ["light", "dark", "system"] as const;
type Mode = (typeof ORDER)[number];

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const cycle = () => {
    const current = (theme as Mode) ?? "system";
    const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
    setTheme(next);
  };

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="toggle theme"
        className="opacity-0"
      >
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const icon =
    theme === "system" ? (
      <Monitor className="h-4 w-4" />
    ) : (resolvedTheme ?? theme) === "dark" ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Sun className="h-4 w-4" />
    );

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`toggle theme (current: ${theme ?? "system"})`}
      title={`Theme: ${theme ?? "system"}`}
      onClick={cycle}
    >
      {icon}
    </Button>
  );
}
