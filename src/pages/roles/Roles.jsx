import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import SearchInput from "@/components/common/SearchInput";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/modals/ConfirmModal";
import DataTable from "@/components/tables/DataTable";
import Badge from "@/components/ui/Badge";
import StatusBadge from "@/components/common/StatusBadge";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import RoleForm from "@/components/forms/RoleForm";
import { getApiErrorMessage } from "@/utils/apiError";
import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useToggleRoleStatusMutation,
} from "@/features/roles/rolesApi";

export default function Roles() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data: roles, isLoading, isError, refetch } = useGetRolesQuery();
  const [createRole, { isLoading: creating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: updating }] = useUpdateRoleMutation();
  const [deleteRole, { isLoading: deletingRole }] = useDeleteRoleMutation();
  const [toggleStatus] = useToggleRoleStatusMutation();

  const filtered = useMemo(() => {
    if (!roles) return [];
    return roles.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
  }, [roles, search]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(role) {
    setEditing(role);
    setFormOpen(true);
  }

  async function handleSubmit(values) {
    try {
      if (editing) {
        await updateRole({ id: editing._id, ...values }).unwrap();
        toast.success("Role updated successfully");
      } else {
        await createRole(values).unwrap();
        toast.success("Role created successfully");
      }
      setFormOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleDelete() {
    try {
      await deleteRole(deleting._id).unwrap();
      toast.success("Role deleted successfully");
      setDeleting(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleToggle(role) {
    try {
      await toggleStatus(role._id).unwrap();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  const columns = [
    { key: "name", header: "Role" },
    { key: "slug", header: "Slug", render: (row) => <Badge>{row.slug}</Badge> },
    {
      key: "permissions",
      header: "Permissions",
      render: (row) => `${row.permissions?.length ?? 0} assigned`,
    },
    {
      key: "isActive",
      header: "Status",
      render: (row) => (
        <button onClick={() => handleToggle(row)}>
          <StatusBadge active={row.isActive} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Define what each role can access across the platform."
        actions={
          <Button icon={Plus} onClick={openCreate}>
            New Role
          </Button>
        }
      />

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search roles..." />
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <ErrorState onRetry={refetch} description="Unable to load roles." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No roles found"
          description="Create your first role to get started."
          actionLabel="New Role"
          onAction={openCreate}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          actions={(row) => (
            <div className="flex justify-end gap-1">
              <button
                aria-label="Edit role"
                onClick={() => openEdit(row)}
                className="rounded-lg p-1.5 text-secondary hover:bg-muted-action hover:text-primary"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                aria-label="Delete role"
                onClick={() => setDeleting(row)}
                className="rounded-lg p-1.5 text-secondary hover:bg-red-500/10 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        />
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Edit Role" : "Create Role"} size="lg">
        <RoleForm
          initialValues={editing}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
          submitting={creating || updating}
        />
      </Modal>

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deletingRole}
        title="Delete role?"
        description={`This will permanently remove "${deleting?.name}". Users with this role may lose access.`}
      />
    </div>
  );
}
