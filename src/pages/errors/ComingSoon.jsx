import { useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";

export default function ComingSoon() {
  const { pathname } = useLocation();
  const title = pathname
    .split("/")
    .filter(Boolean)
    .pop()
    ?.split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center animate-fade-up">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/15 text-[var(--action-primary)]">
        <Sparkles className="h-7 w-7" />
      </div>
      <h1 className="text-lg font-semibold text-primary">{title || "This module"} is coming soon</h1>
      <p className="max-w-sm text-sm text-secondary">
        We're building this out. It'll appear here once the backend for it is ready.
      </p>
    </div>
  );
}
