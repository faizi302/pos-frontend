import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Layers3 } from "lucide-react";

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

import BusinessTypeForm from "@/components/forms/BusinessTypeForm";

import { usePermissions } from "@/hooks/usePermissions";
import { getApiErrorMessage } from "@/utils/apiError";

import { useGetBusinessesQuery } from "@/features/businesses/businessesApi";

import {
  useGetBusinessTypesQuery,
  useCreateBusinessTypeMutation,
  useUpdateBusinessTypeMutation,
  useDeleteBusinessTypeMutation,
} from "@/features/businessTypes/businessTypesApi";

// ============================================================
// PERMISSIONS
// ============================================================
// IMPORTANT:
// These names must exactly match the permission names stored
// in the database and returned by the login API.
//
// Database:
// businesstypes.create
// businesstypes.read
// businesstypes.update
// businesstypes.delete
// ============================================================

const PERMISSIONS = {
  CREATE: "businesstypes.create",
  READ: "businesstypes.read",
  UPDATE: "businesstypes.update",
  DELETE: "businesstypes.delete",
};

export default function BusinessTypes() {
  const { can } = usePermissions();

  // ==========================================================
  // STATE
  // ==========================================================

  const [search, setSearch] = useState("");
  const [businessFilter, setBusinessFilter] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // ==========================================================
  // BUSINESS TYPES
  // ==========================================================

  const {
    data: businessTypes,
    isLoading,
    isError,
    refetch,
  } = useGetBusinessTypesQuery();

  // ==========================================================
  // BUSINESSES
  // ==========================================================

  const { data: businesses } = useGetBusinessesQuery();

  // ==========================================================
  // MUTATIONS
  // ==========================================================

  const [createBusinessType, { isLoading: creating }] =
    useCreateBusinessTypeMutation();

  const [updateBusinessType, { isLoading: updating }] =
    useUpdateBusinessTypeMutation();

  const [deleteBusinessType, { isLoading: deletingType }] =
    useDeleteBusinessTypeMutation();

  // ==========================================================
  // FILTER BUSINESS TYPES
  // ==========================================================

  const filtered = useMemo(() => {
    if (!businessTypes) return [];

    const searchValue = search.toLowerCase().trim();

    return businessTypes.filter((businessType) => {
      const businessTypeName = businessType?.name?.toLowerCase() || "";

      const matchesSearch = businessTypeName.includes(searchValue);

      const matchesBusiness =
        !businessFilter ||
        businessType?.business?._id === businessFilter;

      return matchesSearch && matchesBusiness;
    });
  }, [businessTypes, search, businessFilter]);

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

  function openEdit(businessType) {
    setEditing(businessType);
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
        await updateBusinessType({
          id: editing._id,
          ...values,
        }).unwrap();

        toast.success("Business type updated successfully");
      } else {
        await createBusinessType(values).unwrap();

        toast.success("Business type created successfully");
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
      await deleteBusinessType(deleting._id).unwrap();

      toast.success("Business type deleted successfully");

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
      header: "Business Type",
    },

    {
      key: "business",
      header: "Business",
      render: (row) => row?.business?.name || "—",
    },

    {
      key: "isActive",
      header: "Status",
      render: (row) => <StatusBadge active={row?.isActive} />,
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
        title="Business Types"
        description="Categories within a business, e.g. Mobiles under Information Technology."
        actions={
          can(PERMISSIONS.CREATE) && (
            <Button icon={Plus} onClick={openCreate}>
              New Business Type
            </Button>
          )
        }
      />

      {/* ======================================================
          FILTERS
      ======================================================= */}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        {/* Search */}
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search business types..."
        />

        {/* Business Filter */}
        <Select
          options={(businesses || []).map((business) => ({
            value: business._id,
            label: business.name,
          }))}
          value={businessFilter}
          placeholder="All businesses"
          onChange={(e) => setBusinessFilter(e.target.value)}
          className="sm:w-56"
        />
      </div>

      {/* ======================================================
          LOADING
      ======================================================= */}

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        /* ====================================================
           ERROR
        ===================================================== */

        <ErrorState
          onRetry={refetch}
          description="Unable to load business types."
        />
      ) : filtered.length === 0 ? (
        /* ====================================================
           EMPTY
        ===================================================== */

        <EmptyState
          icon={Layers3}
          title="No business types found"
          description="Create your first business type to get started."
          actionLabel={
            can(PERMISSIONS.CREATE)
              ? "New Business Type"
              : undefined
          }
          onAction={
            can(PERMISSIONS.CREATE)
              ? openCreate
              : undefined
          }
        />
      ) : (
        /* ====================================================
           DATA TABLE
        ===================================================== */

        <DataTable
          columns={columns}
          data={filtered}
          actions={(row) => (
            <div className="flex justify-end gap-1">
              {/* ==============================================
                  UPDATE
              =============================================== */}

              {can(PERMISSIONS.UPDATE) && (
                <button
                  type="button"
                  aria-label="Edit business type"
                  onClick={() => openEdit(row)}
                  className="rounded-lg p-1.5 text-secondary hover:bg-muted-action hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}

              {/* ==============================================
                  DELETE
              =============================================== */}

              {can(PERMISSIONS.DELETE) && (
                <button
                  type="button"
                  aria-label="Delete business type"
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
        title={
          editing
            ? "Edit Business Type"
            : "Create Business Type"
        }
      >
        <BusinessTypeForm
          initialValues={editing}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          submitting={creating || updating}
        />
      </Modal>

      {/* ======================================================
          DELETE CONFIRMATION MODAL
      ======================================================= */}

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deletingType}
        title="Delete business type?"
        description={`This will permanently remove "${deleting?.name}". This action cannot be undone.`}
      />
    </div>
  );
}