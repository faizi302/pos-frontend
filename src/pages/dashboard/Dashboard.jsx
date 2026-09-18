import { Users, Building2, Layers3, Tags, Boxes, ShieldCheck } from "lucide-react";
import Card from "@/components/ui/Card";
import { CardSkeleton } from "@/components/common/LoadingSkeleton";
import { usePermissions } from "@/hooks/usePermissions";
import { useGetUsersQuery } from "@/features/users/usersApi";
import { useGetBusinessesQuery } from "@/features/businesses/businessesApi";
import { useGetBusinessTypesQuery } from "@/features/businessTypes/businessTypesApi";
import { useGetBrandsQuery } from "@/features/brands/brandsApi";
import { useGetModelsQuery } from "@/features/models/modelsApi";

function MetricCard({ icon: Icon, label, value, loading, tone = "brand" }) {
  const tones = {
    brand: "bg-brand/15 text-[var(--action-primary)]",
    green: "bg-green-500/15 text-green-600",
    blue: "bg-blue-500/15 text-blue-600",
    amber: "bg-amber-500/15 text-amber-600",
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-secondary">{label}</p>
          {loading ? (
            <div className="mt-2 h-7 w-14 animate-pulse rounded bg-muted-action" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-primary">{value}</p>
          )}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { user, can, isSuperAdmin } = usePermissions();

  const { data: users, isLoading: usersLoading } = useGetUsersQuery(undefined, {
    skip: !can("users.read"),
  });
  const { data: businesses, isLoading: businessesLoading } = useGetBusinessesQuery(undefined, {
    skip: !can("businesses.read"),
  });
  const { data: businessTypes, isLoading: typesLoading } = useGetBusinessTypesQuery(undefined, {
    skip: !can("businessTypes.read"),
  });
  const { data: brands, isLoading: brandsLoading } = useGetBrandsQuery(undefined, {
    skip: !can("brands.read"),
  });
  const { data: models, isLoading: modelsLoading } = useGetModelsQuery(undefined, {
    skip: !can("models.read"),
  });

  const activeUsers = users?.filter((u) => u.status === "active").length ?? 0;
  const activeBusinesses = businesses?.filter((b) => b.isActive).length ?? 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div>
      <div className="mb-6 animate-fade-up">
        <h1 className="text-xl font-semibold text-primary">
          {greeting}, {user?.name?.split(" ")[0] || "there"}
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Here's what's happening with your POS platform today.
        </p>
        {!isSuperAdmin && (user?.business?.name || user?.businessType?.name) && (
          <p className="mt-1 text-xs text-secondary">
            Scope: {user?.business?.name}
            {user?.businessType?.name ? ` · ${user.businessType.name}` : ""}
          </p>
        )}
      </div>

      {usersLoading && businessesLoading ? (
        <CardSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {can("users.read") && (
            <>
              <MetricCard icon={Users} label="Total Users" value={users?.length ?? 0} loading={usersLoading} tone="brand" />
              <MetricCard icon={ShieldCheck} label="Active Users" value={activeUsers} loading={usersLoading} tone="green" />
            </>
          )}
          {can("businesses.read") && (
            <>
              <MetricCard icon={Building2} label="Total Businesses" value={businesses?.length ?? 0} loading={businessesLoading} tone="blue" />
              <MetricCard icon={Building2} label="Active Businesses" value={activeBusinesses} loading={businessesLoading} tone="green" />
            </>
          )}
          {can("businessTypes.read") && (
            <MetricCard icon={Layers3} label="Business Types" value={businessTypes?.length ?? 0} loading={typesLoading} tone="amber" />
          )}
          {can("brands.read") && (
            <MetricCard icon={Tags} label="Brands" value={brands?.length ?? 0} loading={brandsLoading} tone="brand" />
          )}
          {can("models.read") && (
            <MetricCard icon={Boxes} label="Models" value={models?.length ?? 0} loading={modelsLoading} tone="blue" />
          )}
        </div>
      )}

      {can("users.read") && users?.length > 0 && (
        <Card className="mt-6 p-5">
          <h2 className="mb-4 text-sm font-semibold text-primary">Recently added users</h2>
          <div className="flex flex-col divide-y divide-[var(--border-secondary-color)]">
            {[...users]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 5)
              .map((u) => (
                <div key={u._id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-primary">{u.name}</p>
                    <p className="text-xs text-secondary">{u.email}</p>
                  </div>
                  <span className="text-xs text-secondary">{u.role?.name}</span>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
}
