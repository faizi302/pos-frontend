import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  FolderTree,
  Image as ImageIcon,
} from "lucide-react";

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

import CategoryForm from "@/components/forms/CategoryForm";

import { usePermissions } from "@/hooks/usePermissions";
import { getApiErrorMessage } from "@/utils/apiError";

import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useRestoreCategoryMutation,
} from "../../features/category/categoryApi";

import { useGetBusinessTypesQuery } from "../../features/businessTypes/businessTypesApi";

const PERMISSIONS = {
  CREATE: "categories.create",
  READ: "categories.read",
  UPDATE: "categories.update",
  DELETE: "categories.delete",
};

export default function Category() {
  const { can } = usePermissions();

  // =====================================================
  // FILTER STATE
  // =====================================================

  const [search, setSearch] = useState("");
  const [businessTypeFilter, setBusinessTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // =====================================================
  // MODAL STATE
  // =====================================================

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [restoring, setRestoring] = useState(null);

  // =====================================================
  // GET CATEGORIES
  // =====================================================

  const {
    data: categoryResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetCategoriesQuery();

  // =====================================================
  // NORMALIZE CATEGORY RESPONSE
  // =====================================================

  const categories = useMemo(() => {
    if (Array.isArray(categoryResponse)) {
      return categoryResponse;
    }

    if (Array.isArray(categoryResponse?.categories)) {
      return categoryResponse.categories;
    }

    if (Array.isArray(categoryResponse?.data)) {
      return categoryResponse.data;
    }

    return [];
  }, [categoryResponse]);

  const pagination = categoryResponse?.pagination || null;

  // =====================================================
  // GET BUSINESS TYPES
  // =====================================================

  const { data: businessTypeResponse } =
    useGetBusinessTypesQuery();

  const businessTypes = useMemo(() => {
    if (Array.isArray(businessTypeResponse)) {
      return businessTypeResponse;
    }

    if (Array.isArray(businessTypeResponse?.businessTypes)) {
      return businessTypeResponse.businessTypes;
    }

    if (Array.isArray(businessTypeResponse?.data)) {
      return businessTypeResponse.data;
    }

    return [];
  }, [businessTypeResponse]);

  // =====================================================
  // MUTATIONS
  // =====================================================

  const [
    createCategory,
    { isLoading: creating },
  ] = useCreateCategoryMutation();

  const [
    updateCategory,
    { isLoading: updating },
  ] = useUpdateCategoryMutation();

  const [
    deleteCategory,
    { isLoading: deletingCategory },
  ] = useDeleteCategoryMutation();

  const [
    restoreCategory,
    { isLoading: restoringCategory },
  ] = useRestoreCategoryMutation();

  // =====================================================
  // FILTER CATEGORIES
  // =====================================================

  const filteredCategories = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return categories.filter((category) => {
      // -------------------------------------------------
      // CATEGORY NAME
      // -------------------------------------------------

      const categoryName =
        category?.name?.toLowerCase() || "";

      // -------------------------------------------------
      // SLUG
      // -------------------------------------------------

      const categorySlug =
        category?.slug?.toLowerCase() || "";

      // -------------------------------------------------
      // BUSINESS
      // -------------------------------------------------

      const businessName =
        category?.business?.name?.toLowerCase() || "";

      // -------------------------------------------------
      // BUSINESS TYPE
      // -------------------------------------------------

      const businessTypeName =
        category?.businessType?.name?.toLowerCase() || "";

      // -------------------------------------------------
      // SEARCH
      // -------------------------------------------------

      const matchesSearch =
        !searchValue ||
        categoryName.includes(searchValue) ||
        categorySlug.includes(searchValue) ||
        businessName.includes(searchValue) ||
        businessTypeName.includes(searchValue);

      // -------------------------------------------------
      // BUSINESS TYPE FILTER
      // -------------------------------------------------

      const categoryBusinessTypeId =
        category?.businessType?._id ||
        category?.businessType ||
        "";

      const matchesBusinessType =
        !businessTypeFilter ||
        categoryBusinessTypeId === businessTypeFilter;

      // -------------------------------------------------
      // STATUS FILTER
      // -------------------------------------------------

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          category?.isActive === true) ||
        (statusFilter === "inactive" &&
          category?.isActive === false);

      return (
        matchesSearch &&
        matchesBusinessType &&
        matchesStatus
      );
    });
  }, [
    categories,
    search,
    businessTypeFilter,
    statusFilter,
  ]);

  // =====================================================
  // OPEN CREATE
  // =====================================================

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  // =====================================================
  // OPEN EDIT
  // =====================================================

  function openEdit(category) {
    setEditing(category);
    setFormOpen(true);
  }

  // =====================================================
  // CLOSE FORM
  // =====================================================

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  // =====================================================
  // CREATE / UPDATE
  // =====================================================

  async function handleSubmit(formData) {
    try {
      if (editing?._id) {
        await updateCategory({
          id: editing._id,
          body: formData,
        }).unwrap();

        toast.success("Category updated successfully");
      } else {
        await createCategory(formData).unwrap();

        toast.success("Category created successfully");
      }

      closeForm();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  // =====================================================
  // DELETE
  // =====================================================

  async function handleDelete() {
    if (!deleting?._id) {
      return;
    }

    try {
      await deleteCategory(deleting._id).unwrap();

      toast.success("Category deleted successfully");

      setDeleting(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  // =====================================================
  // RESTORE
  // =====================================================

  async function handleRestore() {
    if (!restoring?._id) {
      return;
    }

    try {
      await restoreCategory(restoring._id).unwrap();

      toast.success("Category restored successfully");

      setRestoring(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  // =====================================================
  // TABLE COLUMNS
  // =====================================================

  const columns = [
    // ---------------------------------------------------
    // IMAGE
    // ---------------------------------------------------

    {
      key: "image",
      header: "Image",

      render: (row) => {
        if (!row?.image?.url) {
          return (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted-action">
              <ImageIcon className="h-5 w-5 text-secondary" />
            </div>
          );
        }

        return (
          <img
            src={row.image.url}
            alt={row.name || "Category"}
            className="h-10 w-10 rounded-lg border border-primary/10 object-cover"
          />
        );
      },
    },

    // ---------------------------------------------------
    // CATEGORY
    // ---------------------------------------------------

    {
      key: "name",
      header: "Category",

      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-primary">
            {row?.name || "—"}
          </span>

          {row?.slug && (
            <span className="text-xs text-secondary">
              /{row.slug}
            </span>
          )}
        </div>
      ),
    },

    // ---------------------------------------------------
    // BUSINESS
    // ---------------------------------------------------

    {
      key: "business",
      header: "Business",

      render: (row) =>
        row?.business?.name || "—",
    },

    // ---------------------------------------------------
    // BUSINESS TYPE
    // ---------------------------------------------------

    {
      key: "businessType",
      header: "Business Type",

      render: (row) =>
        row?.businessType?.name || "—",
    },

    // ---------------------------------------------------
    // STATUS
    // ---------------------------------------------------

    {
      key: "isActive",
      header: "Status",

      render: (row) => (
        <StatusBadge active={row?.isActive} />
      ),
    },
  ];

  // =====================================================
  // API ERROR
  // =====================================================

  const apiErrorMessage = isError
    ? getApiErrorMessage(error)
    : "";

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div>
      {/* =================================================
          HEADER
      ================================================= */}

      <PageHeader
        title="Categories"
        description="Manage product categories for your businesses."
        actions={
          can(PERMISSIONS.CREATE) && (
            <Button
              icon={Plus}
              onClick={openCreate}
            >
              New Category
            </Button>
          )
        }
      />

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        {/* SEARCH */}

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search categories..."
        />

        {/* BUSINESS TYPE */}

        <Select
          options={[
            {
              value: "",
              label: "All business types",
            },

            ...businessTypes.map((businessType) => ({
              value: businessType?._id,
              label:
                businessType?.name || "Unnamed",
            })),
          ]}
          value={businessTypeFilter}
          placeholder="All business types"
          onChange={(e) =>
            setBusinessTypeFilter(e.target.value)
          }
          className="sm:w-64"
        />

        {/* STATUS */}

        <Select
          options={[
            {
              value: "all",
              label: "All statuses",
            },
            {
              value: "active",
              label: "Active",
            },
            {
              value: "inactive",
              label: "Inactive",
            },
          ]}
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
          className="sm:w-44"
        />
      </div>

      {/* =================================================
          TABLE STATES
      ================================================= */}

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <ErrorState
          onRetry={refetch}
          description={
            apiErrorMessage ||
            "Unable to load categories."
          }
        />
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No categories found"
          description={
            search ||
            businessTypeFilter ||
            statusFilter !== "all"
              ? "Try changing your filters."
              : "Create your first category to get started."
          }
          actionLabel={
            can(PERMISSIONS.CREATE)
              ? "New Category"
              : undefined
          }
          onAction={
            can(PERMISSIONS.CREATE)
              ? openCreate
              : undefined
          }
        />
      ) : (
        <>
          {/* =================================================
              DATA TABLE
          ================================================= */}

          <DataTable
            columns={columns}
            data={filteredCategories}
            actions={(row) => (
              <div className="flex justify-end gap-1">
                {/* EDIT */}

                {can(PERMISSIONS.UPDATE) && (
                  <button
                    type="button"
                    aria-label="Edit category"
                    onClick={() => openEdit(row)}
                    className="rounded-lg p-1.5 text-secondary hover:bg-muted-action hover:text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}

                {/* RESTORE */}

                {can(PERMISSIONS.UPDATE) &&
                  row?.isActive === false && (
                    <button
                      type="button"
                      aria-label="Restore category"
                      onClick={() =>
                        setRestoring(row)
                      }
                      className="rounded-lg p-1.5 text-secondary hover:bg-green-500/10 hover:text-green-600"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}

                {/* DELETE */}

                {can(PERMISSIONS.DELETE) &&
                  row?.isActive !== false && (
                    <button
                      type="button"
                      aria-label="Delete category"
                      onClick={() =>
                        setDeleting(row)
                      }
                      className="rounded-lg p-1.5 text-secondary hover:bg-red-500/10 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
              </div>
            )}
          />

          {/* PAGINATION */}

          {pagination &&
            pagination.total > 0 && (
              <div className="mt-4 text-sm text-secondary">
                Showing{" "}
                {filteredCategories.length} of{" "}
                {pagination.total} categories
              </div>
            )}
        </>
      )}

      {/* =====================================================
          CATEGORY FORM MODAL
      ===================================================== */}

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={
          editing
            ? "Edit Category"
            : "Create Category"
        }
      >
        <CategoryForm
          initialValues={editing}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          submitting={creating || updating}
        />
      </Modal>

      {/* =====================================================
          DELETE CONFIRMATION
      ===================================================== */}

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deletingCategory}
        title="Delete category?"
        description={`This will remove "${deleting?.name}". The category can be restored later.`}
      />

      {/* =====================================================
          RESTORE CONFIRMATION
      ===================================================== */}

      <ConfirmModal
        open={Boolean(restoring)}
        onClose={() => setRestoring(null)}
        onConfirm={handleRestore}
        loading={restoringCategory}
        title="Restore category?"
        description={`Restore "${restoring?.name}" and make it active again?`}
      />
    </div>
  );
}