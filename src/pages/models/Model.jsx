import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Box, Eye } from "lucide-react";

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

import ModelForm from "@/components/forms/ModelForm";

import { usePermissions } from "@/hooks/usePermissions";
import { getApiErrorMessage } from "@/utils/apiError";

import { useGetBrandsQuery } from "@/features/brands/brandsApi";
import {
  useGetModelsQuery,
  useCreateModelMutation,
  useUpdateModelMutation,
  useDeleteModelMutation,
} from "@/features/models/modelsApi";

const PERMISSIONS = {
  CREATE: "models.create",
  UPDATE: "models.update",
  DELETE: "models.delete",
};

const asList = (data) => (Array.isArray(data) ? data : []);

/** "galaxy s20" / "GALAXY S20" → "Galaxy S20" */
function toTitleCase(value = "") {
  return String(value)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Model() {
  const { can } = usePermissions();
  const canCreate = can(PERMISSIONS.CREATE);
  const canUpdate = can(PERMISSIONS.UPDATE);
  const canDelete = can(PERMISSIONS.DELETE);

  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const queryParams = useMemo(() => {
    const p = {};
    if (search.trim()) p.search = search.trim();
    if (brandFilter) p.brand = brandFilter;
    if (statusFilter === "true" || statusFilter === "false") p.isActive = statusFilter;
    return p;
  }, [search, brandFilter, statusFilter]);

  const {
    data: modelsData,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGetModelsQuery(queryParams);

  const models = asList(modelsData);

  const { data: brandsData } = useGetBrandsQuery();
  const brands = asList(brandsData);

  const [createModel, { isLoading: creating }] = useCreateModelMutation();
  const [updateModel, { isLoading: updating }] = useUpdateModelMutation();
  const [deleteModel, { isLoading: deletingModel }] = useDeleteModelMutation();

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return models;
    return models.filter((m) => {
      const name = m?.name?.toLowerCase() || "";
      const brand = m?.brand?.name?.toLowerCase() || "";
      const bt = m?.businessType?.name?.toLowerCase() || "";
      return name.includes(q) || brand.includes(q) || bt.includes(q);
    });
  }, [models, search]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(model) {
    setViewing(null);
    setEditing(model);
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
        await updateModel({ id: editing._id, ...payload }).unwrap();
        toast.success("Model updated successfully");
      } else {
        await createModel(payload).unwrap();
        toast.success("Model created successfully");
      }
      closeForm();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function handleDelete() {
    if (!deleting?._id) return;
    try {
      await deleteModel(deleting._id).unwrap();
      toast.success("Model deleted successfully");
      setDeleting(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  const columns = [
    {
      key: "name",
      header: "Model",
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
      key: "brand",
      header: "Brand",
      render: (row) => (
        <span className="text-sm text-primary">
          {toTitleCase(row?.brand?.name || "") || "—"}
        </span>
      ),
    },
    {
      key: "businessType",
      header: "Business type",
      render: (row) => (
        <span className="text-sm text-secondary">
          {row?.businessType?.name || "—"}
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
        title="Models"
        description="Manage product models under each brand."
        actions={
          canCreate ? (
            <Button type="button" onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add Model
            </Button>
          ) : null
        }
      />

      {canCreate && (
        <div className="flex justify-end sm:hidden">
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Model
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search models…"
          className="flex-1"
        />
        <Select
          options={[
            { value: "", label: "All brands" },
            ...brands.map((b) => ({
              value: b._id,
              label: toTitleCase(b.name),
            })),
          ]}
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="sm:w-52"
        />
        <Select
          options={[
            { value: "", label: "All statuses" },
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="sm:w-40"
        />
        {canCreate && (
          <Button type="button" onClick={openCreate} className="hidden sm:inline-flex">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Model
          </Button>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <ErrorState onRetry={refetch} description="Unable to load models." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Box}
          title="No models found"
          description={
            search || brandFilter || statusFilter
              ? "Try a different search or filter."
              : "Create your first model to get started."
          }
          actionLabel={canCreate ? "Add Model" : undefined}
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
                  aria-label="View model"
                  onClick={() => setViewing(row)}
                  className="rounded-lg p-1.5 text-secondary transition-colors hover:bg-muted-action hover:text-primary"
                >
                  <Eye className="h-4 w-4" />
                </button>

                {canUpdate && (
                  <button
                    type="button"
                    title="Edit"
                    aria-label="Edit model"
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
                    aria-label="Delete model"
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
        title={editing ? "Edit Model" : "Add Model"}
      >
        <ModelForm
          initialValues={editing}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          submitting={creating || updating}
        />
      </Modal>

      <Modal
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        title="Model details"
      >
        {viewing && (
          <div className="space-y-3 text-sm">
            <DetailRow label="Name" value={toTitleCase(viewing.name)} />
            <DetailRow
              label="Brand"
              value={toTitleCase(viewing.brand?.name || "")}
            />
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
        loading={deletingModel}
        title="Delete model?"
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