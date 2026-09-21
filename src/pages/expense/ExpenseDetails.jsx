import { useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";

import {
  ArrowLeft,
  Pencil,
  Ban,
  RotateCcw,
  Trash2,
  Receipt,
  Banknote,
  CalendarDays,
  CreditCard,
  FileText,
  User,
  Building2,
  Hash,
  StickyNote,
  Loader2,
} from "lucide-react";

import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ConfirmModal from "@/components/modals/ConfirmModal";
import ErrorState from "@/components/common/ErrorState";

import { usePermissions } from "@/hooks/usePermissions";
import { getApiErrorMessage } from "@/utils/apiError";

import {
  useGetExpenseByIdQuery,
  useCancelExpenseMutation,
  useRestoreExpenseMutation,
  useDeleteExpenseMutation,
} from "../../features/expense/expenseApi";

import { useState } from "react";

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

const formatDateTime = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

// =====================================================
// STATUS BADGE
// =====================================================

const StatusBadge = ({ status }) => {
  if (status === "paid") {
    return <Badge tone="success">Paid</Badge>;
  }
  if (status === "draft") {
    return <Badge tone="warning">Draft</Badge>;
  }
  if (status === "cancelled") {
    return <Badge tone="danger">Cancelled</Badge>;
  }
  return <Badge tone="brand">{status || "—"}</Badge>;
};

// =====================================================
// INFO ROW
// =====================================================

const InfoRow = ({ icon: Icon, label, value, children }) => (
  <div className="flex items-start gap-3 py-3">
    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted-action text-secondary">
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium uppercase tracking-wide text-secondary">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-primary">
        {children || value || "—"}
      </div>
    </div>
  </div>
);

// =====================================================
// EXPENSE DETAILS PAGE
// =====================================================

export default function ExpenseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();

  // ===================================================
  // MODALS
  // ===================================================

  const [cancelling, setCancelling] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ===================================================
  // API
  // ===================================================

  const {
    data: expense,
    isLoading,
    isError,
    refetch,
  } = useGetExpenseByIdQuery(id, {
    skip: !id,
  });

  const [cancelExpense, { isLoading: isCancelling }] =
    useCancelExpenseMutation();

  const [restoreExpense, { isLoading: isRestoring }] =
    useRestoreExpenseMutation();

  const [deleteExpense, { isLoading: isDeleting }] =
    useDeleteExpenseMutation();

  // ===================================================
  // DERIVED
  // ===================================================

  const isCancelled = expense?.status === "cancelled";
  const isCash = expense?.paymentMethod === "cash";

  // ===================================================
  // HANDLERS
  // ===================================================

  const handleCancel = async () => {
    try {
      const response = await cancelExpense(id).unwrap();
      toast.success(response?.message || "Expense cancelled successfully");
      setCancelling(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleRestore = async () => {
    try {
      const response = await restoreExpense(id).unwrap();
      toast.success(response?.message || "Expense restored successfully");
      setRestoring(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    try {
      const response = await deleteExpense(id).unwrap();
      toast.success(response?.message || "Expense cancelled successfully");
      setDeleting(false);
      navigate("/expense");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Expense Details" />
        <div className="flex items-center justify-center rounded-xl border border-primary bg-card py-20">
          <div className="flex items-center gap-3 text-secondary">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading expense…</span>
          </div>
        </div>
      </div>
    );
  }

  // ===================================================
  // ERROR
  // ===================================================

  if (isError || !expense) {
    return (
      <div className="space-y-6">
        <PageHeader title="Expense Details" />
        <ErrorState
          onRetry={refetch}
          description="Unable to load this expense. It may have been deleted or you do not have access."
        />
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => navigate("/expense")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Expenses
          </Button>
        </div>
      </div>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="space-y-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <PageHeader
        title={expense.title || "Expense Details"}
        description={`Expense # ${expense.expenseNumber || "—"}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate("/expense")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {/* EDIT */}
            {!isCancelled && can("expenses.update") && (
              <Button
                variant="secondary"
                onClick={() => navigate(`/expenses/${id}/edit`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}

            {/* CANCEL */}
            {!isCancelled && can("expenses.update") && (
              <Button
                variant="secondary"
                onClick={() => setCancelling(true)}
                className="text-orange-600 hover:bg-orange-500/10"
              >
                <Ban className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}

            {/* RESTORE */}
            {isCancelled && can("expenses.update") && (
              <Button
                variant="secondary"
                onClick={() => setRestoring(true)}
                className="text-green-600 hover:bg-green-500/10"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Restore
              </Button>
            )}

            {/* DELETE */}
            {!isCancelled && can("expenses.delete") && (
              <Button
                variant="secondary"
                onClick={() => setDeleting(true)}
                className="text-red-600 hover:bg-red-500/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        }
      />

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <div className="grid gap-6 lg:grid-cols-3">

        {/* LEFT – PRIMARY INFO */}
        <div className="space-y-6 lg:col-span-2">

          {/* Amount + Status Card */}
          <div className="rounded-xl border border-primary bg-card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-secondary">Amount</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-primary">
                  {formatCurrency(expense.amount)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={expense.status} />

                {isCash && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <Banknote className="h-3.5 w-3.5" />
                    Cash · affects register
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="rounded-xl border border-primary bg-card p-6">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-primary">
              <Receipt className="h-5 w-5 text-secondary" />
              Expense Information
            </h3>

            <div className="divide-y divide-border-soft">
              <InfoRow
                icon={Hash}
                label="Expense Number"
                value={expense.expenseNumber}
              />

              <InfoRow
                icon={FileText}
                label="Title"
                value={expense.title}
              />

              <InfoRow
                icon={CalendarDays}
                label="Expense Date"
                value={formatDate(expense.expenseDate)}
              />

              <InfoRow
                icon={CreditCard}
                label="Payment Method"
              >
                <span className="capitalize">{expense.paymentMethod || "—"}</span>
              </InfoRow>

              {expense.referenceNumber && (
                <InfoRow
                  icon={Hash}
                  label="Reference Number"
                  value={expense.referenceNumber}
                />
              )}

              <InfoRow
                icon={Building2}
                label="Category"
                value={expense.expenseCategory?.name || "—"}
              />

              {expense.description && (
                <InfoRow
                  icon={FileText}
                  label="Description"
                  value={expense.description}
                />
              )}

              {expense.notes && (
                <InfoRow
                  icon={StickyNote}
                  label="Notes"
                  value={expense.notes}
                />
              )}
            </div>
          </div>

          {/* Receipt (if exists) */}
          {expense.receipt?.url && (
            <div className="rounded-xl border border-primary bg-card p-6">
              <h3 className="mb-4 text-base font-semibold text-primary">
                Receipt
              </h3>
              <a
                href={expense.receipt.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
              >
                View / Download Receipt
              </a>
            </div>
          )}
        </div>

        {/* RIGHT – META */}
        <div className="space-y-6">

          {/* Audit Card */}
          <div className="rounded-xl border border-primary bg-card p-6">
            <h3 className="mb-4 text-base font-semibold text-primary">
              Audit
            </h3>

            <div className="divide-y divide-border-soft">
              <InfoRow
                icon={User}
                label="Created By"
                value={expense.createdBy?.name || "—"}
              />

              {expense.createdBy?.email && (
                <InfoRow
                  icon={User}
                  label="Creator Email"
                  value={expense.createdBy.email}
                />
              )}

              <InfoRow
                icon={CalendarDays}
                label="Created At"
                value={formatDateTime(expense.createdAt)}
              />

              {expense.updatedBy && (
                <InfoRow
                  icon={User}
                  label="Last Updated By"
                  value={expense.updatedBy?.name || "—"}
                />
              )}

              {expense.updatedAt && (
                <InfoRow
                  icon={CalendarDays}
                  label="Last Updated"
                  value={formatDateTime(expense.updatedAt)}
                />
              )}
            </div>
          </div>

          {/* Cash Register Impact Card */}
          {isCash && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <div className="flex items-start gap-3">
                <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                    Cash Register Impact
                  </p>
                  <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
                    {isCancelled
                      ? "This cash expense is cancelled and is no longer included in the open cash register totals."
                      : "This cash expense is included in the open cash register’s Cash Expenses total."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions (mobile friendly) */}
          <div className="rounded-xl border border-primary bg-card p-5 lg:hidden">
            <p className="mb-3 text-sm font-medium text-secondary">
              Quick Actions
            </p>
            <div className="flex flex-col gap-2">
              {!isCancelled && can("expenses.update") && (
                <Button
                  className="w-full justify-center"
                  onClick={() => navigate(`/expenses/${id}/edit`)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Expense
                </Button>
              )}
              <Button
                variant="secondary"
                className="w-full justify-center"
                onClick={() => navigate("/expense")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to List
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          MODALS
      ================================================= */}

      <ConfirmModal
        open={cancelling}
        onClose={() => setCancelling(false)}
        onConfirm={handleCancel}
        loading={isCancelling}
        title="Cancel expense?"
        description={
          `This will mark "${expense.title}" (${expense.expenseNumber}) as cancelled.` +
          (isCash
            ? " It will no longer affect the open cash register."
            : "")
        }
      />

      <ConfirmModal
        open={restoring}
        onClose={() => setRestoring(false)}
        onConfirm={handleRestore}
        loading={isRestoring}
        title="Restore expense?"
        description={
          `This will restore "${expense.title}" to Paid status.` +
          (isCash
            ? " It will again be included in the open cash register."
            : "")
        }
      />

      <ConfirmModal
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Delete expense?"
        description={`This will cancel "${expense.title}". Accounting history is preserved.`}
      />
    </div>
  );
}