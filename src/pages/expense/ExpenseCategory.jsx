import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  RotateCcw,
  FolderOpen,
  Search,
} from "lucide-react";

import PageHeader from "@/components/common/PageHeader";
import SearchInput from "@/components/common/SearchInput";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/modals/ConfirmModal";
import DataTable from "@/components/tables/DataTable";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";

import { usePermissions } from "@/hooks/usePermissions";
import { getApiErrorMessage } from "@/utils/apiError";

import {
  useGetExpenseCategoriesQuery,
  useDeleteExpenseCategoryMutation,
  useRestoreExpenseCategoryMutation,
} from "../../features/expense/expenseCategoryApi";

// =====================================================
// STATUS OPTIONS
// =====================================================

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

// =====================================================
// EXPENSE CATEGORY PAGE
// =====================================================

export default function ExpenseCategory() {
  const navigate = useNavigate();
  const { can } = usePermissions();

  // ===================================================
  // FILTERS
  // ===================================================

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // ===================================================
  // MODALS
  // ===================================================

  const [deleting, setDeleting] = useState(null);
  const [restoring, setRestoring] = useState(null);

  // ===================================================
  // API
  // ===================================================

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGetExpenseCategoriesQuery({
    search: search.trim() || undefined,
    isActive: statusFilter || undefined,
  });

  const [deleteCategory, { isLoading: isDeleting }] =
    useDeleteExpenseCategoryMutation();

  const [restoreCategory, { isLoading: isRestoring }] =
    useRestoreExpenseCategoryMutation();

  // ===================================================
  // EXTRACT LIST
  // ===================================================

  const categories = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.categories)) return data.categories;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }, [data]);

  // ===================================================
  // CLIENT-SIDE SAFETY FILTER (search already sent to API)
  // ===================================================

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase().trim();

    return categories.filter((cat) => {
      const matchesSearch =
        !q ||
        cat.name?.toLowerCase().includes(q) ||
        cat.slug?.toLowerCase().includes(q) ||
        cat.description?.toLowerCase().includes(q);

      const matchesStatus =
        !statusFilter ||
        String(cat.isActive) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  // ===================================================
  // ACTIONS
  // ===================================================

  const openCreate = () => {
    if (!can("expense-categories.create")) {
      toast.error("You do not have permission to create expense categories.");
      return;
    }
    navigate("/expense-categories/create");
  };

  const openEdit = (category) => {
    if (!category?._id) return;
    if (!can("expense-categories.update")) {
      toast.error("You do not have permission to update expense categories.");
      return;
    }
    navigate(`/expense-categories/${category._id}/edit`);
  };

  const openView = (category) => {
    if (!category?._id) return;
    navigate(`/expense-categories/${category._id}`);
  };

  const openDelete = (category) => {
    if (!category?._id) return;
    if (!can("expense-categories.delete")) {
      toast.error("You do not have permission to delete expense categories.");
      return;
    }
    setDeleting(category);
  };

  const openRestore = (category) => {
    if (!category?._id) return;
    if (!can("expense-categories.update")) {
      toast.error("You do not have permission to restore expense categories.");
      return;
    }
    setRestoring(category);
  };

  // ===================================================
  // HANDLERS
  // ===================================================

  const handleDelete = async () => {
    if (!deleting?._id) return;

    try {
      const response = await deleteCategory(deleting._id).unwrap();
      toast.success(
        response?.message || "Expense category deleted successfully"
      );
      setDeleting(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleRestore = async () => {
    if (!restoring?._id) return;

    try {
      const response = await restoreCategory(restoring._id).unwrap();
      toast.success(
        response?.message || "Expense category restored successfully"
      );
      setRestoring(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  // ===================================================
  // COLUMNS
  // ===================================================

  const columns = [
    {
      key: "name",
      header: "Category",
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-primary">
            {row.name || "—"}
          </p>
          {row.slug && (
            <p className="truncate text-xs text-secondary">{row.slug}</p>
          )}
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (row) => (
        <span className="line-clamp-2 max-w-xs text-secondary">
          {row.description || "—"}
        </span>
      ),
    },
    {
      key: "business",
      header: "Business",
      render: (row) => row.business?.name || "—",
    },
    {
      key: "isActive",
      header: "Status",
      render: (row) =>
        row.isActive ? (
          <Badge tone="success">Active</Badge>
        ) : (
          <Badge tone="danger">Inactive</Badge>
        ),
    },
    {
      key: "createdBy",
      header: "Created By",
      render: (row) => row.createdBy?.name || "—",
    },
  ];

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="space-y-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <PageHeader
        title="Expense Categories"
        description="Manage expense categories used across your business expenses."
        actions={
          can("expense-categories.create") && (
            <Button icon={Plus} onClick={openCreate}>
              New Category
            </Button>
          )
        }
      />

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search categories by name, slug or description..."
          />
        </div>

        <Select
          options={statusOptions}
          value={statusFilter}
          placeholder="All statuses"
          onChange={(e) => setStatusFilter(e.target.value)}
          className="sm:w-48"
        />
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      {isLoading ? (
        <TableSkeleton cols={5} />
      ) : isError ? (
        <ErrorState
          onRetry={refetch}
          description="Unable to load expense categories."
        />
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No expense categories found"
          description={
            search || statusFilter
              ? "No categories match your current filters."
              : "You have not created any expense categories yet."
          }
          actionLabel={
            !search &&
            !statusFilter &&
            can("expense-categories.create")
              ? "New Category"
              : undefined
          }
          onAction={
            !search &&
            !statusFilter &&
            can("expense-categories.create")
              ? openCreate
              : undefined
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredCategories}
          actions={(row) => (
            <div className="flex justify-end gap-1">
              {/* VIEW */}
              <button
                type="button"
                aria-label={`View ${row.name}`}
                title="View category"
                onClick={() => openView(row)}
                className="rounded-lg p-1.5 text-secondary transition hover:bg-muted-action hover:text-primary"
              >
                <Eye className="h-4 w-4" />
              </button>

              {/* EDIT */}
              {can("expense-categories.update") && (
                <button
                  type="button"
                  aria-label={`Edit ${row.name}`}
                  title="Edit category"
                  onClick={() => openEdit(row)}
                  className="rounded-lg p-1.5 text-secondary transition hover:bg-muted-action hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}

              {/* RESTORE */}
              {!row.isActive && can("expense-categories.update") && (
                <button
                  type="button"
                  aria-label={`Restore ${row.name}`}
                  title="Restore category"
                  onClick={() => openRestore(row)}
                  className="rounded-lg p-1.5 text-secondary transition hover:bg-green-500/10 hover:text-green-600"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}

              {/* DELETE (soft) */}
              {row.isActive && can("expense-categories.delete") && (
                <button
                  type="button"
                  aria-label={`Delete ${row.name}`}
                  title="Delete category"
                  onClick={() => openDelete(row)}
                  className="rounded-lg p-1.5 text-secondary transition hover:bg-red-500/10 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        />
      )}

      {/* Fetching indicator */}
      {isFetching && !isLoading && (
        <p className="text-xs text-secondary">Updating categories…</p>
      )}

      {/* =================================================
          DELETE CONFIRM
      ================================================= */}

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Delete expense category?"
        description={
          deleting
            ? `This will deactivate "${deleting.name}". Existing expenses that use this category will remain valid.`
            : "This action cannot be undone."
        }
      />

      {/* =================================================
          RESTORE CONFIRM
      ================================================= */}

      <ConfirmModal
        open={Boolean(restoring)}
        onClose={() => setRestoring(null)}
        onConfirm={handleRestore}
        loading={isRestoring}
        title="Restore expense category?"
        description={
          restoring
            ? `This will reactivate "${restoring.name}".`
            : "Are you sure you want to restore this category?"
        }
      />
    </div>
  );
}