import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

import {
  ArrowLeft,
  Pencil,
  Trash2,
  CheckCircle,
  Clock3,
  Ban,
  XCircle,
  Loader2,
  Building2,
  Users as UsersIcon,
  Eye,
  MapPin,
  Home,
} from "lucide-react";

import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import StatusBadge from "@/components/common/StatusBadge";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/modals/ConfirmModal";
import DataTable from "@/components/tables/DataTable";
import ErrorState from "@/components/common/ErrorState";

import { usePermissions } from "@/hooks/usePermissions";
import { getApiErrorMessage } from "@/utils/apiError";

import {
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from "@/features/users/usersApi";

import {
  useGetManagerByIdQuery,
  useDeleteManagerMutation,
} from "@/features/users/managerApi";

// =====================================================
// INFO ROW
// =====================================================

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-secondary py-3 text-sm last:border-0">
      <span className="text-secondary">{label}</span>
      <span className="text-right font-medium text-primary">
        {value ?? "—"}
      </span>
    </div>
  );
}

// =====================================================
// USER DETAILS PAGE
// =====================================================
//
// 1. Super Admin viewing an Admin  →  /users/:id
// 2. Admin (or Super Admin) viewing a Manager → /users/managers/:id
// =====================================================

export default function UserDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const { can, role } = usePermissions();

  const isSuperAdmin = role === "super-admin";
  const isAdmin = role === "admin";

  const isManagerContext = location.pathname.includes("/users/managers/");

  // ===================================================
  // DELETE CONFIRMATION
  // ===================================================

  const [deleting, setDeleting] = useState(false);

  // ===================================================
  // STATUS UPDATE
  // ===================================================

  const [statusUpdating, setStatusUpdating] = useState(null);

  // =====================================================
  // ADMIN DETAILS
  // =====================================================

  const {
    data: adminData,
    isLoading: adminLoading,
    isError: adminError,
    refetch: refetchAdmin,
  } = useGetUserByIdQuery(id, {
    skip: isManagerContext || !id,
  });

  // =====================================================
  // MANAGER DETAILS
  // =====================================================

  const {
    data: managerData,
    isLoading: managerLoading,
    isError: managerError,
    refetch: refetchManager,
  } = useGetManagerByIdQuery(id, {
    skip: !isManagerContext || !id,
  });

  const data = isManagerContext ? managerData : adminData;
  const isLoading = isManagerContext ? managerLoading : adminLoading;
  const isError = isManagerContext ? managerError : adminError;
  const refetch = isManagerContext ? refetchManager : refetchAdmin;

  const managers = !isManagerContext ? data?.managers || [] : [];

  // =====================================================
  // MUTATIONS
  // =====================================================

  const [updateUser] = useUpdateUserMutation();
  const [deleteUser, { isLoading: deletingUser }] = useDeleteUserMutation();
  const [deleteManager, { isLoading: deletingManager }] =
    useDeleteManagerMutation();

  // =====================================================
  // PERMISSIONS
  // =====================================================

  const canManageThisRecord = isManagerContext ? isAdmin : isSuperAdmin;

  // ===================================================
  // BACK
  // ===================================================

  const handleBack = () => navigate("/users");

  // ===================================================
  // EDIT
  // ===================================================

  const handleEdit = () => {
    if (!can("users.update") || !canManageThisRecord) return;

    if (isManagerContext) {
      navigate(`/users/managers/${id}/edit`);
    } else {
      navigate(`/users/${id}/edit`);
    }
  };

  // ===================================================
  // DELETE
  // ===================================================

  const handleDelete = async () => {
    if (!id) return;

    try {
      if (isManagerContext) {
        const response = await deleteManager(id).unwrap();
        toast.success(
          response?.message || "Manager deleted successfully"
        );
      } else {
        const response = await deleteUser(id).unwrap();
        toast.success(
          response?.message || "Admin deleted successfully"
        );
      }

      navigate("/users", { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  // ===================================================
  // UPDATE ADMIN STATUS
  // ===================================================

  const updateAdminStatus = async (status) => {
    if (isManagerContext || !id) return;

    if (!can("users.update")) {
      toast.error("You do not have permission to update this admin.");
      return;
    }

    try {
      setStatusUpdating(status);

      const response = await updateUser({
        id,
        body: { status },
      }).unwrap();

      const messages = {
        active: "Admin approved successfully",
        pending: "Admin moved to pending successfully",
        rejected: "Admin rejected successfully",
        suspended: "Admin blocked successfully",
      };

      toast.success(
        response?.message ||
          messages[status] ||
          "Admin status updated successfully"
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setStatusUpdating(null);
    }
  };

  // ===================================================
  // MANAGERS TABLE COLUMNS
  // ===================================================

  const managerColumns = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar src={row.avatar?.url} name={row.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-primary">
              {row.name || "—"}
            </p>
            <p className="truncate text-xs text-secondary">
              {row.email || "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (row) => row.phone || "—",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <StatusBadge active={row.status === "active"} />
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (row) =>
        row.createdAt
          ? new Date(row.createdAt).toLocaleDateString()
          : "—",
    },
  ];

  // ===================================================
  // LOADING
  // ===================================================

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-secondary">
          <Loader2 className="h-5 w-5 animate-spin" />
          {isManagerContext ? "Loading manager..." : "Loading admin..."}
        </div>
      </div>
    );
  }

  // ===================================================
  // ERROR
  // ===================================================

  if (isError || !data) {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-6 lg:p-8">
        <button
          type="button"
          onClick={handleBack}
          className="mb-5 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-secondary transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </button>

        <ErrorState
          onRetry={refetch}
          description={
            isManagerContext
              ? "Unable to load manager details."
              : "Unable to load admin details."
          }
        />
      </div>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 lg:p-8">
      {/* HEADER */}
      <div className="mb-8">
        <button
          type="button"
          onClick={handleBack}
          className="mb-5 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-secondary transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar src={data.avatar?.url} name={data.name} size="lg" />

            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {data.name}
              </h1>
              <p className="mt-0.5 text-sm text-secondary">{data.email}</p>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone="brand">
                  {isManagerContext ? "Manager" : "Admin"}
                </Badge>

                {isManagerContext ? (
                  <StatusBadge active={data.status === "active"} />
                ) : (
                  <Badge
                    tone={
                      data.status === "active"
                        ? "success"
                        : data.status === "pending"
                        ? "warning"
                        : "danger"
                    }
                  >
                    {
                      {
                        active: "Approved",
                        pending: "Pending",
                        rejected: "Rejected",
                        suspended: "Blocked",
                      }[data.status] || data.status
                    }
                  </Badge>
                )}

                {data.isEmailVerified ? (
                  <Badge tone="success">Verified</Badge>
                ) : (
                  <Badge tone="warning">Unverified</Badge>
                )}
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          {canManageThisRecord && (
            <div className="flex shrink-0 gap-2">
              {can("users.update") && (
                <Button variant="outline" icon={Pencil} onClick={handleEdit}>
                  Edit
                </Button>
              )}

              {can("users.delete") && (
                <Button
                  variant="danger"
                  icon={Trash2}
                  onClick={() => setDeleting(true)}
                >
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SUPER ADMIN STATUS ACTIONS (ADMIN CONTEXT ONLY) */}
      {!isManagerContext && isSuperAdmin && can("users.update") && (
        <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-primary bg-card p-4">
          {data.status !== "active" && (
            <Button
              variant="outline"
              icon={CheckCircle}
              loading={statusUpdating === "active"}
              onClick={() => updateAdminStatus("active")}
            >
              Approve
            </Button>
          )}

          {data.status !== "pending" && (
            <Button
              variant="outline"
              icon={Clock3}
              loading={statusUpdating === "pending"}
              onClick={() => updateAdminStatus("pending")}
            >
              Set Pending
            </Button>
          )}

          {data.status !== "rejected" && (
            <Button
              variant="outline"
              icon={XCircle}
              loading={statusUpdating === "rejected"}
              onClick={() => updateAdminStatus("rejected")}
            >
              Reject
            </Button>
          )}

          {data.status !== "suspended" && (
            <Button
              variant="outline"
              icon={Ban}
              loading={statusUpdating === "suspended"}
              onClick={() => updateAdminStatus("suspended")}
            >
              Block
            </Button>
          )}
        </div>
      )}

      {/* DETAILS CARD */}
      <div className="rounded-2xl border border-primary bg-card p-5 sm:p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-secondary">
          {isManagerContext ? "Manager Information" : "Admin Information"}
        </h2>

        <div className="flex flex-col">
          <Row label="Phone" value={data.phone} />
          <Row
            label="Role"
            value={
              data.role?.name || (isManagerContext ? "Manager" : "Admin")
            }
          />

          {/* BUSINESS CONTEXT */}
          {isManagerContext ? (
            <>
              <Row
                label="Business (inherited)"
                value={data.createdBy?.business?.name}
              />
              <Row
                label="Business Type (inherited)"
                value={data.createdBy?.businessType?.name}
              />
            </>
          ) : (
            <>
              <Row label="Business" value={data.business?.name} />
              <Row label="Business Type" value={data.businessType?.name} />
            </>
          )}

          {/* OWNER (MANAGER ONLY) */}
          {isManagerContext && (
            <Row label="Created By (Admin)" value={data.createdBy?.name} />
          )}

          {/* ADDRESS */}
          <Row label="Country" value={data.country} />
          <Row label="City" value={data.city} />
          <Row label="Address" value={data.address} />

          <Row
            label="Last Login"
            value={
              data.lastLoginAt
                ? new Date(data.lastLoginAt).toLocaleString()
                : "Never"
            }
          />
          <Row
            label="Created At"
            value={
              data.createdAt
                ? new Date(data.createdAt).toLocaleString()
                : "—"
            }
          />
          <Row
            label="Updated At"
            value={
              data.updatedAt
                ? new Date(data.updatedAt).toLocaleString()
                : "—"
            }
          />
        </div>
      </div>

      {/* MANAGERS CREATED BY THIS ADMIN */}
      {!isManagerContext && (
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-secondary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary">
              Managers created by this admin
              {typeof data.managerCount === "number"
                ? ` (${data.managerCount})`
                : ""}
            </h2>
          </div>

          {managers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary p-8 text-center">
              <UsersIcon className="mb-2 h-6 w-6 text-secondary" />
              <p className="text-sm text-secondary">
                This admin has not created any managers yet.
              </p>
            </div>
          ) : (
            <DataTable
              columns={managerColumns}
              data={managers}
              actions={(row) => (
                <button
                  type="button"
                  aria-label={`View ${row.name}`}
                  title="View manager details"
                  onClick={() =>
                    navigate(`/users/managers/${row._id}`)
                  }
                  className="rounded-lg p-1.5 text-secondary transition hover:bg-muted-action hover:text-primary"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
            />
          )}
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      <ConfirmModal
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={handleDelete}
        loading={isManagerContext ? deletingManager : deletingUser}
        title={isManagerContext ? "Delete manager?" : "Delete admin?"}
        description={`This will permanently remove "${data.name}". This action cannot be undone.`}
      />
    </div>
  );
}