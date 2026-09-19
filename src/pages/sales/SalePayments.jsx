
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
  Eye,
  Pencil,
  Trash2,
  Ban,
  CreditCard,
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
  useGetAllSalePaymentsQuery,
  useGetSalePaymentByIdQuery,
  useUpdateSalePaymentMutation,
  useCancelSalePaymentMutation,
  useDeleteSalePaymentMutation,
} from "@/features/sales/salePaymentApi";

// ======================================================
// PAYMENT METHODS
// ======================================================

const paymentMethodOptions = [
  {
    value: "",
    label: "All Methods",
  },
  {
    value: "cash",
    label: "Cash",
  },
  {
    value: "bank",
    label: "Bank",
  },
  {
    value: "card",
    label: "Card",
  },
  {
    value: "cheque",
    label: "Cheque",
  },
  {
    value: "credit",
    label: "Credit",
  },
  {
    value: "other",
    label: "Other",
  },
];

// ======================================================
// PAYMENT STATUS
// ======================================================

const paymentStatusOptions = [
  {
    value: "",
    label: "All Statuses",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "failed",
    label: "Failed",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

// ======================================================
// HELPERS
// ======================================================

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatLabel = (value) => {
  if (!value) return "—";

  return String(value)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};

const getSaleNumber = (payment) => {
  if (payment?.sale?.saleNumber) {
    return payment.sale.saleNumber;
  }

  if (payment?.saleNumber) {
    return payment.saleNumber;
  }

  if (typeof payment?.sale === "string") {
    return payment.sale.slice(-8);
  }

  return "—";
};

const getCustomerName = (payment) => {
  if (payment?.customer?.name) {
    return payment.customer.name;
  }

  if (payment?.sale?.customer?.name) {
    return payment.sale.customer.name;
  }

  return "Walk-in Customer";
};

const getMethodBadge = (method) => {
  const tones = {
    cash: "success",
    bank: "brand",
    card: "brand",
    cheque: "warning",
    credit: "warning",
    other: "brand",
  };

  return tones[method] || "brand";
};

const getStatusBadge = (status) => {
  const tones = {
    completed: "success",
    pending: "warning",
    failed: "danger",
    cancelled: "danger",
  };

  return tones[status] || "brand";
};

const normalizePayments = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.payments)) {
    return data.payments;
  }

  if (Array.isArray(data?.salePayments)) {
    return data.salePayments;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.data?.payments)) {
    return data.data.payments;
  }

  if (Array.isArray(data?.data?.salePayments)) {
    return data.data.salePayments;
  }

  return [];
};

const getPaymentFromResponse = (data) => {
  if (!data) return null;

  if (data?.payment) {
    return data.payment;
  }

  if (data?.salePayment) {
    return data.salePayment;
  }

  if (data?.data?.payment) {
    return data.data.payment;
  }

  if (data?.data?.salePayment) {
    return data.data.salePayment;
  }

  if (data?.data && !Array.isArray(data.data)) {
    return data.data;
  }

  return data;
};

// ======================================================
// SALE PAYMENTS PAGE
// ======================================================

