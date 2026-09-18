function initialsOf(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function Avatar({ src, name, size = "md", className = "" }) {
  const sizes = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-14 w-14 text-lg" };

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Avatar"}
        loading="lazy"
        className={`${sizes[size]} rounded-full object-cover ${className}`}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} flex items-center justify-center rounded-full bg-brand/15 font-semibold text-[var(--action-primary)] ${className}`}
    >
      {initialsOf(name) || "?"}
    </div>
  );
}
