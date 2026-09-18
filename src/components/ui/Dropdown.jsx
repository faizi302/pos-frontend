import { useEffect, useRef, useState } from "react";

export default function Dropdown({ trigger, children, align = "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {trigger}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-40 mt-2 min-w-[180px] rounded-xl border border-primary
            bg-card p-1.5 shadow-lg animate-fade-up ${
              align === "right" ? "right-0" : "left-0"
            }`}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ icon: Icon, children, danger = false, ...props }) {
  return (
    <button
      role="menuitem"
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm
        hover:bg-muted-action ${danger ? "text-red-600" : "text-primary"}`}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}
