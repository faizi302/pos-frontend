const tones = {
  neutral: "bg-muted-action text-primary",
  success: "bg-green-500/15 text-green-600 dark:text-green-400",
  danger: "bg-red-500/15 text-red-600 dark:text-red-400",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  info: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  brand: "bg-[var(--action-primary)]/15 text-[var(--action-primary)]",
};

export default function Badge({ children, tone = "neutral", className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
