import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
  Eye,
  Pencil,
  Trash2,
  ShoppingCart,
  X,
  Package,
  Smartphone,
  Hash,
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
  useGetAllSaleItemsQuery,
  useGetSaleItemByIdQuery,
  useUpdateSaleItemMutation,
  useDeleteSaleItemMutation,
} from "../../features/sales/saleItemApi";

const PERMISSIONS = {
  READ: "sale-items.read",
  UPDATE: "sale-items.update",
  DELETE: "sale-items.delete",
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

const getSaleNumber = (item) => {
  if (!item?.sale) return "—";
  if (typeof item.sale === "string") return item.sale;
  return item.sale.saleNumber || item.sale.number || item.sale._id || "—";
};

const getCustomerName = (item) => {
  // Customer can come from the populated sale
  const sale = item?.sale;
  if (!sale) return "Walk-in Customer";

  if (typeof sale.customer === "string") return sale.customer;
  if (sale.customer?.name) return sale.customer.name;
  if (sale.customerName) return sale.customerName;

  return "Walk-in Customer";
};

const getProductName = (item) => {
  if (!item?.product) return "—";
  if (typeof item.product === "string") return item.product;
  return (
    item.product.name ||
    item.product.model ||
    item.product.productName ||
    item.product._id ||
    "—"
  );
};

const getProductSku = (item) => {
  if (!item?.product) return "";
  if (typeof item.product === "object") {
    return item.product.sku || "";
  }
  return "";
};

const getInventoryLabel = (item) => {
  // Prefer IMEI if available
  if (item?.imei) return `IMEI: ${item.imei}`;
  if (item?.unitBarcode) return `Barcode: ${item.unitBarcode}`;

  if (!item?.productInventory) return "";
  if (typeof item.productInventory === "string") {
    return item.productInventory;
  }

  const parts = [
    item.productInventory.color,
    item.productInventory.size,
    item.productInventory.imei,
    item.productInventory.unitBarcode,
  ].filter(Boolean);

  return parts.join(" / ");
};

export default function SaleItems() {
  const { can } = usePermissions();

  const [search, setSearch] = useState("");
  const [returnFilter, setReturnFilter] = useState("all");

  const [viewingItemId, setViewingItemId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const {
    data: saleItemResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAllSaleItemsQuery({
    search: search.trim() || undefined,
    page: 1,
    limit: 100,
  });

  const {
    data: saleItemDetailResponse,
    isLoading: detailLoading,
    isError: detailError,
  } = useGetSaleItemByIdQuery(viewingItemId, {
    skip: !viewingItemId,
  });

  const [updateSaleItem, { isLoading: updating }] =
    useUpdateSaleItemMutation();

  const [deleteSaleItem, { isLoading: deletingItem }] =
    useDeleteSaleItemMutation();

  // Normalize response
  const saleItems = useMemo(() => {
    if (Array.isArray(saleItemResponse?.data?.saleItems)) {
      return saleItemResponse.data.saleItems;
    }
    if (Array.isArray(saleItemResponse?.saleItems)) {
      return saleItemResponse.saleItems;
    }
    if (Array.isArray(saleItemResponse?.data)) {
      return saleItemResponse.data;
    }
    if (Array.isArray(saleItemResponse)) {
      return saleItemResponse;
    }
    return [];
  }, [saleItemResponse]);

  const pagination =
    saleItemResponse?.data?.pagination ||
    saleItemResponse?.pagination ||
    null;

  const filteredSaleItems = useMemo(() => {
    const term = search.toLowerCase().trim();

    return saleItems.filter((item) => {
      const productName = getProductName(item).toLowerCase();
      const saleNumber = getSaleNumber(item).toLowerCase();
      const customerName = getCustomerName(item).toLowerCase();
      const inventoryName = getInventoryLabel(item).toLowerCase();
      const sku = getProductSku(item).toLowerCase();
      const imei = String(item?.imei || "").toLowerCase();
      const unitBarcode = String(item?.unitBarcode || "").toLowerCase();

      const returnedQuantity = Number(item?.returnedQuantity || 0);
      const quantity = Number(item?.quantity || 0);

      const matchesSearch =
        !term ||
        productName.includes(term) ||
        saleNumber.includes(term) ||
        customerName.includes(term) ||
        inventoryName.includes(term) ||
        sku.includes(term) ||
        imei.includes(term) ||
        unitBarcode.includes(term);

      let matchesReturn = true;

      if (returnFilter === "returned") {
        matchesReturn = returnedQuantity > 0 && returnedQuantity < quantity;
      }
      if (returnFilter === "not-returned") {
        matchesReturn = returnedQuantity === 0;
      }
      if (returnFilter === "fully-returned") {
        matchesReturn = quantity > 0 && returnedQuantity >= quantity;
      }

      return matchesSearch && matchesReturn;
    });
  }, [saleItems, search, returnFilter]);

  const detailItem = useMemo(() => {
    if (!saleItemDetailResponse) return null;

    if (saleItemDetailResponse?.data?.saleItem) {
      return saleItemDetailResponse.data.saleItem;
    }
    if (saleItemDetailResponse?.saleItem) {
      return saleItemDetailResponse.saleItem;
    }
    if (
      saleItemDetailResponse?.data &&
      !Array.isArray(saleItemDetailResponse.data) &&
      (saleItemDetailResponse.data._id ||
        saleItemDetailResponse.data.quantity !== undefined)
    ) {
      return saleItemDetailResponse.data;
    }
    if (
      saleItemDetailResponse?._id ||
      saleItemDetailResponse?.quantity !== undefined
    ) {
      return saleItemDetailResponse;
    }
    return null;
  }, [saleItemDetailResponse]);

  async function handleUpdate() {
    if (!editing?._id) return;

    try {
      await updateSaleItem({
        id: editing._id,
        quantity: Number(editing.quantity),
        salePrice: Number(editing.salePrice),
        discount: Number(editing.discount || 0),
        tax: Number(editing.tax || 0),
      }).unwrap();

      toast.success("Sale item updated successfully");
      setEditing(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  async function handleDelete() {
    if (!deleting?._id) return;

    try {
      await deleteSaleItem(deleting._id).unwrap();
      toast.success("Sale item deleted successfully");
      setDeleting(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  }

  const columns = [
    {
      key: "sale",
      header: "Sale / Customer",
      render: (row) => (
        <div className="flex min-w-0 flex-col">
          <span className="font-mono text-sm font-semibold text-primary">
            {getSaleNumber(row)}
          </span>
          <span className="text-xs text-secondary">
            {getCustomerName(row)}
          </span>
          <span className="text-xs text-secondary">
            {formatDate(row?.createdAt)}
          </span>
        </div>
      ),
    },
    {
      key: "product",
      header: "Product",
      render: (row) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-primary">
            {getProductName(row)}
          </span>
          {getProductSku(row) && (
            <span className="text-xs text-secondary">
              SKU: {getProductSku(row)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "imei",
      header: "IMEI / Variant",
      render: (row) => {
        if (row?.imei) {
          return (
            <div className="flex items-center gap-1.5">
              <Smartphone size={14} className="text-brand" />
              <span className="font-mono text-xs font-medium text-primary">
                {row.imei}
              </span>
            </div>
          );
        }
        if (row?.unitBarcode) {
          return (
            <div className="flex items-center gap-1.5">
              <Hash size={14} className="text-secondary" />
              <span className="font-mono text-xs text-primary">
                {row.unitBarcode}
              </span>
            </div>
          );
        }
        return (
          <span className="text-xs text-secondary">
            {getInventoryLabel(row) || "—"}
          </span>
        );
      },
    },
    {
      key: "quantity",
      header: "Qty",
      render: (row) => (
        <span className="font-mono text-sm text-primary">
          {Number(row?.quantity || 0).toLocaleString("en-PK")}
        </span>
      ),
    },
    {
      key: "salePrice",
      header: "Price",
      render: (row) => (
        <span className="font-mono text-sm text-primary">
          {formatMoney(row?.salePrice)}
        </span>
      ),
    },
    {
      key: "lineTotal",
      header: "Line Total",
      render: (row) => (
        <span className="font-mono text-sm font-semibold text-primary">
          {formatMoney(
            row?.lineTotal ??
              Number(row?.quantity || 0) * Number(row?.salePrice || 0)
          )}
        </span>
      ),
    },
    {
      key: "returnedQuantity",
      header: "Returned",
      render: (row) => {
        const returned = Number(row?.returnedQuantity || 0);
        const quantity = Number(row?.quantity || 0);

        return (
          <span
            className={
              returned > 0
                ? "font-mono text-sm text-[var(--color-warning)]"
                : "font-mono text-sm text-secondary"
            }
          >
            {returned} / {quantity}
          </span>
        );
      },
    },
  ];

  const apiErrorMessage = isError ? getApiErrorMessage(error) : "";

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Sale Items"
        description="View and manage individual items included in sales (with IMEI support)."
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search sale, customer, product, IMEI..."
        />

        <Select
          options={[
            { value: "all", label: "All items" },
            { value: "not-returned", label: "Not returned" },
            { value: "returned", label: "Partially returned" },
            { value: "fully-returned", label: "Fully returned" },
          ]}
          value={returnFilter}
          placeholder="All items"
          onChange={(e) => setReturnFilter(e.target.value)}
          className="sm:w-48"
        />
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <ErrorState
          onRetry={refetch}
          description={apiErrorMessage || "Unable to load sale items."}
        />
      ) : filteredSaleItems.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No sale items found"
          description={
            search || returnFilter !== "all"
              ? "Try changing your search or filters."
              : "Sale items will appear here after completing POS transactions."
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={filteredSaleItems}
            actions={(row) => (
              <div className="flex justify-end gap-1">
                {can(PERMISSIONS.READ) && (
                  <button
                    type="button"
                    aria-label="View sale item"
                    onClick={() => setViewingItemId(row._id)}
                    className="rounded-lg p-1.5 text-secondary transition-colors hover:bg-muted-action hover:text-primary"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                )}

                {can(PERMISSIONS.UPDATE) && (
                  <button
                    type="button"
                    aria-label="Edit sale item"
                    onClick={() =>
                      setEditing({
                        ...row,
                        quantity: row?.quantity || 0,
                        salePrice: row?.salePrice || 0,
                        discount: row?.discount || 0,
                        tax: row?.tax || 0,
                      })
                    }
                    className="rounded-lg p-1.5 text-secondary transition-colors hover:bg-muted-action hover:text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}

                {can(PERMISSIONS.DELETE) && (
                  <button
                    type="button"
                    aria-label="Delete sale item"
                    onClick={() => setDeleting(row)}
                    className="rounded-lg p-1.5 text-secondary transition-colors hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          />

          {pagination && pagination.total > 0 && (
            <div className="mt-4 text-sm text-secondary">
              Showing {filteredSaleItems.length} of {pagination.total} sale
              items
            </div>
          )}
        </>
      )}

      {/* ===================== VIEW ===================== */}
      <Modal
        open={Boolean(viewingItemId)}
        onClose={() => setViewingItemId(null)}
        title="Sale Item Details"
      >
        {detailLoading ? (
          <div className="py-10 text-center text-sm text-secondary">
            Loading sale item...
          </div>
        ) : detailError ? (
          <div className="py-10 text-center text-sm text-secondary">
            Unable to load sale item.
          </div>
        ) : detailItem ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-secondary bg-card p-4">
                <p className="text-xs text-secondary">Sale</p>
                <p className="mt-1 font-mono text-sm font-semibold text-primary">
                  {getSaleNumber(detailItem)}
                </p>
              </div>

              <div className="rounded-xl border border-secondary bg-card p-4">
                <p className="text-xs text-secondary">Customer</p>
                <p className="mt-1 text-sm font-medium text-primary">
                  {getCustomerName(detailItem)}
                </p>
              </div>

              <div className="rounded-xl border border-secondary bg-card p-4">
                <p className="text-xs text-secondary">Product</p>
                <p className="mt-1 text-sm font-medium text-primary">
                  {getProductName(detailItem)}
                </p>
                {getProductSku(detailItem) && (
                  <p className="mt-0.5 text-xs text-secondary">
                    SKU: {getProductSku(detailItem)}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-secondary bg-card p-4">
                <p className="text-xs text-secondary">IMEI / Variant</p>
                <p className="mt-1 text-sm font-medium text-primary">
                  {detailItem.imei
                    ? detailItem.imei
                    : detailItem.unitBarcode
                    ? detailItem.unitBarcode
                    : getInventoryLabel(detailItem) || "—"}
                </p>
              </div>

              <div className="rounded-xl border border-secondary bg-card p-4">
                <p className="text-xs text-secondary">Quantity</p>
                <p className="mt-1 font-mono text-sm font-medium text-primary">
                  {Number(detailItem.quantity || 0).toLocaleString("en-PK")}
                </p>
              </div>

              <div className="rounded-xl border border-secondary bg-card p-4">
                <p className="text-xs text-secondary">Returned</p>
                <p className="mt-1 font-mono text-sm font-medium text-primary">
                  {Number(detailItem.returnedQuantity || 0).toLocaleString(
                    "en-PK"
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-secondary bg-card p-4">
                <p className="text-xs text-secondary">Sale Price</p>
                <p className="mt-1 font-mono text-sm font-medium text-primary">
                  {formatMoney(detailItem.salePrice)}
                </p>
              </div>

              <div className="rounded-xl border border-secondary bg-card p-4">
                <p className="text-xs text-secondary">Discount</p>
                <p className="mt-1 font-mono text-sm font-medium text-primary">
                  {formatMoney(detailItem.discount)}
                </p>
              </div>

              <div className="rounded-xl border border-secondary bg-card p-4">
                <p className="text-xs text-secondary">Tax</p>
                <p className="mt-1 font-mono text-sm font-medium text-primary">
                  {formatMoney(detailItem.tax)}
                </p>
              </div>

              <div className="rounded-xl border border-secondary bg-card p-4 sm:col-span-2">
                <p className="text-xs text-secondary">Line Total</p>
                <p className="mt-1 font-mono text-base font-semibold text-primary">
                  {formatMoney(
                    detailItem.lineTotal ??
                      Number(detailItem.quantity || 0) *
                        Number(detailItem.salePrice || 0)
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setViewingItemId(null)}
                className="inline-flex items-center gap-2 rounded-lg bg-muted-action px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-muted-action-hover"
              >
                <X className="h-4 w-4" />
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-secondary">
            Sale item not found.
          </div>
        )}
      </Modal>

      {/* ===================== EDIT ===================== */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit Sale Item"
      >
        {editing && (
          <div className="space-y-4">
            <div className="rounded-xl border border-secondary bg-card p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Package className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-primary">
                    {getProductName(editing)}
                  </p>
                  <p className="mt-0.5 text-xs text-secondary">
                    {getSaleNumber(editing)} · {getCustomerName(editing)}
                    {editing.imei ? ` · IMEI: ${editing.imei}` : ""}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-primary">
                Quantity
              </label>
              <input
                type="number"
                min="0.001"
                step="0.001"
                value={editing.quantity}
                onChange={(e) =>
                  setEditing({ ...editing, quantity: e.target.value })
                }
                className="w-full rounded-lg border border-primary bg-card px-3 py-2 text-sm text-primary outline-none transition-colors focus:border-brand"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-primary">
                Sale Price
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editing.salePrice}
                onChange={(e) =>
                  setEditing({ ...editing, salePrice: e.target.value })
                }
                className="w-full rounded-lg border border-primary bg-card px-3 py-2 text-sm text-primary outline-none transition-colors focus:border-brand"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-primary">
                Discount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editing.discount}
                onChange={(e) =>
                  setEditing({ ...editing, discount: e.target.value })
                }
                className="w-full rounded-lg border border-primary bg-card px-3 py-2 text-sm text-primary outline-none transition-colors focus:border-brand"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-primary">
                Tax
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editing.tax}
                onChange={(e) =>
                  setEditing({ ...editing, tax: e.target.value })
                }
                className="w-full rounded-lg border border-primary bg-card px-3 py-2 text-sm text-primary outline-none transition-colors focus:border-brand"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg bg-muted-action px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-muted-action-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={handleUpdate}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {updating ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ===================== DELETE ===================== */}
      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={deletingItem}
        title="Delete sale item?"
        description={`This will remove the ${
          getProductName(deleting) || "product"
        } item from sale "${getSaleNumber(deleting)}".`}
      />
    </div>
  );
}