export default function SalePayments() {
  const { can } = usePermissions();

  // ====================================================
  // FILTERS
  // ====================================================

  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState("");
  const [status, setStatus] = useState("");

  // ====================================================
  // MODALS
  // ====================================================

  const [viewingPayment, setViewingPayment] =
    useState(null);

  const [editingPayment, setEditingPayment] =
    useState(null);

  const [cancellingPayment, setCancellingPayment] =
    useState(null);

  const [deletingPayment, setDeletingPayment] =
    useState(null);

  // ====================================================
  // PERMISSIONS
  // ====================================================

  const canRead = can("sale-payments.read");
  const canUpdate = can("sale-payments.update");
  const canDelete = can("sale-payments.delete");

  // ====================================================
  // GET PAYMENTS
  // ====================================================

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAllSalePaymentsQuery(
    {
      search: search.trim() || undefined,
      paymentMethod:
        paymentMethod || undefined,
      status: status || undefined,
      page: 1,
      limit: 100,
    },
    {
      skip: !canRead,
    }
  );

  // ====================================================
  // GET PAYMENT DETAILS
  // ====================================================

  const {
    data: paymentDetailsData,
    isLoading: paymentDetailsLoading,
  } = useGetSalePaymentByIdQuery(
    viewingPayment?._id,
    {
      skip: !viewingPayment?._id,
    }
  );

  // ====================================================
  // MUTATIONS
  // ====================================================

  const [
    updateSalePayment,
    { isLoading: isUpdating },
  ] = useUpdateSalePaymentMutation();

  const [
    cancelSalePayment,
    { isLoading: isCancelling },
  ] = useCancelSalePaymentMutation();

  const [
    deleteSalePayment,
    { isLoading: isDeleting },
  ] = useDeleteSalePaymentMutation();

  // ====================================================
  // EXTRACT PAYMENTS
  // ====================================================

  const payments = useMemo(() => {
    return normalizePayments(data);
  }, [data]);

  // ====================================================
  // CLIENT SIDE FILTER
  // ====================================================

  const filteredPayments = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return payments.filter((payment) => {
      const method =
        payment?.paymentMethod
          ?.toLowerCase() || "";

      const paymentStatus =
        payment?.status?.toLowerCase() || "";

      const paymentNumber =
        payment?.paymentNumber
          ?.toLowerCase() || "";

      const saleNumber =
        getSaleNumber(payment)
          .toLowerCase();

      const customer =
        getCustomerName(payment)
          .toLowerCase();

      const reference =
        payment?.reference
          ?.toLowerCase() || "";

      const matchesSearch =
        !searchValue ||
        paymentNumber.includes(searchValue) ||
        saleNumber.includes(searchValue) ||
        customer.includes(searchValue) ||
        reference.includes(searchValue);

      const matchesMethod =
        !paymentMethod ||
        method === paymentMethod;

      const matchesStatus =
        !status ||
        paymentStatus === status;

      return (
        matchesSearch &&
        matchesMethod &&
        matchesStatus
      );
    });
  }, [
    payments,
    search,
    paymentMethod,
    status,
  ]);

  // ====================================================
  // UPDATE PAYMENT
  // ====================================================

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!editingPayment?._id) {
      return;
    }

    const formData =
      new FormData(event.currentTarget);

    const amount = Number(
      formData.get("amount")
    );

    const method =
      formData.get("paymentMethod");

    const reference =
      formData.get("reference")?.trim();

    const notes =
      formData.get("notes")?.trim();

    if (!amount || amount <= 0) {
      toast.error(
        "Please enter a valid payment amount."
      );
      return;
    }

    try {
      const response =
        await updateSalePayment({
          id: editingPayment._id,
          amount,
          paymentMethod: method,
          reference: reference || null,
          notes: notes || null,
        }).unwrap();

      toast.success(
        response?.message ||
          "Payment updated successfully."
      );

      setEditingPayment(null);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error)
      );
    }
  };

  // ====================================================
  // CANCEL PAYMENT
  // ====================================================

  const handleCancel = async () => {
    if (!cancellingPayment?._id) {
      return;
    }

    try {
      const response =
        await cancelSalePayment(
          cancellingPayment._id
        ).unwrap();

      toast.success(
        response?.message ||
          "Payment cancelled successfully."
      );

      setCancellingPayment(null);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error)
      );
    }
  };

  // ====================================================
  // DELETE PAYMENT
  // ====================================================

  const handleDelete = async () => {
    if (!deletingPayment?._id) {
      return;
    }

    try {
      const response =
        await deleteSalePayment(
          deletingPayment._id
        ).unwrap();

      toast.success(
        response?.message ||
          "Payment deleted successfully."
      );

      setDeletingPayment(null);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error)
      );
    }
  };

  // ====================================================
  // TABLE COLUMNS
  // ====================================================

  const columns = [
    {
      key: "paymentNumber",
      header: "Payment",
      render: (row) => (
        <div>
          <p className="font-medium text-primary">
            {row.paymentNumber || "—"}
          </p>

          <p className="text-xs text-secondary">
            {formatDate(
              row.paymentDate ||
                row.createdAt
            )}
          </p>
        </div>
      ),
    },

    {
      key: "sale",
      header: "Sale",
      render: (row) => (
        <span className="font-medium text-primary">
          {getSaleNumber(row)}
        </span>
      ),
    },

    {
      key: "customer",
      header: "Customer",
      render: (row) => (
        <span className="text-primary">
          {getCustomerName(row)}
        </span>
      ),
    },

    {
      key: "amount",
      header: "Amount",
      render: (row) => (
        <span className="font-semibold text-primary">
          {formatMoney(row.amount)}
        </span>
      ),
    },

    {
      key: "paymentMethod",
      header: "Method",
      render: (row) => {
        const method =
          row?.paymentMethod?.toLowerCase();

        return (
          <Badge
            tone={getMethodBadge(method)}
          >
            {formatLabel(method)}
          </Badge>
        );
      },
    },

    {
      key: "status",
      header: "Status",
      render: (row) => {
        const paymentStatus =
          row?.status?.toLowerCase();

        return (
          <Badge
            tone={getStatusBadge(
              paymentStatus
            )}
          >
            {formatLabel(paymentStatus)}
          </Badge>
        );
      },
    },
  ];

  // ====================================================
  // ACCESS DENIED
  // ====================================================

  if (!canRead) {
    return (
      <ErrorState
        description="You do not have permission to view sale payments."
      />
    );
  }

  // ====================================================
  // PAGE
  // ====================================================

  return (
    <div className="space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <PageHeader
        title="Sale Payments"
        description="View and manage payments recorded against sales."
      />

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

        <div className="min-w-0 flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search payment, sale, customer or reference..."
          />
        </div>

        <Select
          options={paymentMethodOptions}
          value={paymentMethod}
          placeholder="All methods"
          onChange={(e) =>
            setPaymentMethod(
              e.target.value
            )
          }
          className="sm:w-48"
        />

        <Select
          options={paymentStatusOptions}
          value={status}
          placeholder="All statuses"
          onChange={(e) =>
            setStatus(e.target.value)
          }
          className="sm:w-48"
        />
      </div>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-border bg-background p-5">
          <p className="text-sm text-muted-foreground">
            Total Payments
          </p>

          <h3 className="mt-2 text-2xl font-bold text-primary">
            {payments.length}
          </h3>
        </div>

        <div className="rounded-xl border border-border bg-background p-5">
          <p className="text-sm text-muted-foreground">
            Completed Payments
          </p>

          <h3 className="mt-2 text-2xl font-bold text-primary">
            {
              payments.filter(
                (payment) =>
                  payment?.status ===
                  "completed"
              ).length
            }
          </h3>
        </div>

        <div className="rounded-xl border border-border bg-background p-5">
          <p className="text-sm text-muted-foreground">
            Completed Amount
          </p>

          <h3 className="mt-2 text-2xl font-bold text-primary">
            {formatMoney(
              payments
                .filter(
                  (payment) =>
                    payment?.status ===
                    "completed"
                )
                .reduce(
                  (total, payment) =>
                    total +
                    Number(
                      payment?.amount || 0
                    ),
                  0
                )
            )}
          </h3>
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
          description={
            getApiErrorMessage(error) ||
            "Unable to load sale payments."
          }
        />
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments found"
          description={
            search ||
            paymentMethod ||
            status
              ? "No payments match your current filters."
              : "No sale payments have been recorded yet."
          }
        />
      ) : (
        <div className="rounded-xl border border-border bg-background">

          <DataTable
            columns={columns}
            data={filteredPayments}
            actions={(row) => {
              const paymentStatus =
                row?.status?.toLowerCase();

              return (
                <div className="flex justify-end gap-1">

                  {/* VIEW */}

                  <button
                    type="button"
                    aria-label={`View ${row.paymentNumber}`}
                    title="View payment"
                    onClick={() =>
                      setViewingPayment(row)
                    }
                    className="rounded-lg p-1.5 text-secondary transition hover:bg-muted-action hover:text-primary"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  {/* EDIT */}

                  {canUpdate &&
                    paymentStatus !==
                      "cancelled" && (
                      <button
                        type="button"
                        aria-label={`Edit ${row.paymentNumber}`}
                        title="Edit payment"
                        onClick={() =>
                          setEditingPayment(
                            row
                          )
                        }
                        className="rounded-lg p-1.5 text-secondary transition hover:bg-muted-action hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}

                  {/* CANCEL */}

                  {canUpdate &&
                    paymentStatus !==
                      "cancelled" && (
                      <button
                        type="button"
                        aria-label={`Cancel ${row.paymentNumber}`}
                        title="Cancel payment"
                        onClick={() =>
                          setCancellingPayment(
                            row
                          )
                        }
                        className="rounded-lg p-1.5 text-secondary transition hover:bg-orange-500/10 hover:text-orange-600"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    )}

                  {/* DELETE */}

                  {canDelete && (
                    <button
                      type="button"
                      aria-label={`Delete ${row.paymentNumber}`}
                      title="Delete payment"
                      onClick={() =>
                        setDeletingPayment(
                          row
                        )
                      }
                      className="rounded-lg p-1.5 text-secondary transition hover:bg-red-500/10 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}

                </div>
              );
            }}
          />

          {isFetching &&
            !isLoading && (
              <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
                Updating payments...
              </div>
            )}

        </div>
      )}

      {/* =================================================
          VIEW PAYMENT
      ================================================= */}

      {viewingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-2xl rounded-xl border border-border bg-background shadow-xl">

            <div className="flex items-center justify-between border-b border-border px-5 py-4">

              <div>
                <h2 className="text-lg font-semibold text-primary">
                  Payment Details
                </h2>

                <p className="text-sm text-secondary">
                  {viewingPayment.paymentNumber ||
                    "Payment"}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewingPayment(null)
                }
                className="rounded-lg p-2 text-secondary hover:bg-muted-action hover:text-primary"
              >
                ×
              </button>

            </div>

            <div className="p-5">

              {paymentDetailsLoading ? (
                <div className="py-10 text-center text-secondary">
                  Loading payment details...
                </div>
              ) : (
                (() => {
                  const payment =
                    getPaymentFromResponse(
                      paymentDetailsData
                    ) ||
                    viewingPayment;

                  return (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                      <Detail
                        label="Payment Number"
                        value={
                          payment?.paymentNumber
                        }
                      />

                      <Detail
                        label="Sale"
                        value={getSaleNumber(
                          payment
                        )}
                      />

                      <Detail
                        label="Customer"
                        value={getCustomerName(
                          payment
                        )}
                      />

                      <Detail
                        label="Amount"
                        value={formatMoney(
                          payment?.amount
                        )}
                      />

                      <Detail
                        label="Currency"
                        value={
                          payment?.currency ||
                          "PKR"
                        }
                      />

                      <Detail
                        label="Payment Method"
                        value={formatLabel(
                          payment?.paymentMethod
                        )}
                      />

                      <Detail
                        label="Gateway"
                        value={formatLabel(
                          payment?.gateway
                        )}
                      />

                      <Detail
                        label="Status"
                        value={formatLabel(
                          payment?.status
                        )}
                      />

                      <Detail
                        label="Reference"
                        value={
                          payment?.reference ||
                          payment?.transactionId
                        }
                      />

                      <Detail
                        label="Payment Date"
                        value={formatDate(
                          payment?.paymentDate ||
                            payment?.createdAt
                        )}
                      />

                      {payment?.notes && (
                        <div className="sm:col-span-2">
                          <Detail
                            label="Notes"
                            value={
                              payment.notes
                            }
                          />
                        </div>
                      )}

                    </div>
                  );
                })()
              )}

            </div>

            <div className="flex justify-end border-t border-border px-5 py-4">

              <Button
                onClick={() =>
                  setViewingPayment(null)
                }
              >
                Close
              </Button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          EDIT PAYMENT
      ================================================= */}

      <div>
        {editingPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="w-full max-w-lg rounded-xl border border-border bg-background shadow-xl">

              <form
                onSubmit={handleUpdate}
              >

                <div className="flex items-center justify-between border-b border-border px-5 py-4">

                  <div>
                    <h2 className="text-lg font-semibold text-primary">
                      Edit Payment
                    </h2>

                    <p className="text-sm text-secondary">
                      {
                        editingPayment.paymentNumber
                      }
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingPayment(
                        null
                      )
                    }
                    className="rounded-lg p-2 text-secondary hover:bg-muted-action hover:text-primary"
                  >
                    ×
                  </button>

                </div>

                <div className="space-y-4 p-5">

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-primary">
                      Amount
                    </label>

                    <input
                      name="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      defaultValue={
                        editingPayment.amount
                      }
                      required
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-primary outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-primary">
                      Payment Method
                    </label>

                    <select
                      name="paymentMethod"
                      defaultValue={
                        editingPayment.paymentMethod
                      }
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-primary outline-none focus:border-primary"
                    >
                      {paymentMethodOptions
                        .filter(
                          (option) =>
                            option.value
                        )
                        .map(
                          (option) => (
                            <option
                              key={
                                option.value
                              }
                              value={
                                option.value
                              }
                            >
                              {
                                option.label
                              }
                            </option>
                          )
                        )}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-primary">
                      Reference
                    </label>

                    <input
                      name="reference"
                      type="text"
                      defaultValue={
                        editingPayment.reference ||
                        editingPayment.transactionId ||
                        ""
                      }
                      placeholder="Transaction/reference number"
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-primary outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-primary">
                      Notes
                    </label>

                    <textarea
                      name="notes"
                      rows="3"
                      defaultValue={
                        editingPayment.notes ||
                        ""
                      }
                      placeholder="Optional notes"
                      className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-primary outline-none focus:border-primary"
                    />
                  </div>

                </div>

                <div className="flex justify-end gap-3 border-t border-border px-5 py-4">

                  <Button
                    type="button"
                    onClick={() =>
                      setEditingPayment(
                        null
                      )
                    }
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={isUpdating}
                  >
                    {isUpdating
                      ? "Updating..."
                      : "Update Payment"}
                  </Button>

                </div>

              </form>

            </div>

          </div>
        )}
      </div>

      {/* =================================================
          CANCEL PAYMENT
      ================================================= */}

      <ConfirmModal
        open={Boolean(
          cancellingPayment
        )}
        onClose={() =>
          setCancellingPayment(null)
        }
        onConfirm={handleCancel}
        loading={isCancelling}
        title="Cancel Payment"
        description={
          cancellingPayment
            ? `Are you sure you want to cancel payment "${cancellingPayment.paymentNumber || ""}"? The related sale payment totals will be recalculated.`
            : "Are you sure you want to cancel this payment?"
        }
        confirmText={
          isCancelling
            ? "Cancelling..."
            : "Cancel Payment"
        }
        danger
      />

      {/* =================================================
          DELETE PAYMENT
      ================================================= */}

      <ConfirmModal
        open={Boolean(
          deletingPayment
        )}
        onClose={() =>
          setDeletingPayment(null)
        }
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Delete Payment"
        description={
          deletingPayment
            ? `Are you sure you want to delete payment "${deletingPayment.paymentNumber || ""}"?`
            : "Are you sure you want to delete this payment?"
        }
        confirmText={
          isDeleting
            ? "Deleting..."
            : "Delete"
        }
        danger
      />

    </div>
  );
}

// ======================================================
// DETAIL COMPONENT
// ======================================================

function Detail({ label, value }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs text-secondary">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-primary">
        {value || "—"}
      </p>
    </div>
  );
}
