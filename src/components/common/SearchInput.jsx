import { Search } from "lucide-react";

export default function SearchInput({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative w-full sm:w-64">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-lg border border-primary bg-card pl-9 pr-3 text-sm text-primary
          placeholder:text-secondary outline-none focus:border-[var(--action-primary)]
          focus:ring-1 focus:ring-[var(--action-primary)]"
      />
    </div>
  );
}
