import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import SearchInput from "@/components/common/SearchInput";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/modals/ConfirmModal";
import DataTable from "@/components/tables/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";
import BusinessForm from "@/components/forms/BusinessForm";
import { usePermissions } from "@/hooks/usePermissions";
import { getApiErrorMessage } from "@/utils/apiError";
import {
  useGetBusinessesQuery,
  useCreateBusinessMutation,
  useUpdateBusinessMutation,
  useDeleteBusinessMutation,
} from "@/features/businesses/businessesApi";

export default function Businesses() {
  const { can } = usePermissions();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const { data: businesses, isLoading, isError, refetch } = useGetBusinessesQuery();
  const [createBusiness, { isLoading: creating }] = useCreateBusinessMutation();
  const [updateBusiness, { isLoading: updating }] = useUpdateBusinessMutation();
  const [deleteBusiness, { isLoading: deletingBusiness }] = useDeleteBusinessMutation();

  const filtered = useMemo(() => {
    if (!businesses) return [];
    return businesses.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));
  }, [businesses, search]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(business) {
    setEditing(business);
    setFormOpen(true);
  }

  async function handleSubmit(values) {
    try {
      if (editing) {
        await updateBusiness({ id: editing._id, ...values }).unwrap();
        toast.success("Business updated successfully");
      } else {
        await createBusiness(values).unwrap();
        toast.success("Business created successfully");
      }
      setFormOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleDelete() {
    try {
      await deleteBusiness(deleting._id).unwrap();
      toast.success("Business deleted successfully");
      setDeleting(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  const columns = [
    { key: "name", header: "Business Name" },
    { key: "isActive", header: "Status", render: (row) => <StatusBadge active={row.isActive} /> },
    {
      key: "createdAt",
      header: "Created",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Businesses"
        description="Top-level businesses on the platform."
        actions={
          can("businesses.create") && (
            <Button icon={Plus} onClick={openCreate}>
              New Business
            </Button>
          )
        }
      />

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search businesses..." />
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <ErrorState onRetry={refetch} description="Unable to load businesses." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No businesses found"
          description="Create your first business to get started."
          actionLabel={can("businesses.create") ? "New Business" : undefined}
          onAction={can("businesses.create") ? openCreate : undefined}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          actions={(row) => (
            <div className="flex justify-end gap-1">
              {can("businesses.update") && (
                <button
                  aria-label="Edit business"
                  onClick={() => openEdit(row)}
                  className="rounded-lg p-1.5 text-secondary hover:bg-muted-action hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {can("businesses.delete") && (
                <button
                  aria-label="Delete business"
                  onClick={() => setDeleting(row)}
                  className="rounded-lg p-1.5 text-secondary hover:bg-red-500/10 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        />
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Business" : "Create Business"}
      >
        <BusinessForm
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
        loading={deletingBusiness}
        title="Delete business?"
        description={`This will permanently remove "${deleting?.name}". This action cannot be undone.`}
      />
    </div>
  );
}
