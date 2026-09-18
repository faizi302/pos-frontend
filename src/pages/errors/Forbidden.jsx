import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";

export default function Forbidden() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center animate-fade-up">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-600">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h1 className="text-lg font-semibold text-primary">403 — Access denied</h1>
      <p className="max-w-sm text-sm text-secondary">
        You don't have permission to view this page. Contact your administrator if you
        think this is a mistake.
      </p>
      <Link to="/dashboard">
        <Button variant="outline">Back to Dashboard</Button>
      </Link>
    </div>
  );
}
