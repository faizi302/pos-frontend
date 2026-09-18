export default function Card({ children, className = "", animate = true, ...props }) {
  return (
    <div
      className={`rounded-xl border border-primary bg-card shadow-sm ${
        animate ? "animate-fade-up" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
