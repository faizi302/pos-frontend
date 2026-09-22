import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Tags, Eye } from "lucide-react";

import PageHeader from "@/components/common/PageHeader";
import SearchInput from "@/components/common/SearchInput";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/modals/ConfirmModal";
import DataTable from "@/components/tables/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";

import BrandForm from "@/components/forms/BrandForm";

import { usePermissions } from "@/hooks/usePermissions";
import { getApiErrorMessage } from "@/utils/apiError";

import {
  useGetBrandsQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} from "@/features/brands/brandsApi";

const PERMISSIONS = {
  CREATE: "brands.create",
  UPDATE: "brands.update",
  DELETE: "brands.delete",
};

const asList = (data) => (Array.isArray(data) ? data : []);

/** "samsung galaxy" / "SAMSUNG" → "Samsung Galaxy" */
function toTitleCase(value = "") {
  return String(value)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Brand() {
  const { can } = usePermissions();
  const canCreate = can(PERMISSIONS.CREATE);
  const canUpdate = can(PERMISSIONS.UPDATE);
  const canDelete = can(PERMISSIONS.DELETE);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const queryParams = useMemo(() => {
    const p = {};
    if (search.trim()) p.search = search.trim();
    if (statusFilter === "true" || statusFilter === "false") p.isActive = statusFilter;
    return p;
  }, [search, statusFilter]);

  const {
    data: brandsData,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGetBrandsQuery(queryParams);

  const brands = asList(brandsData);

  const [createBrand, { isLoading: creating }] = useCreateBrandMutation();
  const [updateBrand, { isLoading: updating }] = useUpdateBrandMutation();
  const [deleteBrand, { isLoading: deletingBrand }] = useDeleteBrandMutation();

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return brands;
    return brands.filter((b) => {
      const name = b?.name?.toLowerCase() || "";
      const bt = b?.businessType?.name?.toLowerCase() || "";
      const desc = b?.description?.toLowerCase() || "";
      return name.includes(q) || bt.includes(q) || desc.includes(q);
    });
  }, [brands, search]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(brand) {
    setViewing(null);
    setEditing(brand);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  async function handleSubmit(values) {
    const payload = {
      ...values,
      name: toTitleCase(values.name),
      description: values.description?.trim() || "",
    };

    try {
      if (editing?._id) {
        await updateBrand({ id: editing._id, ...payload }).unwrap();
        toast.success("Brand updated successfully");
      } else {
        await createBrand(payload).unwrap();
        toast.success("Brand created successfully");
      }
      closeForm();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleDelete() {
    if (!deleting?._id) return;
    try {
      await deleteBrand(deleting._id).unwrap();
      toast.success("Brand deleted successfully");
      setDeleting(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  const columns = [
    {
      key: "name",
      header: "Brand",
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-primary">
            {toTitleCase(row?.name || "") || "—"}
          </p>
          {row?.description ? (
            <p className="mt-0.5 line-clamp-1 text-xs text-secondary">
              {row.description}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "businessType",
      header: "Business type",
      render: (row) => (
        <span className="text-sm text-primary">
          {row?.businessType?.name || "—"}
        </span>
      ),
    },
    {
      key: "business",
      header: "Business",
      render: (row) => (
        <span className="text-sm text-secondary">
          {row?.business?.name || "—"}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (row) => <StatusBadge active={row?.isActive} />,
    },
  ];

  return (
    <div className="animate-fade-up space-y-4">
      <PageHeader
        title="Brands"
        description="Manage brands for your business."
        actions={
          canCreate ? (
            <Button type="button" onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Brand
            </Button>
          ) : null
        }
      />

      {canCreate && (
        <div className="flex justify-end sm:hidden">
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Brand
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search brands…"
          className="flex-1"
        />
        <Select
          options={[
            { value: "", label: "All statuses" },
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="sm:w-44"
        />
        {canCreate && (
          <Button type="button" onClick={openCreate} className="hidden sm:inline-flex">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Brand
          </Button>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <ErrorState onRetry={refetch} description="Unable to load brands." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No brands found"
          description={
            search || statusFilter
              ? "Try a different search or status filter."
              : "Create your first brand to get started."
          }
          actionLabel={canCreate ? "Add Brand" : undefined}
          onAction={canCreate ? openCreate : undefined}
        />
      ) : (
        <div
          className={`overflow-hidden rounded-2xl border border-primary bg-card ${
            isFetching ? "opacity-80" : ""
          }`}
        >
          <DataTable
            columns={columns}
            data={filtered}
            actions={(row) => (
              <div className="flex items-center justify-end gap-0.5">
                <button
                  type="button"
                  title="View"
                  aria-label="View brand"
                  onClick={() => setViewing(row)}
                  className="rounded-lg p-1.5 text-secondary transition-colors hover:bg-muted-action hover:text-primary"
                >
                  <Eye className="h-4 w-4" />
                </button>

                {canUpdate && (
                  <button
                    type="button"
                    title="Edit"
                    aria-label="Edit brand"
                    onClick={() => openEdit(row)}
                    className="rounded-lg p-1.5 text-secondary transition-colors hover:bg-muted-action hover:text-brand"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}

                {canDelete && (
                  <button
                    type="button"
                    title="Delete"
                    aria-label="Delete brand"
                    onClick={() => setDeleting(row)}
                    className="rounded-lg p-1.5 text-secondary transition-colors hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          />
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? "Edit Brand" : "Add Brand"}
      >
        <BrandForm
          initialValues={editing}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          submitting={creating || updating}
        />
      </Modal>

      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title="Brand details"
      >
        {viewing && (
          <div className="space-y-3 text-sm">
            <DetailRow label="Name" value={toTitleCase(viewing.name)} />
            <DetailRow label="Business type" value={viewing.businessType?.name} />
            <DetailRow label="Business" value={viewing.business?.name} />
            <DetailRow
              label="Status"
              value={viewing.isActive ? "Active" : "Inactive"}
            />
            <DetailRow label="Description" value={viewing.description || "—"} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setViewing(null)}>
                Close
              </Button>
              {canUpdate && (
                <Button type="button" onClick={() => openEdit(viewing)}>
                  Edit
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deletingBrand}
        title="Delete brand?"
        description={`This will permanently remove "${toTitleCase(
          deleting?.name || ""
        )}". This cannot be undone.`}
      />
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-secondary bg-surface px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs font-medium text-secondary">{label}</span>
      <span className="font-medium text-primary">{value || "—"}</span>
    </div>
  );
}