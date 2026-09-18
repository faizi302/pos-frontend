import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";

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

import { useGetBusinessTypesQuery } from "@/features/businessTypes/businessTypesApi";

import {
  useGetBrandsQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} from "@/features/brands/brandsApi";

// ============================================================
// PERMISSIONS
// ============================================================

const PERMISSIONS = {
  CREATE: "brands.create",
  READ: "brands.read",
  UPDATE: "brands.update",
  DELETE: "brands.delete",
};

export default function Brand() {
  const { can } = usePermissions();

  // ==========================================================
  // STATE
  // ==========================================================

  const [search, setSearch] = useState("");
  const [businessTypeFilter, setBusinessTypeFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // ==========================================================
  // BRANDS
  // ==========================================================

  const {
    data: brands,
    isLoading,
    isError,
    refetch,
  } = useGetBrandsQuery(
    businessTypeFilter
      ? { businessType: businessTypeFilter }
      : {}
  );

  // ==========================================================
  // BUSINESS TYPES
  // ==========================================================

  const { data: businessTypes } = useGetBusinessTypesQuery();

  // ==========================================================
  // MUTATIONS
  // ==========================================================

  const [createBrand, { isLoading: creating }] =
    useCreateBrandMutation();

  const [updateBrand, { isLoading: updating }] =
    useUpdateBrandMutation();

  const [deleteBrand, { isLoading: deletingBrand }] =
    useDeleteBrandMutation();

  // ==========================================================
  // FILTER BRANDS
  // ==========================================================

  const filtered = useMemo(() => {
    if (!brands) return [];

    const searchValue = search.toLowerCase().trim();

    return brands.filter((brand) => {
      const brandName = brand?.name?.toLowerCase() || "";

      const businessTypeName =
        brand?.businessType?.name?.toLowerCase() || "";

      const matchesSearch =
        brandName.includes(searchValue) ||
        businessTypeName.includes(searchValue);

      const matchesBusinessType =
        !businessTypeFilter ||
        brand?.businessType?._id === businessTypeFilter;

      return matchesSearch && matchesBusinessType;
    });
  }, [brands, search, businessTypeFilter]);

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

  function openEdit(brand) {
    setEditing(brand);
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
        await updateBrand({
          id: editing._id,
          ...values,
        }).unwrap();

        toast.success("Brand updated successfully");
      } else {
        await createBrand(values).unwrap();

        toast.success("Brand created successfully");
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
      await deleteBrand(deleting._id).unwrap();

      toast.success("Brand deleted successfully");

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
      header: "Brand",
    },

    {
      key: "businessType",
      header: "Business Type",
      render: (row) => row?.businessType?.name || "—",
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
        title="Brands"
        description="Manage brands available for each business type."
        actions={
          can(PERMISSIONS.CREATE) && (
            <Button icon={Plus} onClick={openCreate}>
              New Brand
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
          placeholder="Search brands..."
        />

        <Select
          options={(businessTypes || []).map((businessType) => ({
            value: businessType._id,
            label: businessType.name,
          }))}
          value={businessTypeFilter}
          placeholder="All business types"
          onChange={(e) =>
            setBusinessTypeFilter(e.target.value)
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
          description="Unable to load brands."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No brands found"
          description="Create your first brand to get started."
          actionLabel={
            can(PERMISSIONS.CREATE)
              ? "New Brand"
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
                  aria-label="Edit brand"
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
                  aria-label="Delete brand"
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
        title={editing ? "Edit Brand" : "Create Brand"}
      >
        <BrandForm
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
        loading={deletingBrand}
        title="Delete brand?"
        description={`This will permanently remove "${deleting?.name}". This action cannot be undone.`}
      />
    </div>
  );
}