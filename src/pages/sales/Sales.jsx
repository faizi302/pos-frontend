import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
  Eye,
  RotateCcw,
  Trash2,
  ShoppingCart,
  X,
  Receipt,
} from "lucide-react";

import PageHeader from "@/components/common/PageHeader";
import SearchInput from "@/components/common/SearchInput";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/modals/ConfirmModal";
import DataTable from "@/components/tables/DataTable";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { TableSkeleton } from "@/components/common/LoadingSkeleton";

import { usePermissions } from "@/hooks/usePermissions";
import { getApiErrorMessage } from "@/utils/apiError";

import {
  useGetAllSalesQuery,
  useGetSaleByIdQuery,
  useCancelSaleMutation,
  useRestoreSaleMutation,
} from "../../features/sales/saleApi";

const PERMISSIONS = {
  CREATE: "sales.create",
  READ: "sales.read",
  UPDATE: "sales.update",
  DELETE: "sales.delete",
};

const formatMoney = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-PK")}`;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getCustomerName = (sale) => {
  if (!sale?.customer) return "Walk-in Customer";
  if (typeof sale.customer === "string") return sale.customer;
  return (
    sale.customer.name ||
    sale.customer.customerName ||
    "Walk-in Customer"
  );
};

const getSaleStatus = (sale) =>
  (sale?.status || sale?.saleStatus || "completed").toString().toLowerCase();

const getPaymentStatus = (sale) =>
  (sale?.paymentStatus || "unpaid").toString().toLowerCase();

