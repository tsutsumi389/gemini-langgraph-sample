"use client";

import { Check, Copy } from "lucide-react";
import { type ReactNode, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type Props = {
  source: string;
  className?: string;
};

function CodeBlock({ className, children }: { className?: string; children: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const text = String(children).replace(/\n$/, "");
  const language = className?.match(/language-([\w-]+)/)?.[1];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore clipboard errors silently
    }
  };

  return (
    <div className="group relative my-2 overflow-hidden rounded-md border bg-muted/40">
      <div className="flex items-center justify-between border-b bg-muted/60 px-3 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">
        <span>{language ?? "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] hover:bg-foreground/10"
          aria-label="copy code"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

const components: Components = {
  code({ className, children, node, ...props }) {
    const isBlock =
      node?.tagName === "code" && node?.position?.start.line !== node?.position?.end.line;
    if (isBlock || (className?.includes("language-") ?? false)) {
      return <CodeBlock className={className}>{children}</CodeBlock>;
    }
    return (
      <code
        className={cn("rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]", className)}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre({ children }) {
    // CodeBlock が pre を内包するので、ここでは透過レンダリング
    return <>{children}</>;
  },
  a({ children, href, ...props }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="text-primary underline underline-offset-2"
        {...props}
      >
        {children}
      </a>
    );
  },
  ul({ children }) {
    return <ul className="my-2 list-disc pl-5 space-y-1">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="my-2 list-decimal pl-5 space-y-1">{children}</ol>;
  },
  h1({ children }) {
    return <h1 className="mt-3 mb-2 text-lg font-semibold">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="mt-3 mb-2 text-base font-semibold">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="mt-2 mb-1 text-sm font-semibold">{children}</h3>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="my-2 border-l-2 border-muted-foreground/30 pl-3 text-muted-foreground">
        {children}
      </blockquote>
    );
  },
  table({ children }) {
    return (
      <div className="my-2 overflow-x-auto">
        <table className="w-full border-collapse text-xs">{children}</table>
      </div>
    );
  },
  th({ children }) {
    return <th className="border px-2 py-1 text-left font-medium">{children}</th>;
  },
  td({ children }) {
    return <td className="border px-2 py-1 align-top">{children}</td>;
  },
};

export function Markdown({ source, className }: Props) {
  return (
    <div className={cn("prose-sm break-words", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={components}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
