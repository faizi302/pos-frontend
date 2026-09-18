import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Users as UsersIcon,
  CheckCircle,
  Clock3,
  Ban,
  XCircle,
} from "lucide-react";

import PageHeader from "@/components/common/PageHeader";
import SearchInput from "@/components/common/SearchInput";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/modals/ConfirmModal";
import DataTable from "@/components/tables/DataTable";
import Badge from "@/components/ui/Badge";
import StatusBadge from "@/components/common/StatusBadge";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";

import { usePermissions } from "@/hooks/usePermissions";
import { getApiErrorMessage } from "@/utils/apiError";

import {
  useGetUsersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from "@/features/users/usersApi";

import {
  useGetManagersQuery,
  useUpdateManagerMutation,
  useDeleteManagerMutation,
} from "@/features/users/managerApi";

// =====================================================
// STATUS OPTIONS
// =====================================================

const statusOptions = [
  {
    value: "active",
    label: "Active",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
  {
    value: "suspended",
    label: "Suspended",
  },
];

// =====================================================
// SUPER ADMIN STATUS OPTIONS
// =====================================================

const adminStatusOptions = [
  {
    value: "active",
    label: "Approved",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
  {
    value: "suspended",
    label: "Blocked",
  },
];

// =====================================================
// USERS PAGE
// =====================================================

export default function Users() {
  const navigate = useNavigate();

  const { can, role } = usePermissions();

  const isSuperAdmin = role === "super-admin";
  const isAdmin = role === "admin";

  // ===================================================
  // FILTERS
  // ===================================================

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ===================================================
  // DELETE CONFIRMATION
  // ===================================================

  const [deleting, setDeleting] = useState(null);

  // ===================================================
  // ADMIN STATUS UPDATE
  // ===================================================

  const [statusUpdating, setStatusUpdating] = useState(null);

  // =====================================================
  // SUPER ADMIN
  //
  // GET ADMINS ONLY
  //
  // Backend:
  // GET /api/users
  //
  // Super Admin receives Admin users only.
  // =====================================================

  const {
    data: users = [],
    isLoading: usersLoading,
    isError: usersError,
    refetch: refetchUsers,
  } = useGetUsersQuery(undefined, {
    skip: !isSuperAdmin,
  });

  // =====================================================
  // ADMIN
  //
  // GET OWN MANAGERS ONLY
  //
  // Backend:
  // GET /api/users/managers
  //
  // Backend isolates managers using createdBy.
  // =====================================================

  const {
    data: managers = [],
    isLoading: managersLoading,
    isError: managersError,
    refetch: refetchManagers,
  } = useGetManagersQuery(undefined, {
    skip: !isAdmin,
  });

  // =====================================================
  // UPDATE ADMIN
  //
  // Used by Super Admin for:
  // - active
  // - pending
  // - rejected
  // - suspended
  // =====================================================

  const [updateUser, { isLoading: updatingUser }] =
    useUpdateUserMutation();

  // =====================================================
  // DELETE ADMIN
  // SUPER ADMIN ONLY
  // =====================================================

  const [deleteUser, { isLoading: deletingUser }] =
    useDeleteUserMutation();

  // =====================================================
  // UPDATE MANAGER STATUS
  // ADMIN ONLY
  // =====================================================

  const [updateManager] = useUpdateManagerMutation();

  // =====================================================
  // DELETE MANAGER
  // ADMIN ONLY
  // =====================================================

  const [
    deleteManager,
    { isLoading: deletingManager },
  ] = useDeleteManagerMutation();

  // =====================================================
  // CURRENT TABLE DATA
  // =====================================================

  const tableUsers = isSuperAdmin ? users : managers;

  // =====================================================
  // LOADING / ERROR
  // =====================================================

  const isLoading = isSuperAdmin
    ? usersLoading
    : managersLoading;

  const isError = isSuperAdmin
    ? usersError
    : managersError;

  const refetch = isSuperAdmin
    ? refetchUsers
    : refetchManagers;

  // =====================================================
  // FILTER USERS
  // =====================================================

  const filteredUsers = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return tableUsers.filter((user) => {
      const name =
        user.name?.toLowerCase() || "";

      const email =
        user.email?.toLowerCase() || "";

      const phone =
        user.phone?.toLowerCase() || "";

      const business =
        user.business?.name?.toLowerCase() || "";

      const businessType =
        user.businessType?.name?.toLowerCase() || "";

      const matchesSearch =
        !searchValue ||
        name.includes(searchValue) ||
        email.includes(searchValue) ||
        phone.includes(searchValue) ||
        business.includes(searchValue) ||
        businessType.includes(searchValue);

      const matchesStatus =
        !statusFilter ||
        user.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    tableUsers,
    search,
    statusFilter,
  ]);

  // =====================================================
  // CREATE MANAGER
  //
  // IMPORTANT:
  // Only Admin can create Managers.
  //
  // Super Admin does NOT get a create button.
  // =====================================================

  const openCreate = () => {
    if (!isAdmin) return;

    if (!can("users.create")) {
      toast.error(
        "You do not have permission to create managers."
      );
      return;
    }

    navigate("/users/managers/create");
  };

  // =====================================================
  // EDIT
  // =====================================================

  const openEdit = (user) => {
    if (!user?._id) return;

    if (!can("users.update")) {
      toast.error(
        "You do not have permission to update this user."
      );
      return;
    }

    // ---------------------------------------------------
    // ADMIN EDITS MANAGER
    // ---------------------------------------------------

    if (isAdmin) {
      navigate(
        `/users/managers/${user._id}/edit`
      );
      return;
    }

    // ---------------------------------------------------
    // SUPER ADMIN EDITS ADMIN
    // ---------------------------------------------------

    if (isSuperAdmin) {
      navigate(`/users/${user._id}/edit`);
    }
  };

  // =====================================================
  // VIEW DETAILS
  //
  // IMPORTANT:
  //
  // We do NOT open UserDetailsModal anymore.
  //
  // Both Admin and Super Admin go to:
  //
  // /users/:id
  //
  // UserDetails.jsx will later decide what to display
  // based on the logged-in role.
  //
  // Super Admin:
  // Admin details + Business + Business Type + Managers
  //
  // Admin:
  // Own Manager details
  // =====================================================

  const openView = (user) => {
    if (!user?._id) return;

    // ---------------------------------------------------
    // ADMIN -> VIEW OWN MANAGER
    // ---------------------------------------------------

    if (isAdmin) {
      navigate(`/users/managers/${user._id}`);
      return;
    }

    // ---------------------------------------------------
    // SUPER ADMIN -> VIEW ADMIN
    // ---------------------------------------------------

    if (isSuperAdmin) {
      navigate(`/users/${user._id}`);
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const openDelete = (user) => {
    if (!user?._id) return;

    if (!can("users.delete")) {
      toast.error(
        "You do not have permission to delete users."
      );
      return;
    }

    setDeleting(user);
  };

  // =====================================================
  // CONFIRM DELETE
  // =====================================================

  const handleDelete = async () => {
    if (!deleting?._id) return;

    try {
      // -------------------------------------------------
      // SUPER ADMIN
      // Delete Admin
      // -------------------------------------------------

      if (isSuperAdmin) {
        const response =
          await deleteUser(
            deleting._id
          ).unwrap();

        toast.success(
          response?.message ||
            "Admin deleted successfully"
        );
      }

      // -------------------------------------------------
      // ADMIN
      // Delete own Manager
      // -------------------------------------------------

      if (isAdmin) {
        const response =
          await deleteManager(
            deleting._id
          ).unwrap();

        toast.success(
          response?.message ||
            "Manager deleted successfully"
        );
      }

      setDeleting(null);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error)
      );
    }
  };

  // =====================================================
  // UPDATE ADMIN STATUS
  //
  // SUPER ADMIN ONLY
  //
  // Valid backend statuses:
  //
  // active
  // pending
  // rejected
  // suspended
  // =====================================================

  const updateAdminStatus = async (
    user,
    status
  ) => {
    if (!isSuperAdmin || !user?._id) {
      return;
    }

    if (!can("users.update")) {
      toast.error(
        "You do not have permission to update admins."
      );
      return;
    }

    try {
      setStatusUpdating(
        `${user._id}-${status}`
      );

      const response =
        await updateUser({
          id: user._id,
          body: {
            status,
          },
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
      toast.error(
        getApiErrorMessage(error)
      );
    } finally {
      setStatusUpdating(null);
    }
  };

  // =====================================================
  // UPDATE MANAGER STATUS
  //
  // ADMIN ONLY
  //
  // Lets the Admin suspend/reactivate one of their own
  // Managers. Backend enforces ownership on the shared
  // PATCH /api/users/:id endpoint.
  // =====================================================

  const updateManagerStatus = async (
    manager,
    status
  ) => {
    if (!isAdmin || !manager?._id) {
      return;
    }

    if (!can("users.update")) {
      toast.error(
        "You do not have permission to update this manager."
      );
      return;
    }

    try {
      setStatusUpdating(
        `${manager._id}-${status}`
      );

      const response =
        await updateManager({
          id: manager._id,
          body: {
            status,
          },
        }).unwrap();

      const messages = {
        active: "Manager activated successfully",
        suspended: "Manager suspended successfully",
      };

      toast.success(
        response?.message ||
          messages[status] ||
          "Manager status updated successfully"
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(error)
      );
    } finally {
      setStatusUpdating(null);
    }
  };

  // =====================================================
  // STATUS BADGE
  // =====================================================

  const renderStatus = (row) => {
    // ---------------------------------------------------
    // SUPER ADMIN
    // ---------------------------------------------------

    if (isSuperAdmin) {
      if (row.status === "active") {
        return (
          <Badge tone="success">
            Approved
          </Badge>
        );
      }

      if (row.status === "pending") {
        return (
          <Badge tone="warning">
            Pending
          </Badge>
        );
      }

      if (row.status === "rejected") {
        return (
          <Badge tone="danger">
            Rejected
          </Badge>
        );
      }

      if (row.status === "suspended") {
        return (
          <Badge tone="danger">
            Blocked
          </Badge>
        );
      }

      return (
        <Badge tone="brand">
          {row.status || "Unknown"}
        </Badge>
      );
    }

    // ---------------------------------------------------
    // ADMIN
    //
    // Manager status
    // ---------------------------------------------------

    return (
      <StatusBadge
        active={row.status === "active"}
      />
    );
  };

  // =====================================================
  // TABLE COLUMNS
  // =====================================================

  const columns = [
    // ===================================================
    // USER
    // ===================================================

    {
      key: "name",

      header: isSuperAdmin
        ? "Admin"
        : "Manager",

      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={row.avatar?.url}
            name={row.name}
            size="sm"
          />

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

    // ===================================================
    // PHONE
    // ===================================================

    {
      key: "phone",

      header: "Phone",

      render: (row) =>
        row.phone || "—",
    },

    // ===================================================
    // ROLE
    // ===================================================

    {
      key: "role",

      header: "Role",

      render: (row) => (
        <Badge tone="brand">
          {row.role?.name ||
            (isSuperAdmin
              ? "Admin"
              : "Manager")}
        </Badge>
      ),
    },

    // ===================================================
    // BUSINESS
    //
    // ONLY SUPER ADMIN
    //
    // Managers inherit business from their Admin,
    // so it is intentionally hidden from Admin's table.
    // ===================================================

    ...(isSuperAdmin
      ? [
          {
            key: "business",

            header: "Business",

            render: (row) =>
              row.business?.name || "—",
          },

          // =============================================
          // BUSINESS TYPE
          // =============================================

          {
            key: "businessType",

            header: "Business Type",

            render: (row) =>
              row.businessType?.name || "—",
          },
        ]
      : []),

    // ===================================================
    // STATUS
    // ===================================================

    {
      key: "status",

      header: "Status",

      render: renderStatus,
    },

    // ===================================================
    // EMAIL VERIFIED
    // ===================================================

    {
      key: "isEmailVerified",

      header: "Email Verified",

      render: (row) =>
        row.isEmailVerified ? (
          <Badge tone="success">
            Verified
          </Badge>
        ) : (
          <Badge tone="warning">
            Not Verified
          </Badge>
        ),
    },
  ];

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="space-y-6">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <PageHeader
        title={
          isSuperAdmin
            ? "Admins"
            : "Managers"
        }

        description={
          isSuperAdmin
            ? "View and manage administrator accounts across the system."
            : "Manage the managers created under your business account."
        }

        actions={
          /*
           * IMPORTANT:
           *
           * Super Admin does NOT create Admins from here.
           *
           * Only Admin sees New Manager.
           */

          isAdmin &&
          can("users.create") && (
            <Button
              icon={Plus}
              onClick={openCreate}
            >
              New Manager
            </Button>
          )
        }
      />

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

        {/* SEARCH */}

        <div className="min-w-0 flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={
              isSuperAdmin
                ? "Search admins by name, email, phone or business..."
                : "Search managers by name, email or phone..."
            }
          />
        </div>

        {/* STATUS */}

        <Select
          options={
            isSuperAdmin
              ? adminStatusOptions
              : statusOptions
          }
          value={statusFilter}
          placeholder="All statuses"
          onChange={(e) =>
            setStatusFilter(
              e.target.value
            )
          }
          className="sm:w-48"
        />
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      {isLoading ? (
        <TableSkeleton
          cols={isSuperAdmin ? 7 : 5}
        />
      ) : isError ? (
        <ErrorState
          onRetry={refetch}
          description={
            isSuperAdmin
              ? "Unable to load administrator accounts."
              : "Unable to load your managers."
          }
        />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={UsersIcon}

          title={
            isSuperAdmin
              ? "No admins found"
              : "No managers found"
          }

          description={
            search || statusFilter
              ? "No users match your current filters."
              : isSuperAdmin
              ? "No administrator accounts are available."
              : "You have not created any managers yet."
          }

          /*
           * Only Admin gets the create action.
           */

          actionLabel={
            !search &&
            !statusFilter &&
            isAdmin &&
            can("users.create")
              ? "New Manager"
              : undefined
          }

          onAction={
            !search &&
            !statusFilter &&
            isAdmin &&
            can("users.create")
              ? openCreate
              : undefined
          }
        />
      ) : (
        <DataTable
          columns={columns}

          data={filteredUsers}

          actions={(row) => (
            <div className="flex justify-end gap-1">

              {/* =========================================
                  VIEW DETAILS
              ========================================= */}

              <button
                type="button"
                aria-label={`View ${row.name}`}
                title={
                  isSuperAdmin
                    ? "View admin details"
                    : "View manager details"
                }
                onClick={() =>
                  openView(row)
                }
                className="rounded-lg p-1.5 text-secondary transition hover:bg-muted-action hover:text-primary"
              >
                <Eye className="h-4 w-4" />
              </button>

              {/* =========================================
                  SUPER ADMIN ACTIONS
              ========================================= */}

              {isSuperAdmin ? (
                <>
                  {/* =====================================
                      EDIT ADMIN
                  ===================================== */}

                  {can("users.update") && (
                    <button
                      type="button"
                      aria-label={`Edit ${row.name}`}
                      title="Edit admin"
                      onClick={() =>
                        openEdit(row)
                      }
                      className="rounded-lg p-1.5 text-secondary transition hover:bg-muted-action hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}

                  {/* =====================================
                      APPROVE
                  ===================================== */}

                  {row.status !== "active" &&
                    can("users.update") && (
                      <button
                        type="button"
                        aria-label={`Approve ${row.name}`}
                        title="Approve admin"
                        disabled={
                          statusUpdating ===
                          `${row._id}-active`
                        }
                        onClick={() =>
                          updateAdminStatus(
                            row,
                            "active"
                          )
                        }
                        className="rounded-lg p-1.5 text-secondary transition hover:bg-green-500/10 hover:text-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}

                  {/* =====================================
                      SET PENDING
                  ===================================== */}

                  {row.status !== "pending" &&
                    can("users.update") && (
                      <button
                        type="button"
                        aria-label={`Set ${row.name} pending`}
                        title="Set pending"
                        disabled={
                          statusUpdating ===
                          `${row._id}-pending`
                        }
                        onClick={() =>
                          updateAdminStatus(
                            row,
                            "pending"
                          )
                        }
                        className="rounded-lg p-1.5 text-secondary transition hover:bg-muted-action hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Clock3 className="h-4 w-4" />
                      </button>
                    )}

                  {/* =====================================
                      SUSPEND / BLOCK
                  ===================================== */}

                  {row.status !== "suspended" &&
                    can("users.update") && (
                      <button
                        type="button"
                        aria-label={`Block ${row.name}`}
                        title="Block admin"
                        disabled={
                          statusUpdating ===
                          `${row._id}-suspended`
                        }
                        onClick={() =>
                          updateAdminStatus(
                            row,
                            "suspended"
                          )
                        }
                        className="rounded-lg p-1.5 text-secondary transition hover:bg-orange-500/10 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    )}

                  {/* =====================================
                      REJECT
                  ===================================== */}

                  {row.status !== "rejected" &&
                    can("users.update") && (
                      <button
                        type="button"
                        aria-label={`Reject ${row.name}`}
                        title="Reject admin"
                        disabled={
                          statusUpdating ===
                          `${row._id}-rejected`
                        }
                        onClick={() =>
                          updateAdminStatus(
                            row,
                            "rejected"
                          )
                        }
                        className="rounded-lg p-1.5 text-secondary transition hover:bg-red-500/10 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}

                  {/* =====================================
                      DELETE ADMIN
                  ===================================== */}

                  {can("users.delete") && (
                    <button
                      type="button"
                      aria-label={`Delete ${row.name}`}
                      title="Delete admin"
                      onClick={() =>
                        openDelete(row)
                      }
                      className="rounded-lg p-1.5 text-secondary transition hover:bg-red-500/10 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </>
              ) : (
                /* =========================================
                   ADMIN ACTIONS
                   ========================================= */

                <>
                  {/* =======================================
                      EDIT MANAGER
                  ======================================= */}

                  {can("users.update") && (
                    <button
                      type="button"
                      aria-label={`Edit ${row.name}`}
                      title="Edit manager"
                      onClick={() =>
                        openEdit(row)
                      }
                      className="rounded-lg p-1.5 text-secondary transition hover:bg-muted-action hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}

                  {/* =======================================
                      SUSPEND / ACTIVATE MANAGER
                  ======================================= */}

                  {can("users.update") &&
                    (row.status === "active" ? (
                      <button
                        type="button"
                        aria-label={`Suspend ${row.name}`}
                        title="Suspend manager"
                        disabled={
                          statusUpdating ===
                          `${row._id}-suspended`
                        }
                        onClick={() =>
                          updateManagerStatus(
                            row,
                            "suspended"
                          )
                        }
                        className="rounded-lg p-1.5 text-secondary transition hover:bg-orange-500/10 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Activate ${row.name}`}
                        title="Activate manager"
                        disabled={
                          statusUpdating ===
                          `${row._id}-active`
                        }
                        onClick={() =>
                          updateManagerStatus(
                            row,
                            "active"
                          )
                        }
                        className="rounded-lg p-1.5 text-secondary transition hover:bg-green-500/10 hover:text-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    ))}

                  {/* =======================================
                      DELETE MANAGER
                  ======================================= */}

                  {can("users.delete") && (
                    <button
                      type="button"
                      aria-label={`Delete ${row.name}`}
                      title="Delete manager"
                      onClick={() =>
                        openDelete(row)
                      }
                      className="rounded-lg p-1.5 text-secondary transition hover:bg-red-500/10 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        />
      )}

      {/* =================================================
          DELETE CONFIRMATION
      ================================================= */}

      <ConfirmModal
        open={Boolean(deleting)}

        onClose={() =>
          setDeleting(null)
        }

        onConfirm={handleDelete}

        loading={
          isSuperAdmin
            ? deletingUser
            : deletingManager
        }

        title={
          isSuperAdmin
            ? "Delete admin?"
            : "Delete manager?"
        }

        description={
          deleting
            ? `This will permanently remove "${deleting.name}". This action cannot be undone.`
            : "This action cannot be undone."
        }
      />
    </div>
  );
}