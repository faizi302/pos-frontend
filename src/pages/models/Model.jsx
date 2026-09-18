import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Box } from "lucide-react";

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

// ============================================================
// PERMISSIONS
// ============================================================

const PERMISSIONS = {
  CREATE: "models.create",
  READ: "models.read",
  UPDATE: "models.update",
  DELETE: "models.delete",
};

export default function Model() {
  const { can } = usePermissions();

  // ==========================================================
  // STATE
  // ==========================================================

  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // ==========================================================
  // MODELS
  // ==========================================================

  const {
    data: models,
    isLoading,
    isError,
    refetch,
  } = useGetModelsQuery(
    brandFilter
      ? { brand: brandFilter }
      : {}
  );

  // ==========================================================
  // BRANDS
  // ==========================================================

  const { data: brands } = useGetBrandsQuery();

  // ==========================================================
  // MUTATIONS
  // ==========================================================

  const [createModel, { isLoading: creating }] =
    useCreateModelMutation();

  const [updateModel, { isLoading: updating }] =
    useUpdateModelMutation();

  const [deleteModel, { isLoading: deletingModel }] =
    useDeleteModelMutation();

  // ==========================================================
  // FILTER MODELS
  // ==========================================================

  const filtered = useMemo(() => {
    if (!models) return [];

    const searchValue = search.toLowerCase().trim();

    return models.filter((model) => {
      const modelName =
        model?.name?.toLowerCase() || "";

      const brandName =
        model?.brand?.name?.toLowerCase() || "";

      const matchesSearch =
        modelName.includes(searchValue) ||
        brandName.includes(searchValue);

      const matchesBrand =
        !brandFilter ||
        model?.brand?._id === brandFilter;

      return matchesSearch && matchesBrand;
    });
  }, [models, search, brandFilter]);

  // ==========================================================
  // CREATE
  // ==========================================================

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  // ==========================================================
  // EDIT
  // ==========================================================

  function openEdit(model) {
    setEditing(model);
    setFormOpen(true);
  }

  // ==========================================================
  // CLOSE FORM
  // ==========================================================

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  // ==========================================================
  // CREATE / UPDATE
  // ==========================================================

  async function handleSubmit(values) {
    try {
      if (editing) {
        await updateModel({
          id: editing._id,
          ...values,
        }).unwrap();

        toast.success("Model updated successfully");
      } else {
        await createModel(values).unwrap();

        toast.success("Model created successfully");
      }

      closeForm();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  // ==========================================================
  // DELETE
  // ==========================================================

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

  // ==========================================================
  // TABLE COLUMNS
  // ==========================================================

  const columns = [
    {
      key: "name",
      header: "Model",
    },

    {
      key: "brand",
      header: "Brand",
      render: (row) => row?.brand?.name || "—",
    },

    {
      key: "businessType",
      header: "Business Type",
      render: (row) =>
        row?.businessType?.name || "—",
    },

    {
      key: "isActive",
      header: "Status",
      render: (row) => (
        <StatusBadge active={row?.isActive} />
      ),
    },
  ];

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div>
      {/* ======================================================
          PAGE HEADER
      ======================================================= */}

      <PageHeader
        title="Models"
        description="Manage product models under each brand."
        actions={
          can(PERMISSIONS.CREATE) && (
            <Button icon={Plus} onClick={openCreate}>
              New Model
            </Button>
          )
        }
      />

      {/* ======================================================
          FILTERS
      ======================================================= */}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search models..."
        />

        <Select
          options={(brands || []).map((brand) => ({
            value: brand._id,
            label: brand.name,
          }))}
          value={brandFilter}
          placeholder="All brands"
          onChange={(e) =>
            setBrandFilter(e.target.value)
          }
          className="sm:w-64"
        />
      </div>

      {/* ======================================================
          CONTENT
      ======================================================= */}

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <ErrorState
          onRetry={refetch}
          description="Unable to load models."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Box}
          title="No models found"
          description="Create your first model to get started."
          actionLabel={
            can(PERMISSIONS.CREATE)
              ? "New Model"
              : undefined
          }
          onAction={
            can(PERMISSIONS.CREATE)
              ? openCreate
              : undefined
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          actions={(row) => (
            <div className="flex justify-end gap-1">
              {/* UPDATE */}

              {can(PERMISSIONS.UPDATE) && (
                <button
                  type="button"
                  aria-label="Edit model"
                  onClick={() => openEdit(row)}
                  className="rounded-lg p-1.5 text-secondary hover:bg-muted-action hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}

              {/* DELETE */}

              {can(PERMISSIONS.DELETE) && (
                <button
                  type="button"
                  aria-label="Delete model"
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

      {/* ======================================================
          CREATE / EDIT MODAL
      ======================================================= */}

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? "Edit Model" : "Create Model"}
      >
        <ModelForm
          initialValues={editing}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          submitting={creating || updating}
        />
      </Modal>

      {/* ======================================================
          DELETE MODAL
      ======================================================= */}

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deletingModel}
        title="Delete model?"
        description={`This will permanently remove "${deleting?.name}". This action cannot be undone.`}
      />
    </div>
  );
}