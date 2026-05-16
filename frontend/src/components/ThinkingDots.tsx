export function ThinkingDots() {
  return (
    <span
      role="status"
      aria-label="thinking"
      className="inline-flex items-center gap-1.5 text-muted-foreground"
    >
      <span>考え中</span>
      <span className="inline-flex items-end gap-0.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            style={{ animationDelay: `${delay}ms` }}
            className="thinking-dot inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground"
          />
        ))}
      </span>
    </span>
  );
}
