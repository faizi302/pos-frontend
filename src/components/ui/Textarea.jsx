import { forwardRef } from "react";

const Textarea = forwardRef(function Textarea(
  { label, error, hint, className = "", id, rows = 3, ...props },
  ref
) {
  const areaId = id || props.name;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={areaId} className="text-sm font-medium text-primary">
          {label}
        </label>
      )}

      <textarea
        id={areaId}
        ref={ref}
        rows={rows}
        aria-invalid={Boolean(error)}
        className={`w-full resize-none rounded-lg border bg-card px-3 py-2 text-sm text-primary
          placeholder:text-secondary outline-none transition-colors
          focus:border-[var(--action-primary)] focus:ring-1 focus:ring-[var(--action-primary)]
          ${error ? "border-red-500" : "border-primary"} ${className}`}
        {...props}
      />

      {hint && !error && <span className="text-xs text-secondary">{hint}</span>}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
});

export default Textarea;
