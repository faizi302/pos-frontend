import { Outlet } from "react-router-dom";
import { LayoutGrid, ShieldCheck, Building2, BarChart3 } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-surface">
      {/* Branding panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[var(--action-primary)] p-10 text-white lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">POS SaaS</span>
        </div>

        <div className="animate-fade-up">
          <h1 className="text-3xl font-semibold leading-tight">
            Run every business,
            <br /> from one platform.
          </h1>
          <p className="mt-3 max-w-md text-white/80">
            Multi-business point of sale, inventory and team management — built for
            businesses that operate at scale.
          </p>

          <div className="mt-8 flex flex-col gap-3 text-sm text-white/90">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Manage multiple businesses & types
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Role & permission based access
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Real-time operational insight
            </div>
          </div>
        </div>

        <p className="text-xs text-white/60">© {new Date().getFullYear()} POS SaaS. All rights reserved.</p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-10 lg:w-1/2">
        <div className="w-full max-w-md animate-fade-up">
          <Outlet />
        </div>
      </div>
    </div>
  );
}