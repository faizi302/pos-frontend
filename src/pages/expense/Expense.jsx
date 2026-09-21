import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  RotateCcw,
  Ban,
  Receipt,
  Banknote,
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
  useGetExpensesQuery,
  useCancelExpenseMutation,
  useRestoreExpenseMutation,
  useDeleteExpenseMutation,
} from "../../features/expense/expenseApi";

import { useGetExpenseCategoriesQuery } from "../../features/expense/expenseCategoryApi";

// =====================================================
// HELPERS
// =====================================================

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// =====================================================
// OPTIONS
// =====================================================

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "paid", label: "Paid" },
  { value: "draft", label: "Draft" },
  { value: "cancelled", label: "Cancelled" },
];

const paymentMethodOptions = [
  { value: "", label: "All methods" },
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank" },
  { value: "card", label: "Card" },
  { value: "cheque", label: "Cheque" },
  { value: "online", label: "Online" },
  { value: "other", label: "Other" },
];

// =====================================================
// EXPENSE PAGE
// =====================================================

export default function Expense() {
  const navigate = useNavigate();
  const { can } = usePermissions();

  // ===================================================
  // FILTERS
  // ===================================================

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ===================================================
  // MODALS
  // ===================================================

  const [cancelling, setCancelling] = useState(null);
  const [restoring, setRestoring] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // ===================================================
  // API – EXPENSES
  // ===================================================

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGetExpensesQuery({
    search: search.trim() || undefined,
    status: statusFilter || undefined,
    paymentMethod: paymentMethodFilter || undefined,
    expenseCategory: categoryFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const [cancelExpense, { isLoading: isCancelling }] =
    useCancelExpenseMutation();

  const [restoreExpense, { isLoading: isRestoring }] =
    useRestoreExpenseMutation();

  const [deleteExpense, { isLoading: isDeleting }] =
    useDeleteExpenseMutation();

  // ===================================================
  // API – CATEGORIES (for filter dropdown)
  // ===================================================

  const { data: categoryData } = useGetExpenseCategoriesQuery({
    isActive: "true",
  });

  const categories = useMemo(() => {
    if (Array.isArray(categoryData)) return categoryData;
    if (Array.isArray(categoryData?.categories))
      return categoryData.categories;
    return [];
  }, [categoryData]);

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "All categories" },
      ...categories.map((c) => ({
        value: c._id,
        label: c.name,
      })),
    ],
    [categories]
  );

  // ===================================================
  // EXTRACT LIST
  // ===================================================

  const expenses = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.expenses)) return data.expenses;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }, [data]);

  // ===================================================
  // SUMMARY CARDS
  // ===================================================

  const summary = useMemo(() => {
    const paid = expenses.filter((e) => e.status === "paid");
    const cancelled = expenses.filter((e) => e.status === "cancelled");
    const cashPaid = paid.filter((e) => e.paymentMethod === "cash");

    return {
      total: expenses.length,
      paidCount: paid.length,
      cancelledCount: cancelled.length,
      totalAmount: paid.reduce((sum, e) => sum + Number(e.amount || 0), 0),
      cashAmount: cashPaid.reduce(
        (sum, e) => sum + Number(e.amount || 0),
        0
      ),
    };
  }, [expenses]);

  // ===================================================
  // ACTIONS
  // ===================================================

  const openCreate = () => {
    if (!can("expenses.create")) {
      toast.error("You do not have permission to create expenses.");
      return;
    }
    navigate("/expenses/create");
  };

  const openEdit = (expense) => {
    if (!expense?._id) return;
    if (expense.status === "cancelled") {
      toast.error("Cancelled expenses cannot be edited.");
      return;
    }
    if (!can("expenses.update")) {
      toast.error("You do not have permission to update expenses.");
      return;
    }
    navigate(`/expenses/${expense._id}/edit`);
  };

  const openView = (expense) => {
    if (!expense?._id) return;
    navigate(`/expenses/${expense._id}`);
  };

  const openCancel = (expense) => {
    if (!expense?._id) return;
    if (expense.status === "cancelled") return;
    if (!can("expenses.update")) {
      toast.error("You do not have permission to cancel expenses.");
      return;
    }
    setCancelling(expense);
  };

  const openRestore = (expense) => {
    if (!expense?._id) return;
    if (expense.status !== "cancelled") return;
    if (!can("expenses.update")) {
      toast.error("You do not have permission to restore expenses.");
      return;
    }
    setRestoring(expense);
  };

  const openDelete = (expense) => {
    if (!expense?._id) return;
    if (!can("expenses.delete")) {
      toast.error("You do not have permission to delete expenses.");
      return;
    }
    setDeleting(expense);
  };

  // ===================================================
  // HANDLERS
  // ===================================================

  const handleCancel = async () => {
    if (!cancelling?._id) return;

    try {
      const response = await cancelExpense(cancelling._id).unwrap();
      toast.success(
        response?.message || "Expense cancelled successfully"
      );
      setCancelling(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleRestore = async () => {
    if (!restoring?._id) return;

    try {
      const response = await restoreExpense(restoring._id).unwrap();
      toast.success(
        response?.message || "Expense restored successfully"
      );
      setRestoring(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!deleting?._id) return;

    try {
      // Backend soft-deletes by setting status = cancelled
      const response = await deleteExpense(deleting._id).unwrap();
      toast.success(
        response?.message || "Expense cancelled successfully"
      );
      setDeleting(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  // ===================================================
  // STATUS BADGE
  // ===================================================

  const renderStatus = (row) => {
    if (row.status === "paid") {
      return <Badge tone="success">Paid</Badge>;
    }
    if (row.status === "draft") {
      return <Badge tone="warning">Draft</Badge>;
    }
    if (row.status === "cancelled") {
      return <Badge tone="danger">Cancelled</Badge>;
    }
    return <Badge tone="brand">{row.status || "—"}</Badge>;
  };

  // ===================================================
  // COLUMNS
  // ===================================================

  const columns = [
    {
      key: "expenseNumber",
      header: "Expense #",
      render: (row) => (
        <span className="font-mono text-xs font-medium text-primary">
          {row.expenseNumber || "—"}
        </span>
      ),
    },
    {
      key: "title",
      header: "Title",
      render: (row) => (
        <div className="min-w-0 max-w-[220px]">
          <p className="truncate font-medium text-primary">
            {row.title || "—"}
          </p>
          {row.expenseCategory?.name && (
            <p className="truncate text-xs text-secondary">
              {row.expenseCategory.name}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "expenseDate",
      header: "Date",
      render: (row) => formatDate(row.expenseDate),
    },
    {
      key: "amount",
      header: "Amount",
      render: (row) => (
        <span className="font-semibold text-primary">
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: "paymentMethod",
      header: "Payment",
      render: (row) => {
        const method = row.paymentMethod || "—";
        const isCash = method === "cash";
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              isCash
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "bg-muted-action text-secondary"
            }`}
          >
            {isCash && <Banknote className="h-3.5 w-3.5" />}
            {method.charAt(0).toUpperCase() + method.slice(1)}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: renderStatus,
    },
    {
      key: "createdBy",
      header: "Created By",
      render: (row) => row.createdBy?.name || "—",
    },
  ];

  // ===================================================
  // CLEAR FILTERS
  // ===================================================

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPaymentMethodFilter("");
    setCategoryFilter("");
    setStartDate("");
    setEndDate("");
  };

  const hasFilters =
    search ||
    statusFilter ||
    paymentMethodFilter ||
    categoryFilter ||
    startDate ||
    endDate;

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="space-y-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <PageHeader
        title="Expenses"
        description="Track business expenses. Cash expenses automatically update the open cash register."
        actions={
          can("expenses.create") && (
            <Button icon={Plus} onClick={openCreate}>
              New Expense
            </Button>
          )
        }
      />

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-primary bg-card p-5">
          <p className="text-sm text-secondary">Total Expenses</p>
          <h3 className="mt-2 text-2xl font-bold text-primary">
            {summary.total}
          </h3>
        </div>

        <div className="rounded-xl border border-primary bg-card p-5">
          <p className="text-sm text-secondary">Paid Amount</p>
          <h3 className="mt-2 text-2xl font-bold text-primary">
            {formatCurrency(summary.totalAmount)}
          </h3>
        </div>

        <div className="rounded-xl border border-primary bg-card p-5">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-emerald-600" />
            <p className="text-sm text-secondary">Cash Expenses</p>
          </div>
          <h3 className="mt-2 text-2xl font-bold text-primary">
            {formatCurrency(summary.cashAmount)}
          </h3>
          <p className="mt-1 text-xs text-secondary">
            Affects open cash register
          </p>
        </div>

        <div className="rounded-xl border border-primary bg-card p-5">
          <p className="text-sm text-secondary">Cancelled</p>
          <h3 className="mt-2 text-2xl font-bold text-primary">
            {summary.cancelledCount}
          </h3>
        </div>
      </div>

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="rounded-xl border border-primary bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="min-w-0 flex-1 lg:max-w-xs">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search title, number, reference…"
            />
          </div>

          <Select
            options={statusOptions}
            value={statusFilter}
            placeholder="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
            className="lg:w-40"
          />

          <Select
            options={paymentMethodOptions}
            value={paymentMethodFilter}
            placeholder="Payment method"
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="lg:w-44"
          />

          <Select
            options={categoryOptions}
            value={categoryFilter}
            placeholder="Category"
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="lg:w-48"
          />

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10 rounded-lg border border-primary bg-card px-3 text-sm text-primary outline-none focus:border-brand"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-10 rounded-lg border border-primary bg-card px-3 text-sm text-primary outline-none focus:border-brand"
          />

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-10 rounded-lg border border-primary px-3 text-sm font-medium text-secondary transition hover:bg-muted-action"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* =================================================
          CONTENT
      ================================================= */}

      {isLoading ? (
        <TableSkeleton cols={7} />
      ) : isError ? (
        <ErrorState
          onRetry={refetch}
          description="Unable to load expenses."
        />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No expenses found"
          description={
            hasFilters
              ? "No expenses match your current filters."
              : "You have not recorded any expenses yet."
          }
          actionLabel={
            !hasFilters && can("expenses.create")
              ? "New Expense"
              : undefined
          }
          onAction={
            !hasFilters && can("expenses.create")
              ? openCreate
              : undefined
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={expenses}
          actions={(row) => (
            <div className="flex justify-end gap-1">
              {/* VIEW */}
              <button
                type="button"
                aria-label={`View ${row.title}`}
                title="View expense"
                onClick={() => openView(row)}
                className="rounded-lg p-1.5 text-secondary transition hover:bg-muted-action hover:text-primary"
              >
                <Eye className="h-4 w-4" />
              </button>

              {/* EDIT – only non-cancelled */}
              {row.status !== "cancelled" &&
                can("expenses.update") && (
                  <button
                    type="button"
                    aria-label={`Edit ${row.title}`}
                    title="Edit expense"
                    onClick={() => openEdit(row)}
                    className="rounded-lg p-1.5 text-secondary transition hover:bg-muted-action hover:text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}

              {/* CANCEL */}
              {row.status !== "cancelled" &&
                can("expenses.update") && (
                  <button
                    type="button"
                    aria-label={`Cancel ${row.title}`}
                    title="Cancel expense"
                    onClick={() => openCancel(row)}
                    className="rounded-lg p-1.5 text-secondary transition hover:bg-orange-500/10 hover:text-orange-600"
                  >
                    <Ban className="h-4 w-4" />
                  </button>
                )}

              {/* RESTORE */}
              {row.status === "cancelled" &&
                can("expenses.update") && (
                  <button
                    type="button"
                    aria-label={`Restore ${row.title}`}
                    title="Restore expense"
                    onClick={() => openRestore(row)}
                    className="rounded-lg p-1.5 text-secondary transition hover:bg-green-500/10 hover:text-green-600"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}

              {/* DELETE (soft → cancelled) */}
              {row.status !== "cancelled" &&
                can("expenses.delete") && (
                  <button
                    type="button"
                    aria-label={`Delete ${row.title}`}
                    title="Delete expense"
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

      {isFetching && !isLoading && (
        <p className="text-xs text-secondary">Updating expenses…</p>
      )}

      {/* =================================================
          CANCEL CONFIRM
      ================================================= */}

      <ConfirmModal
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        onConfirm={handleCancel}
        loading={isCancelling}
        title="Cancel expense?"
        description={
          cancelling
            ? `This will mark "${cancelling.title}" (${cancelling.expenseNumber}) as cancelled. If it was a cash expense it will no longer affect the open cash register.`
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
        title="Restore expense?"
        description={
          restoring
            ? `This will restore "${restoring.title}" to Paid status. Cash expenses will again be included in the open cash register.`
            : "Are you sure you want to restore this expense?"
        }
      />

      {/* =================================================
          DELETE CONFIRM (soft)
      ================================================= */}

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Delete expense?"
        description={
          deleting
            ? `This will cancel "${deleting.title}". Accounting history is preserved.`
            : "This action cannot be undone."
        }
      />
    </div>
  );
}