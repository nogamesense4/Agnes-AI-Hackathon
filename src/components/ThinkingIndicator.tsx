interface ThinkingIndicatorProps {
  label?: string;
  compact?: boolean;
  inverse?: boolean;
}

export function ThinkingIndicator({
  label = "Thinking",
  compact = false,
  inverse = false,
}: ThinkingIndicatorProps) {
  const dotClass = inverse ? "bg-white" : "bg-accent";
  const labelClass = inverse ? "text-white/90" : "text-muted";

  return (
    <div
      className={`flex items-center ${compact ? "gap-2" : "gap-3"}`}
      role="status"
      aria-live="polite"
      aria-label={label || "Thinking"}
    >
      <span className="flex items-center gap-1" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={`thinking-dot rounded-full ${dotClass}`}
            style={{
              animationDelay: `${index * 0.16}s`,
              width: compact ? "6px" : "8px",
              height: compact ? "6px" : "8px",
            }}
          />
        ))}
      </span>
      {label ? (
        <span
          className={`${compact ? "text-xs" : "text-sm"} font-medium ${labelClass}`}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
