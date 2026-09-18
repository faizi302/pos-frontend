import { Loader2 } from "lucide-react";

const variants = {
  primary:
    "bg-brand text-white hover:bg-brand-hover disabled:opacity-60",
  secondary:
    "bg-muted-action text-primary hover:bg-muted-action-hover disabled:opacity-60",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:opacity-60",
  ghost:
    "bg-transparent text-primary hover:bg-muted-action disabled:opacity-50",
  outline:
    "bg-transparent border border-primary text-primary hover:bg-muted-action disabled:opacity-50",
};

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon: Icon,
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium
        transition-colors duration-150 focus:outline-none focus-visible:ring-2
        focus-visible:ring-offset-2 focus-visible:ring-[var(--action-primary)]
        disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        Icon && <Icon className="h-4 w-4" />
      )}
      {children}
    </button>
  );
}
