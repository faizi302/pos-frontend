import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

const Select = forwardRef(function Select(
  { label, error, hint, options = [], placeholder = "Select...", className = "", id, ...props },
  ref
) {
  const selectId = id || props.name;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-primary">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          ref={ref}
          aria-invalid={Boolean(error)}
          className={`h-10 w-full appearance-none rounded-lg border bg-card px-3 pr-9 text-sm text-primary
            outline-none transition-colors focus:border-[var(--action-primary)]
            focus:ring-1 focus:ring-[var(--action-primary)]
            ${error ? "border-red-500" : "border-primary"} ${className}`}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
      </div>

      {hint && !error && <span className="text-xs text-secondary">{hint}</span>}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
});

export default Select;
