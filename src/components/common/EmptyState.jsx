import { Inbox } from "lucide-react";
import Button from "@/components/ui/Button";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "Nothing here yet",
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-primary py-14 text-center animate-fade-up">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted-action text-secondary">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="font-medium text-primary">{title}</p>
        {description && <p className="mt-1 text-sm text-secondary">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
