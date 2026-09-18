import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";

import PageHeader from "@/components/common/PageHeader";
import SearchInput from "@/components/common/SearchInput";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/modals/ConfirmModal";
import DataTable from "@/components/tables/DataTable";
import Badge from "@/components/ui/Badge";
import StatusBadge from "@/components/common/StatusBadge";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";

import PermissionForm from "@/components/forms/PermissionForm";

import { getApiErrorMessage } from "@/utils/apiError";

import {
  useGetPermissionsQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
  useTogglePermissionStatusMutation,
} from "@/features/permissions/permissionsApi";

// =====================================================
// CONSTANTS
// =====================================================

const PAGE_SIZE = 10;

// =====================================================
// PERMISSION ACTIONS
//
// These values are used by PermissionForm.
//
// Example:
//
// Resource: roles
// Action: create
// Permission Name: roles.create
// =====================================================

export const PERMISSION_ACTIONS = [
  {
    value: "create",
    label: "Create",
  },
  {
    value: "read",
    label: "Read",
  },
  {
    value: "update",
    label: "Update",
  },
  {
    value: "delete",
    label: "Delete",
  },
  {
    value: "manage",
    label: "Manage",
  },
];

// =====================================================
// PERMISSIONS PAGE
// =====================================================

export default function Permissions() {
  // ===================================================
  // FILTER STATE
  // ===================================================

  const [search, setSearch] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  // ===================================================
  // PAGINATION
  // ===================================================

  const [page, setPage] = useState(1);

  // ===================================================
  // CREATE / EDIT MODAL
  // ===================================================

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // ===================================================
  // DELETE MODAL
  // ===================================================

  const [deleting, setDeleting] = useState(null);

  // ===================================================
  // GET PERMISSIONS
  // ===================================================

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetPermissionsQuery();

  // ===================================================
  // MUTATIONS
  // ===================================================

  const [
    createPermission,
    { isLoading: creating },
  ] = useCreatePermissionMutation();

  const [
    updatePermission,
    { isLoading: updating },
  ] = useUpdatePermissionMutation();

  const [
    deletePermission,
    { isLoading: deletingPermission },
  ] = useDeletePermissionMutation();

  const [
    toggleStatus,
    { isLoading: toggling },
  ] = useTogglePermissionStatusMutation();

  // ===================================================
  // NORMALIZE API RESPONSE
  // ===================================================

  const permissions = useMemo(() => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.permissions)) {
      return data.permissions;
    }

    return [];
  }, [data]);

  // ===================================================
  // RESOURCE OPTIONS
  //
  // Generated automatically from existing permissions.
  //
  // Example:
  //
  // users
  // products
  // roles
  // permissions
  // businesses
  // ===================================================

  const resourceOptions = useMemo(() => {
    const resources = new Set();

    permissions.forEach((permission) => {
      if (permission?.resource) {
        resources.add(
          permission.resource
            .toString()
            .toLowerCase()
            .trim()
        );
      }
    });

    return Array.from(resources)
      .sort()
      .map((resource) => ({
        value: resource,
        label:
          resource.charAt(0).toUpperCase() +
          resource.slice(1),
      }));
  }, [permissions]);

  // ===================================================
  // FILTER PERMISSIONS
  // ===================================================

  const filteredPermissions = useMemo(() => {
    const searchValue = search
      .toLowerCase()
      .trim();

    return permissions.filter((permission) => {
      const name =
        permission?.name
          ?.toLowerCase()
          .trim() || "";

      const resource =
        permission?.resource
          ?.toLowerCase()
          .trim() || "";

      const action =
        permission?.action
          ?.toLowerCase()
          .trim() || "";

      const description =
        permission?.description
          ?.toLowerCase()
          .trim() || "";

      // -----------------------------------------------
      // SEARCH
      // -----------------------------------------------

      const matchesSearch =
        !searchValue ||
        name.includes(searchValue) ||
        resource.includes(searchValue) ||
        action.includes(searchValue) ||
        description.includes(searchValue);

      // -----------------------------------------------
      // RESOURCE FILTER
      // -----------------------------------------------

      const matchesResource =
        !resourceFilter ||
        resource ===
          resourceFilter.toLowerCase();

      // -----------------------------------------------
      // ACTION FILTER
      // -----------------------------------------------

      const matchesAction =
        !actionFilter ||
        action ===
          actionFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesResource &&
        matchesAction
      );
    });
  }, [
    permissions,
    search,
    resourceFilter,
    actionFilter,
  ]);

  // ===================================================
  // RESET PAGINATION WHEN FILTERS CHANGE
  // ===================================================

  useEffect(() => {
    setPage(1);
  }, [
    search,
    resourceFilter,
    actionFilter,
  ]);

  // ===================================================
  // PAGINATION CALCULATIONS
  // ===================================================

  const totalItems =
    filteredPermissions.length;

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalItems / PAGE_SIZE
    )
  );

  const safePage = Math.min(
    page,
    totalPages
  );

  const startIndex =
    (safePage - 1) * PAGE_SIZE;

  const endIndex =
    startIndex + PAGE_SIZE;

  const paginatedPermissions =
    filteredPermissions.slice(
      startIndex,
      endIndex
    );

  // ===================================================
  // CREATE
  // ===================================================

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  // ===================================================
  // EDIT
  // ===================================================

  const openEdit = (permission) => {
    if (!permission?._id) {
      return;
    }

    setEditing(permission);
    setFormOpen(true);
  };

  // ===================================================
  // CLOSE FORM
  // ===================================================

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  // ===================================================
  // SUBMIT CREATE / UPDATE
  // ===================================================

  const handleSubmit = async (values) => {
    try {
      // -----------------------------------------------
      // NORMALIZE VALUES
      // -----------------------------------------------

      const resource =
        values?.resource
          ?.toString()
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "") || "";

      const action =
        values?.action
          ?.toString()
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "") || "";

      // -----------------------------------------------
      // AUTO GENERATE PERMISSION NAME
      //
      // roles + create
      //
      // becomes
      //
      // roles.create
      // -----------------------------------------------

      const name =
        resource && action
          ? `${resource}.${action}`
          : values?.name
              ?.toString()
              .toLowerCase()
              .trim() || "";

      const payload = {
        ...values,
        resource,
        action,
        name,
        description:
          values?.description
            ?.toString()
            .trim() || undefined,
        isActive:
          values?.isActive !== false,
      };

      // -----------------------------------------------
      // UPDATE
      // -----------------------------------------------

      if (editing) {
        const response =
          await updatePermission({
            id: editing._id,
            ...payload,
          }).unwrap();

        toast.success(
          response?.message ||
            "Permission updated successfully"
        );
      }

      // -----------------------------------------------
      // CREATE
      // -----------------------------------------------

      else {
        const response =
          await createPermission(
            payload
          ).unwrap();

        toast.success(
          response?.message ||
            "Permission created successfully"
        );
      }

      closeForm();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error)
      );
    }
  };

  // ===================================================
  // DELETE
  // ===================================================

  const openDelete = (permission) => {
    if (!permission?._id) {
      return;
    }

    setDeleting(permission);
  };

  // ===================================================
  // CONFIRM DELETE
  // ===================================================

  const handleDelete = async () => {
    if (!deleting?._id) {
      return;
    }

    try {
      const response =
        await deletePermission(
          deleting._id
        ).unwrap();

      toast.success(
        response?.message ||
          "Permission deleted successfully"
      );

      setDeleting(null);

      // -----------------------------------------------
      // If current page becomes empty after delete,
      // move back one page.
      // -----------------------------------------------

      const remainingItems =
        totalItems - 1;

      const newTotalPages =
        Math.max(
          1,
          Math.ceil(
            remainingItems /
              PAGE_SIZE
          )
        );

      if (safePage > newTotalPages) {
        setPage(newTotalPages);
      }
    } catch (error) {
      toast.error(
        getApiErrorMessage(error)
      );
    }
  };

  // ===================================================
  // TOGGLE STATUS
  // ===================================================

  const handleToggle = async (
    permission
  ) => {
    if (!permission?._id) {
      return;
    }

    try {
      const response =
        await toggleStatus(
          permission._id
        ).unwrap();

      toast.success(
        response?.message ||
          "Permission status updated successfully"
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(error)
      );
    }
  };

  // ===================================================
  // TABLE COLUMNS
  // ===================================================

  const columns = [
    // =================================================
    // PERMISSION NAME
    // =================================================

    {
      key: "name",

      header: "Permission",

      render: (row) => (
        <span className="inline-flex rounded-lg bg-muted px-2.5 py-1 font-mono text-xs font-medium text-primary">
          {row.name || "—"}
        </span>
      ),
    },

    // =================================================
    // RESOURCE
    // =================================================

    {
      key: "resource",

      header: "Resource",

      render: (row) => (
        <Badge>
          {row.resource || "—"}
        </Badge>
      ),
    },

    // =================================================
    // ACTION
    // =================================================

    {
      key: "action",

      header: "Action",

      render: (row) => (
        <Badge tone="brand">
          {row.action || "—"}
        </Badge>
      ),
    },

    // =================================================
    // DESCRIPTION
    // =================================================

    {
      key: "description",

      header: "Description",

      render: (row) => (
        <span
          className="block max-w-[300px] truncate"
          title={row.description || ""}
        >
          {row.description || "—"}
        </span>
      ),
    },

    // =================================================
    // STATUS
    // =================================================

    {
      key: "isActive",

      header: "Status",

      render: (row) => (
        <button
          type="button"
          onClick={() =>
            handleToggle(row)
          }
          disabled={toggling}
          title={
            row.isActive
              ? "Deactivate permission"
              : "Activate permission"
          }
          className="rounded-lg transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <StatusBadge
            active={
              row.isActive !== false
            }
          />
        </button>
      ),
    },
  ];

  // ===================================================
  // PAGE
  // ===================================================

  return (
    <div className="space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <PageHeader
        title="Permissions"
        description="Create and manage fine-grained system permissions used by roles."
        actions={
          <Button
            icon={Plus}
            onClick={openCreate}
          >
            New Permission
          </Button>
        }
      />

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

        {/* SEARCH */}

        <div className="min-w-0 flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by permission name, resource, action or description..."
          />
        </div>

        {/* RESOURCE FILTER */}

        <Select
          options={resourceOptions}
          value={resourceFilter}
          placeholder="All resources"
          onChange={(e) =>
            setResourceFilter(
              e.target.value
            )
          }
          className="lg:w-52"
        />

        {/* ACTION FILTER */}

        <Select
          options={PERMISSION_ACTIONS}
          value={actionFilter}
          placeholder="All actions"
          onChange={(e) =>
            setActionFilter(
              e.target.value
            )
          }
          className="lg:w-44"
        />

        {/* CLEAR FILTERS */}

        {(search ||
          resourceFilter ||
          actionFilter) && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setSearch("");
              setResourceFilter("");
              setActionFilter("");
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      {isLoading ? (
        <TableSkeleton cols={5} />
      ) : isError ? (
        <ErrorState
          onRetry={refetch}
          description="Unable to load permissions."
        />
      ) : filteredPermissions.length ===
        0 ? (
        <EmptyState
          icon={KeyRound}
          title="No permissions found"
          description={
            search ||
            resourceFilter ||
            actionFilter
              ? "No permissions match your current filters."
              : "Create your first permission to get started."
          }
          actionLabel={
            !search &&
            !resourceFilter &&
            !actionFilter
              ? "New Permission"
              : undefined
          }
          onAction={
            !search &&
            !resourceFilter &&
            !actionFilter
              ? openCreate
              : undefined
          }
        />
      ) : (
        <>
          {/* =================================================
              TABLE
          ================================================= */}

          <DataTable
            columns={columns}
            data={paginatedPermissions}
            actions={(row) => (
              <div className="flex justify-end gap-1">

                {/* EDIT */}

                <button
                  type="button"
                  aria-label={`Edit ${row.name}`}
                  title="Edit permission"
                  onClick={() =>
                    openEdit(row)
                  }
                  className="rounded-lg p-1.5 text-secondary transition hover:bg-muted-action hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                </button>

                {/* DELETE */}

                <button
                  type="button"
                  aria-label={`Delete ${row.name}`}
                  title="Delete permission"
                  onClick={() =>
                    openDelete(row)
                  }
                  className="rounded-lg p-1.5 text-secondary transition hover:bg-red-500/10 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

              </div>
            )}
          />

          {/* =================================================
              PAGINATION
          ================================================= */}

          <div className="flex flex-col gap-3 border-t border-secondary pt-4 sm:flex-row sm:items-center sm:justify-between">

            {/* SHOWING TEXT */}

            <p className="text-xs text-secondary">
              Showing{" "}
              <span className="font-medium text-primary">
                {totalItems === 0
                  ? 0
                  : startIndex + 1}
              </span>
              –
              <span className="font-medium text-primary">
                {Math.min(
                  endIndex,
                  totalItems
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium text-primary">
                {totalItems}
              </span>{" "}
              permissions
            </p>

            {/* PAGINATION BUTTONS */}

            <div className="flex items-center gap-1">

              {/* FIRST PAGE */}

              <button
                type="button"
                disabled={
                  safePage <= 1
                }
                onClick={() =>
                  setPage(1)
                }
                aria-label="First page"
                title="First page"
                className="rounded-lg border border-primary p-2 text-secondary transition hover:bg-muted-action hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>

              {/* PREVIOUS */}

              <button
                type="button"
                disabled={
                  safePage <= 1
                }
                onClick={() =>
                  setPage((current) =>
                    Math.max(
                      1,
                      current - 1
                    )
                  )
                }
                aria-label="Previous page"
                title="Previous page"
                className="rounded-lg border border-primary p-2 text-secondary transition hover:bg-muted-action hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* PAGE NUMBER */}

              <span className="min-w-[80px] px-3 text-center text-sm font-medium tabular-nums text-primary">
                {safePage} /{" "}
                {totalPages}
              </span>

              {/* NEXT */}

              <button
                type="button"
                disabled={
                  safePage >=
                  totalPages
                }
                onClick={() =>
                  setPage((current) =>
                    Math.min(
                      totalPages,
                      current + 1
                    )
                  )
                }
                aria-label="Next page"
                title="Next page"
                className="rounded-lg border border-primary p-2 text-secondary transition hover:bg-muted-action hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* LAST PAGE */}

              <button
                type="button"
                disabled={
                  safePage >=
                  totalPages
                }
                onClick={() =>
                  setPage(totalPages)
                }
                aria-label="Last page"
                title="Last page"
                className="rounded-lg border border-primary p-2 text-secondary transition hover:bg-muted-action hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>

            </div>
          </div>
        </>
      )}

      {/* =================================================
          CREATE / EDIT PERMISSION MODAL
      ================================================= */}

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={
          editing
            ? "Edit Permission"
            : "Create Permission"
        }
      >
        <PermissionForm
          initialValues={editing}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          submitting={
            creating || updating
          }

          /*
           * Pass predefined actions to the form.
           *
           * The PermissionForm should display these
           * as a dropdown:
           *
           * Create
           * Read
           * Update
           * Delete
           * Manage
           */
          actionOptions={PERMISSION_ACTIONS}

          /*
           * Tell the form that permission name should
           * be generated automatically.
           */
          autoGenerateName={true}
        />
      </Modal>

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
          deletingPermission
        }
        title="Delete permission?"
        description={
          deleting
            ? `This will permanently remove "${deleting.name}". Roles using this permission will lose that access.`
            : "This action cannot be undone."
        }
      />

    </div>
  );
}