const titleCase = (value = "") =>
  value
    .toString()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function Sales() {
  const { can } = usePermissions();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const [viewingSaleId, setViewingSaleId] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [restoring, setRestoring] = useState(null);

  const {
    data: saleResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAllSalesQuery({
    search: search.trim() || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    paymentStatus: paymentFilter === "all" ? undefined : paymentFilter,
    page: 1,
    limit: 100,
  });

  const {
    data: saleDetailResponse,
    isLoading: saleDetailLoading,
    isError: saleDetailError,
  } = useGetSaleByIdQuery(viewingSaleId, {
    skip: !viewingSaleId,
  });

  const [cancelSale, { isLoading: cancellingSale }] = useCancelSaleMutation();
  const [restoreSale, { isLoading: restoringSale }] = useRestoreSaleMutation();

  // -------------------------------------------------
  // Parse API response:
  // { success, message, data: { sales, pagination } }
  // -------------------------------------------------
  const sales = useMemo(() => {
    if (Array.isArray(saleResponse?.data?.sales)) {
      return saleResponse.data.sales;
    }
    if (Array.isArray(saleResponse?.sales)) {
      return saleResponse.sales;
    }
    if (Array.isArray(saleResponse?.data)) {
      return saleResponse.data;
    }
    if (Array.isArray(saleResponse)) {
      return saleResponse;
    }
    return [];
  }, [saleResponse]);

  const pagination =
    saleResponse?.data?.pagination || saleResponse?.pagination || null;

  const filteredSales = useMemo(() => {
    const term = search.toLowerCase().trim();

    return sales.filter((sale) => {
      const saleNumber = String(sale?.saleNumber || "").toLowerCase();
      const customerName = getCustomerName(sale).toLowerCase();
      const referenceNumber = String(sale?.referenceNumber || "").toLowerCase();
      const status = getSaleStatus(sale);
      const paymentStatus = getPaymentStatus(sale);

      const matchesSearch =
        !term ||
        saleNumber.includes(term) ||
        customerName.includes(term) ||
        referenceNumber.includes(term);

      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      const matchesPayment =
        paymentFilter === "all" || paymentStatus === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [sales, search, statusFilter, paymentFilter]);

  const detailSale = useMemo(() => {
    if (!saleDetailResponse) return null;

    // { data: { sale } } or { data: saleObject } or { sale }
    if (saleDetailResponse?.data?.sale) {
      return saleDetailResponse.data.sale;
    }
    if (saleDetailResponse?.sale) {
      return saleDetailResponse.sale;
    }
    if (
      saleDetailResponse?.data &&
      !Array.isArray(saleDetailResponse.data) &&
      (saleDetailResponse.data.saleNumber || saleDetailResponse.data._id)
    ) {
      return saleDetailResponse.data;
    }
    if (saleDetailResponse?.saleNumber || saleDetailResponse?._id) {
      return saleDetailResponse;
    }
    return null;
  }, [saleDetailResponse]);

  const detailItems = useMemo(() => {
    if (!detailSale) return [];
    if (Array.isArray(detailSale.items)) return detailSale.items;
    if (Array.isArray(detailSale.saleItems)) return detailSale.saleItems;
    return [];
  }, [detailSale]);

  async function handleCancel() {
    if (!cancelling?._id) return;
    try {
      await cancelSale(cancelling._id).unwrap();
      toast.success("Sale cancelled successfully");
      setCancelling(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function handleRestore() {
    if (!restoring?._id) return;
    try {
      await restoreSale(restoring._id).unwrap();
      toast.success("Sale restored successfully");
      setRestoring(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  const columns = [
    {
      key: "saleNumber",
      header: "Sale",
      render: (row) => (
        <div className="flex min-w-0 flex-col">
          <span className="font-mono text-sm font-semibold text-primary">
            {row?.saleNumber || "—"}
          </span>
          <span className="text-xs text-secondary">
            {formatDate(row?.saleDate || row?.createdAt)}
          </span>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (row) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-primary">
            {getCustomerName(row)}
          </span>
          {row?.customer?.phone && (
            <span className="text-xs text-secondary">{row.customer.phone}</span>
          )}
        </div>
      ),
    },
    {
      key: "items",
      header: "Items",
      render: (row) => {
        const items = row?.items || row?.saleItems || [];
        const count = Array.isArray(items)
          ? items.reduce((t, i) => t + Number(i?.quantity || 0), 0)
          : Number(row?.totalItems || row?.itemCount || 0);
        return (
          <span className="font-mono text-sm text-primary">{count || "—"}</span>
        );
      },
    },
    {
      key: "totalAmount",
      header: "Total",
      render: (row) => (
        <span className="font-mono text-sm font-semibold text-primary">
          {formatMoney(row?.totalAmount ?? row?.grandTotal ?? row?.total ?? 0)}
        </span>
      ),
    },
    {
      key: "paidAmount",
      header: "Paid",
      render: (row) => (
        <span className="font-mono text-sm text-primary">
          {formatMoney(row?.paidAmount || 0)}
        </span>
      ),
    },
    {
      key: "dueAmount",
      header: "Due",
      render: (row) => (
        <span className="font-mono text-sm text-primary">
          {formatMoney(row?.dueAmount || 0)}
        </span>
      ),
    },
    {
      key: "paymentStatus",
      header: "Payment",
      render: (row) => {
        const status = getPaymentStatus(row);
        const className =
          status === "paid"
            ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
            : status === "partially_paid" || status === "partial"
              ? "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
              : status === "refunded"
                ? "bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
                : "bg-muted-action text-secondary";

        return (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
          >
            {titleCase(status)}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const status = getSaleStatus(row);

        if (status === "cancelled" || status === "inactive") {
          return (
            <span className="inline-flex rounded-full bg-[var(--color-danger)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-danger)]">
              Cancelled
            </span>
          );
        }

        if (status === "returned" || status === "partially_returned") {
          return (
            <span className="inline-flex rounded-full bg-[var(--color-warning)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-warning)]">
              {titleCase(status)}
            </span>
          );
        }

        if (status === "draft") {
          return (
            <span className="inline-flex rounded-full bg-muted-action px-2.5 py-1 text-xs font-medium text-secondary">
              Draft
            </span>
          );
        }

        return (
          <span className="inline-flex rounded-full bg-[var(--color-success)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-success)]">
            {titleCase(status)}
          </span>
        );
      },
    },
  ];

  const apiErrorMessage = isError ? getApiErrorMessage(error) : "";

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Sales"
        description="View and manage your sales transactions."
      />

      <div className="mb-4 flex flex-col gap-2 lg:flex-row">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search sale number or customer..."
        />

        <Select
          options={[
            { value: "all", label: "All statuses" },
            { value: "draft", label: "Draft" },
            { value: "completed", label: "Completed" },
            { value: "cancelled", label: "Cancelled" },
            { value: "returned", label: "Returned" },
            { value: "partially_returned", label: "Partially returned" },
          ]}
          value={statusFilter}
          placeholder="All statuses"
          onChange={(e) => setStatusFilter(e.target.value)}
          className="lg:w-48"
        />

        <Select
          options={[
            { value: "all", label: "All payments" },
            { value: "paid", label: "Paid" },
            { value: "partially_paid", label: "Partially paid" },
            { value: "unpaid", label: "Unpaid" },
            { value: "refunded", label: "Refunded" },
          ]}
          value={paymentFilter}
          placeholder="All payments"
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="lg:w-48"
        />
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <ErrorState
          onRetry={refetch}
          description={apiErrorMessage || "Unable to load sales."}
        />
      ) : filteredSales.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No sales found"
          description={
            search || statusFilter !== "all" || paymentFilter !== "all"
              ? "Try changing your search or filters."
              : "Sales will appear here after completing a POS transaction."
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={filteredSales}
            actions={(row) => {
              const status = getSaleStatus(row);
              const isCancelled =
                status === "cancelled" || status === "inactive";

              return (
                <div className="flex justify-end gap-1">
                  {can(PERMISSIONS.READ) && (
                    <button
                      type="button"
                      aria-label="View sale"
                      onClick={() => setViewingSaleId(row._id)}
                      className="rounded-lg p-1.5 text-secondary transition-colors hover:bg-muted-action hover:text-primary"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}

                  {can(PERMISSIONS.UPDATE) && isCancelled && (
                    <button
                      type="button"
                      aria-label="Restore sale"
                      onClick={() => setRestoring(row)}
                      className="rounded-lg p-1.5 text-secondary transition-colors hover:bg-[var(--color-success)]/10 hover:text-[var(--color-success)]"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}

                  {can(PERMISSIONS.DELETE) && !isCancelled && (
                    <button
                      type="button"
                      aria-label="Cancel sale"
                      onClick={() => setCancelling(row)}
                      className="rounded-lg p-1.5 text-secondary transition-colors hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            }}
          />

          {pagination && pagination.total > 0 && (
            <div className="mt-4 text-sm text-secondary">
              Showing {filteredSales.length} of {pagination.total} sales
            </div>
          )}
        </>
      )}

      {/* ===================== VIEW SALE ===================== */}
      <Modal
        open={Boolean(viewingSaleId)}
        onClose={() => setViewingSaleId(null)}
        title={
          detailSale?.saleNumber
            ? `Sale ${detailSale.saleNumber}`
            : "Sale Details"
        }
      >
        {saleDetailLoading ? (
          <div className="py-10 text-center text-sm text-secondary">
            Loading sale details...
          </div>
        ) : saleDetailError ? (
          <div className="py-10 text-center text-sm text-secondary">
            Unable to load sale details.
          </div>
        ) : detailSale ? (
          <div className="space-y-5">
            {/* Header cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-secondary bg-card p-4">
                <p className="text-xs text-secondary">Sale Number</p>
                <p className="mt-1 font-mono text-sm font-semibold text-primary">
                  {detailSale.saleNumber || "—"}
                </p>
              </div>

              <div className="rounded-xl border border-secondary bg-card p-4">
                <p className="text-xs text-secondary">Date</p>
                <p className="mt-1 text-sm font-medium text-primary">
                  {formatDateTime(detailSale.saleDate || detailSale.createdAt)}
                </p>
              </div>

              <div className="rounded-xl border border-secondary bg-card p-4">
                <p className="text-xs text-secondary">Customer</p>
                <p className="mt-1 text-sm font-medium text-primary">
                  {getCustomerName(detailSale)}
                </p>
                {detailSale?.customer?.phone && (
                  <p className="mt-0.5 text-xs text-secondary">
                    {detailSale.customer.phone}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-secondary bg-card p-4">
                <p className="text-xs text-secondary">Status</p>
                <p className="mt-1 text-sm font-medium capitalize text-primary">
                  {titleCase(getSaleStatus(detailSale))}
                </p>
                <p className="mt-0.5 text-xs text-secondary">
                  Payment: {titleCase(getPaymentStatus(detailSale))}
                </p>
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-secondary bg-card p-4">
                <p className="text-xs text-secondary">Payment Method</p>
                <p className="mt-1 text-sm font-medium capitalize text-primary">
                  {detailSale.paymentMethod
                    ? titleCase(detailSale.paymentMethod)
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-secondary bg-card p-4">
                <p className="text-xs text-secondary">Reference</p>
                <p className="mt-1 font-mono text-sm text-primary">
                  {detailSale.referenceNumber || "—"}
                </p>
              </div>
            </div>

            {/* Items */}
            <div className="overflow-hidden rounded-xl border border-secondary bg-card">
              <div className="flex items-center gap-2 border-b border-secondary px-4 py-3">
                <Receipt className="h-4 w-4 text-secondary" />
                <h3 className="text-sm font-medium text-primary">Sale Items</h3>
              </div>

              {detailItems.length > 0 ? (
                <div className="divide-y divide-[var(--border-secondary-color)]">
                  {detailItems.map((item, index) => (
                    <div
                      key={item?._id || `${item?.product?._id || "item"}-${index}`}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-primary">
                          {item?.product?.name ||
                            item?.productName ||
                            item?.name ||
                            "Product"}
                        </p>
                        <p className="mt-0.5 text-xs text-secondary">
                          Qty: {item?.quantity || 0} ×{" "}
                          {formatMoney(item?.salePrice || item?.price || 0)}
                          {item?.product?.sku ? ` · SKU: ${item.product.sku}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 font-mono text-sm font-medium text-primary">
                        {formatMoney(
                          item?.lineTotal ??
                            item?.total ??
                            Number(item?.quantity || 0) *
                              Number(item?.salePrice || item?.price || 0)
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-sm text-secondary">
                  No sale items available on this sale record.
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="rounded-xl border border-secondary bg-card p-4">
              <div className="space-y-2">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-secondary">Subtotal</span>
                  <span className="font-mono text-primary">
                    {formatMoney(detailSale.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-secondary">Discount</span>
                  <span className="font-mono text-primary">
                    {formatMoney(detailSale.discount)}
                  </span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-secondary">Tax</span>
                  <span className="font-mono text-primary">
                    {formatMoney(detailSale.tax)}
                  </span>
                </div>
                {(Number(detailSale.shippingCost) > 0 ||
                  Number(detailSale.otherCharges) > 0) && (
                  <>
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-secondary">Shipping</span>
                      <span className="font-mono text-primary">
                        {formatMoney(detailSale.shippingCost)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="text-secondary">Other charges</span>
                      <span className="font-mono text-primary">
                        {formatMoney(detailSale.otherCharges)}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between gap-4 border-t border-secondary pt-3">
                  <span className="font-semibold text-primary">Total</span>
                  <span className="font-mono font-semibold text-primary">
                    {formatMoney(
                      detailSale.totalAmount ??
                        detailSale.grandTotal ??
                        detailSale.total
                    )}
                  </span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-secondary">Paid</span>
                  <span className="font-mono text-primary">
                    {formatMoney(detailSale.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-secondary">Due</span>
                  <span className="font-mono text-primary">
                    {formatMoney(detailSale.dueAmount)}
                  </span>
                </div>
              </div>
            </div>

            {detailSale.notes ? (
              <div className="rounded-xl border border-secondary bg-card p-4">
                <p className="text-xs text-secondary">Notes</p>
                <p className="mt-1 text-sm text-primary">{detailSale.notes}</p>
              </div>
            ) : null}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setViewingSaleId(null)}
                className="inline-flex items-center gap-2 rounded-lg bg-muted-action px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-muted-action-hover"
              >
                <X className="h-4 w-4" />
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-secondary">
            Sale details not found.
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        onConfirm={handleCancel}
        loading={cancellingSale}
        title="Cancel sale?"
        description={`This will cancel sale "${
          cancelling?.saleNumber || ""
        }". The sale can be restored later.`}
      />

      <ConfirmModal
        open={Boolean(restoring)}
        onClose={() => setRestoring(null)}
        onConfirm={handleRestore}
        loading={restoringSale}
        title="Restore sale?"
        description={`Restore sale "${
          restoring?.saleNumber || ""
        }" and make it active again?`}
      />
    </div>
  );
}