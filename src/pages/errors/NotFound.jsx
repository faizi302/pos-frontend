import { Compass } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center animate-fade-up">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted-action text-secondary">
        <Compass className="h-7 w-7" />
      </div>
      <h1 className="text-lg font-semibold text-primary">404 — Page not found</h1>
      <p className="max-w-sm text-sm text-secondary">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link to="/dashboard">
        <Button variant="outline">Back to Dashboard</Button>
      </Link>
    </div>
  );
}
