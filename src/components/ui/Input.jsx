import { forwardRef } from "react";

const Input = forwardRef(function Input(
  { label, error, hint, className = "", id, ...props },
  ref
) {
  const inputId = id || props.name;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-primary">
          {label}
        </label>
      )}

      <input
        id={inputId}
        ref={ref}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`h-10 w-full rounded-lg border bg-card px-3 text-sm text-primary
          placeholder:text-secondary outline-none transition-colors
          focus:border-[var(--action-primary)] focus:ring-1 focus:ring-[var(--action-primary)]
          ${error ? "border-red-500" : "border-primary"} ${className}`}
        {...props}
      />

      {hint && !error && <span className="text-xs text-secondary">{hint}</span>}
      {error && (
        <span id={`${inputId}-error`} className="text-xs text-red-500">
          {error}
        </span>
      )}
    </div>
  );
});

export default Input;
