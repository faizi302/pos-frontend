import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const PasswordInput = forwardRef(function PasswordInput(
  { label, error, hint, className = "", id, ...props },
  ref
) {
  const [visible, setVisible] = useState(false);
  const inputId = id || props.name;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-primary">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={inputId}
          ref={ref}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          className={`h-10 w-full rounded-lg border bg-card px-3 pr-10 text-sm text-primary
            placeholder:text-secondary outline-none transition-colors
            focus:border-[var(--action-primary)] focus:ring-1 focus:ring-[var(--action-primary)]
            ${error ? "border-red-500" : "border-primary"} ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {hint && !error && <span className="text-xs text-secondary">{hint}</span>}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
});

export default PasswordInput;
