import { AlertCircle, RotateCw } from "lucide-react";
import Button from "@/components/ui/Button";

export default function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this data.",
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-primary py-14 text-center animate-fade-up">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-600">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div>
        <p className="font-medium text-primary">{title}</p>
        <p className="mt-1 text-sm text-secondary">{description}</p>
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" icon={RotateCw} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
