import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Package,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Boxes,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Smartphone,
  Hash,
} from "lucide-react";

import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/Button";

import {
  useGetProductInventoryQuery,
  useCreateProductInventoryMutation,
  useUpdateProductInventoryMutation,
  useDeleteProductInventoryMutation,
} from "../../features/products/productInventoryApi";

import {
  useGetInventoryUnitsByProductInventoryQuery,
  useCreateInventoryUnitMutation,
  useDeleteInventoryUnitMutation,
} from "../../features/products/inventoryUnitApi";

import { useGetProductsQuery } from "../../features/products/productApi";

// ======================================================
// HELPERS
// ======================================================

const toTitleCase = (str = "") => {
  if (!str || typeof str !== "string") return "";
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const getProductName = (p) => p?.name || "Unknown Product";
const getProductSku = (p) => p?.sku || "—";
const getProductBrand = (p) =>
  typeof p?.brand === "object" ? p.brand?.name || "—" : p?.brand || "—";
const getProductModel = (p) =>
  typeof p?.model === "object" ? p.model?.name || "—" : p?.model || "—";

const getStockStatus = (item) => {
  const qty = Number(item?.quantity || 0);
  const min = Number(item?.minStock || 0);

  if (qty <= 0) {
    return {
      label: "Out of Stock",
      className:
        "border-[var(--color-danger)]/20 bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
      icon: XCircle,
    };
  }
  if (qty <= min) {
    return {
      label: "Low Stock",
      className:
        "border-[var(--color-warning)]/20 bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
      icon: AlertTriangle,
    };
  }
  return {
    label: "In Stock",
    className:
      "border-[var(--color-success)]/20 bg-[var(--color-success)]/10 text-[var(--color-success)]",
    icon: CheckCircle,
  };
};

const formatMoney = (v) =>
  `Rs ${Number(v || 0).toLocaleString("en-PK", { maximumFractionDigits: 2 })}`;

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function ProductInventory() {
  const [search, setSearch] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editingInventory, setEditingInventory] = useState(null);
  const [selectedInventory, setSelectedInventory] = useState(null);

  const {
    data: inventoryResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetProductInventoryQuery({
    page,
    limit: 20,
    search: search.trim() || undefined,
    stockStatus: stockStatus || undefined,
  });

  const { data: productResponse, isLoading: productsLoading } =
    useGetProductsQuery({ page: 1, limit: 300, isActive: true });

  const [createProductInventory, { isLoading: isCreating }] =
    useCreateProductInventoryMutation();
  const [updateProductInventory, { isLoading: isUpdating }] =
    useUpdateProductInventoryMutation();
  const [deleteProductInventory, { isLoading: isDeleting }] =
    useDeleteProductInventoryMutation();

  // ---------- normalize data ----------
  const inventory = useMemo(() => {
    if (Array.isArray(inventoryResponse?.inventory)) return inventoryResponse.inventory;
    if (Array.isArray(inventoryResponse?.data?.inventory)) return inventoryResponse.data.inventory;
    if (Array.isArray(inventoryResponse?.data)) return inventoryResponse.data;
    if (Array.isArray(inventoryResponse)) return inventoryResponse;
    return [];
  }, [inventoryResponse]);

  const pagination =
    inventoryResponse?.pagination ||
    inventoryResponse?.data?.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    };

  const products = useMemo(() => {
    if (Array.isArray(productResponse?.products)) return productResponse.products;
    if (Array.isArray(productResponse?.data?.products)) return productResponse.data.products;
    if (Array.isArray(productResponse?.data)) return productResponse.data;
    if (Array.isArray(productResponse)) return productResponse;
    return [];
  }, [productResponse]);

  // ---------- summary ----------
  const inStockCount = inventory.filter(
    (i) => Number(i.quantity || 0) > Number(i.minStock || 0)
  ).length;
  const lowStockCount = inventory.filter(
    (i) =>
      Number(i.quantity || 0) > 0 &&
      Number(i.quantity || 0) <= Number(i.minStock || 0)
  ).length;
  const outOfStockCount = inventory.filter(
    (i) => Number(i.quantity || 0) === 0
  ).length;

  // ---------- handlers ----------
  const handleCreate = () => {
    setEditingInventory(null);
    setSelectedInventory(null);
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setSelectedInventory(null);
    setEditingInventory(item);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingInventory(null);
  };

  const handleSubmit = async (payload) => {
    try {
      if (editingInventory) {
        await updateProductInventory({
          id: editingInventory._id,
          ...payload,
        }).unwrap();
        toast.success("Product inventory updated successfully");
      } else {
        await createProductInventory(payload).unwrap();
        toast.success("Product inventory created successfully");
      }
      handleCloseForm();
    } catch (err) {
      toast.error(err?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this inventory?")) return;
    try {
      await deleteProductInventory(id).unwrap();
      if (selectedInventory?._id === id) setSelectedInventory(null);
      toast.success("Product inventory deleted successfully");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete inventory");
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > (pagination.totalPages || 1)) return;
    setPage(newPage);
  };

  return (
    <div className="animate-fade-up min-w-0 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Product Inventory"
          description="Manage stock, variants, pricing and serial units."
        />
        <Button
          type="button"
          onClick={handleCreate}
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 sm:w-auto"
        >
          <Plus size={18} />
          Add Inventory
        </Button>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total Inventory" value={pagination.total || inventory.length} icon={Boxes} />
        <SummaryCard title="In Stock" value={inStockCount} icon={CheckCircle} />
        <SummaryCard title="Low Stock" value={lowStockCount} icon={AlertTriangle} />
        <SummaryCard title="Out of Stock" value={outOfStockCount} icon={XCircle} />
      </div>

      {/* FILTERS */}
      <div className="rounded-2xl border border-primary bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search product, SKU, color, size…"
              className="h-11 w-full rounded-xl border border-primary bg-surface pl-10 pr-4 text-sm text-primary outline-none transition focus:border-brand"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex">
            <select
              value={stockStatus}
              onChange={(e) => {
                setStockStatus(e.target.value);
                setPage(1);
              }}
              className="h-11 w-full rounded-xl border border-primary bg-surface px-4 text-sm text-primary outline-none focus:border-brand sm:min-w-[150px]"
            >
              <option value="">All Stock</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>

            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary bg-surface px-4 text-sm font-medium text-primary transition hover:bg-muted-action lg:w-auto"
            >
              <RefreshCw size={17} className={isFetching ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-primary bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b border-secondary bg-surface">
              <tr>
                <th className="px-5 py-4 text-left font-semibold text-primary">Product</th>
                <th className="px-5 py-4 text-left font-semibold text-primary">SKU</th>
                <th className="px-5 py-4 text-left font-semibold text-primary">Variant</th>
                <th className="px-5 py-4 text-left font-semibold text-primary">Quantity</th>
                <th className="px-5 py-4 text-left font-semibold text-primary">Purchase</th>
                <th className="px-5 py-4 text-left font-semibold text-primary">Sale</th>
                <th className="px-5 py-4 text-left font-semibold text-primary">Status</th>
                <th className="px-5 py-4 text-right font-semibold text-primary">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border-secondary-color)]">
              {isLoading ? (
                <InventorySkeleton />
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <Package size={42} className="mx-auto mb-3 text-secondary" />
                    <h3 className="text-base font-semibold text-primary">No inventory found</h3>
                    <p className="mt-1 text-sm text-secondary">
                      Add inventory for one of your products to start managing stock.
                    </p>
                    <Button type="button" onClick={handleCreate} className="mt-5 inline-flex items-center gap-2">
                      <Plus size={17} />
                      Add Inventory
                    </Button>
                  </td>
                </tr>
              ) : (
                inventory.map((item) => {
                  const status = getStockStatus(item);
                  const StatusIcon = status.icon;
                  const product = item.product;
                  const isSerial = Boolean(product?.trackSerial);

                  return (
                    <tr key={item._id} className="transition hover:bg-surface">
                      <td className="px-5 py-4">
                        <p className="max-w-[220px] truncate font-semibold text-primary">
                          {getProductName(product)}
                        </p>
                        {isSerial && (
                          <span className="mt-1 inline-flex items-center gap-1 text-xs text-brand">
                            <Smartphone size={12} />
                            Serial
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-primary">
                          {getProductSku(product)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {item.color || item.size ? (
                          <div className="flex max-w-[200px] flex-wrap gap-1.5">
                            {item.color && (
                              <span className="rounded-lg border border-primary bg-surface px-2.5 py-1 text-xs text-primary">
                                {item.color}
                              </span>
                            )}
                            {item.size && (
                              <span className="rounded-lg border border-primary bg-surface px-2.5 py-1 text-xs text-primary">
                                {item.size}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-secondary">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-primary">{item.quantity}</span>
                        <span className="ml-2 text-xs text-secondary">/ min {item.minStock}</span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-medium text-primary">
                        {formatMoney(item.purchasePrice)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-medium text-primary">
                        {formatMoney(item.salePrice)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${status.className}`}
                        >
                          <StatusIcon size={14} />
                          {status.label}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedInventory(item)}
                            className="rounded-lg border border-primary p-2 text-secondary transition hover:bg-muted-action hover:text-primary"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="rounded-lg border border-primary p-2 text-secondary transition hover:bg-muted-action hover:text-primary"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item._id)}
                            disabled={isDeleting}
                            className="rounded-lg border border-[var(--color-danger)]/20 p-2 text-[var(--color-danger)] transition hover:bg-[var(--color-danger)]/10 disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex flex-col gap-4 border-t border-secondary px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-center text-sm text-secondary sm:text-left">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex w-full gap-2 sm:w-auto">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="flex-1 rounded-lg border border-primary px-3 py-2 text-sm text-primary transition hover:bg-muted-action disabled:opacity-40 sm:flex-none"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="flex-1 rounded-lg border border-primary px-3 py-2 text-sm text-primary transition hover:bg-muted-action disabled:opacity-40 sm:flex-none"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT FORM */}
      {showForm && (
        <InventoryForm
          products={products}
          productsLoading={productsLoading}
          inventory={editingInventory}
          loading={isCreating || isUpdating}
          onClose={handleCloseForm}
          onSubmit={handleSubmit}
        />
      )}

      {/* DETAILS + UNITS */}
      {selectedInventory && (
        <InventoryDetails
          inventory={selectedInventory}
          onClose={() => setSelectedInventory(null)}
          onEdit={() => handleEdit(selectedInventory)}
        />
      )}
    </div>
  );
}

// ======================================================
// SUMMARY CARD
// ======================================================

function SummaryCard({ title, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-primary bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-secondary">{title}</p>
          <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
        </div>
        <div className="shrink-0 rounded-xl bg-brand/10 p-3 text-brand">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

// ======================================================
// INVENTORY FORM (ProductInventory only – NO IMEI)
// ======================================================

function InventoryForm({ products, productsLoading, inventory, loading, onClose, onSubmit }) {
  const isEdit = Boolean(inventory);

  const [form, setForm] = useState({
    product: inventory?.product?._id || inventory?.product || "",
    color: inventory?.color || "",
    size: inventory?.size || "",
    quantity: inventory?.quantity ?? 0,
    minStock: inventory?.minStock ?? 0,
    maxStock: inventory?.maxStock ?? "",
    purchasePrice: inventory?.purchasePrice ?? "",
    salePrice: inventory?.salePrice ?? "",
    discount: inventory?.discount ?? 0,
    tax: inventory?.tax ?? 0,
  });

  const selectedProduct = useMemo(() => {
    const p = products.find((item) => item._id === form.product);
    if (p) return p;
    if (isEdit && inventory?.product) return inventory.product;
    return null;
  }, [products, form.product, isEdit, inventory]);

  const hasVariants = selectedProduct?.hasVariants === true;
  const trackSerial = selectedProduct?.trackSerial === true;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (e) => {
    setForm((prev) => ({
      ...prev,
      product: e.target.value,
      color: "",
      size: "",
      quantity: 0,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // ---------- validation ----------
    if (!form.product) {
      toast.error("Product is required");
      return;
    }
    if (form.quantity === "" || Number(form.quantity) < 0) {
      toast.error("Quantity is required and cannot be negative");
      return;
    }
    if (form.minStock === "" || Number(form.minStock) < 0) {
      toast.error("Minimum stock is required and cannot be negative");
      return;
    }
    if (
      form.maxStock !== "" &&
      form.maxStock !== null &&
      Number(form.maxStock) < Number(form.minStock)
    ) {
      toast.error("Maximum stock cannot be less than minimum stock");
      return;
    }
    if (form.purchasePrice !== "" && Number(form.purchasePrice) < 0) {
      toast.error("Purchase price cannot be negative");
      return;
    }
    if (form.salePrice !== "" && Number(form.salePrice) < 0) {
      toast.error("Sale price cannot be negative");
      return;
    }
    if (Number(form.discount || 0) < 0 || Number(form.discount || 0) > 100) {
      toast.error("Discount must be between 0 and 100");
      return;
    }
    if (Number(form.tax || 0) < 0) {
      toast.error("Tax cannot be negative");
      return;
    }

    // ---------- payload (exactly matches ProductInventory schema) ----------
    const payload = {
      product: form.product,
      color: hasVariants ? toTitleCase(form.color) || null : null,
      size: hasVariants ? toTitleCase(form.size) || null : null,
      quantity: Number(form.quantity),
      minStock: Number(form.minStock),
      maxStock: form.maxStock === "" ? null : Number(form.maxStock),
      purchasePrice: form.purchasePrice === "" ? 0 : Number(form.purchasePrice),
      salePrice: form.salePrice === "" ? 0 : Number(form.salePrice),
      discount: Number(form.discount || 0),
      tax: Number(form.tax || 0),
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4">
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full min-w-0 max-w-3xl flex-col overflow-hidden rounded-2xl border border-primary bg-card shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-secondary px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-primary sm:text-xl">
              {isEdit ? "Update Product Inventory" : "Add Product Inventory"}
            </h2>
            <p className="mt-1 text-xs text-secondary sm:text-sm">
              Stock levels and pricing. Serial units (IMEI) are managed separately.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-secondary transition hover:bg-muted-action hover:text-primary"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-6">
            {/* PRODUCT */}
            <div>
              <label className="mb-2 block text-sm font-medium text-primary">
                Product <span className="text-[var(--color-danger)]">*</span>
              </label>
              <select
                name="product"
                value={form.product}
                onChange={handleProductChange}
                disabled={isEdit || productsLoading}
                className="h-11 w-full rounded-xl border border-primary bg-surface px-4 text-sm text-primary outline-none focus:border-brand disabled:opacity-60"
              >
                <option value="">
                  {productsLoading ? "Loading products…" : "Select Product"}
                </option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {getProductName(p)} — {getProductSku(p)}
                    {p.trackSerial ? " (Serial)" : ""}
                  </option>
                ))}
              </select>

              {selectedProduct && (
                <div className="mt-3 rounded-xl border border-primary bg-surface p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <InfoItem label="Product" value={getProductName(selectedProduct)} />
                    <InfoItem label="Brand" value={getProductBrand(selectedProduct)} />
                    <InfoItem label="Model" value={getProductModel(selectedProduct)} />
                  </div>
                  {trackSerial && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-brand">
                      <Smartphone size={14} />
                      This product uses serial / IMEI tracking. Add units after creating inventory.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* VARIANTS (only if hasVariants) */}
            {hasVariants && (
              <div>
                <h3 className="mb-3 font-semibold text-primary">Variant</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label="Color"
                    name="color"
                    value={form.color}
                    onChange={handleChange}
                    placeholder="e.g. Black"
                  />
                  <FormField
                    label="Size"
                    name="size"
                    value={form.size}
                    onChange={handleChange}
                    placeholder="e.g. Large / 42"
                  />
                </div>
              </div>
            )}

            {/* STOCK */}
            <div>
              <h3 className="mb-3 font-semibold text-primary">Stock</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  label="Quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                />
                <FormField
                  label="Minimum Stock"
                  name="minStock"
                  type="number"
                  min="0"
                  value={form.minStock}
                  onChange={handleChange}
                  required
                />
                <FormField
                  label="Maximum Stock"
                  name="maxStock"
                  type="number"
                  min="0"
                  value={form.maxStock}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* PRICING */}
            <div>
              <h3 className="mb-3 font-semibold text-primary">Pricing</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="Purchase Price"
                  name="purchasePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.purchasePrice}
                  onChange={handleChange}
                />
                <FormField
                  label="Sale Price"
                  name="salePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.salePrice}
                  onChange={handleChange}
                />
                <FormField
                  label="Discount (%)"
                  name="discount"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.discount}
                  onChange={handleChange}
                />
                <FormField
                  label="Tax"
                  name="tax"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.tax}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col-reverse gap-3 border-t border-secondary pt-5 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 sm:w-auto">
                {loading ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Plus size={17} />
                    {isEdit ? "Update Inventory" : "Add Inventory"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// DETAILS + INVENTORY UNITS (IMEI) for trackSerial products
// ======================================================

function InventoryDetails({ inventory, onClose, onEdit }) {
  const product = inventory?.product;
  const trackSerial = Boolean(product?.trackSerial);

  const { data: unitsResponse, isLoading: unitsLoading, refetch: refetchUnits } =
    useGetInventoryUnitsByProductInventoryQuery(inventory._id, {
      skip: !trackSerial,
    });

  const [createUnit, { isLoading: isCreatingUnit }] = useCreateInventoryUnitMutation();
  const [deleteUnit, { isLoading: isDeletingUnit }] = useDeleteInventoryUnitMutation();

  const units = useMemo(() => {
    if (Array.isArray(unitsResponse)) return unitsResponse;
    if (Array.isArray(unitsResponse?.data)) return unitsResponse.data;
    if (Array.isArray(unitsResponse?.units)) return unitsResponse.units;
    return [];
  }, [unitsResponse]);

  const [imei, setImei] = useState("");
  const [serialNumber, setSerialNumber] = useState("");

  const handleAddUnit = async (e) => {
    e.preventDefault();

    if (!imei.trim()) {
      toast.error("IMEI is required");
      return;
    }

    try {
      await createUnit({
        product: product._id || product,
        productInventory: inventory._id,
        imei: imei.trim().toUpperCase(),
        serialNumber: serialNumber.trim() || null,
      }).unwrap();

      toast.success("Inventory unit (IMEI) added successfully");
      setImei("");
      setSerialNumber("");
      refetchUnits();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add inventory unit");
    }
  };

  const handleDeleteUnit = async (id) => {
    if (!window.confirm("Delete this IMEI unit?")) return;
    try {
      await deleteUnit(id).unwrap();
      toast.success("Inventory unit deleted");
      refetchUnits();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete unit");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4">
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full min-w-0 max-w-2xl flex-col overflow-hidden rounded-2xl border border-primary bg-card shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-secondary px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-primary sm:text-xl">Inventory Details</h2>
            <p className="mt-1 truncate text-sm text-secondary">{getProductName(product)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-secondary transition hover:bg-muted-action hover:text-primary"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Basic info */}
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-6">
            <DetailItem label="Product" value={getProductName(product)} />
            <DetailItem label="SKU" value={getProductSku(product)} />
            <DetailItem label="Brand" value={getProductBrand(product)} />
            <DetailItem label="Model" value={getProductModel(product)} />
            <DetailItem label="Color" value={inventory.color || "—"} />
            <DetailItem label="Size" value={inventory.size || "—"} />
            <DetailItem label="Quantity" value={inventory.quantity} />
            <DetailItem label="Min Stock" value={inventory.minStock} />
            <DetailItem label="Max Stock" value={inventory.maxStock ?? "No limit"} />
            <DetailItem label="Purchase Price" value={formatMoney(inventory.purchasePrice)} />
            <DetailItem label="Sale Price" value={formatMoney(inventory.salePrice)} />
            <DetailItem label="Discount" value={`${inventory.discount || 0}%`} />
            <DetailItem label="Tax" value={inventory.tax || 0} />
            <DetailItem label="Stock Status" value={getStockStatus(inventory).label} />
          </div>

          {/* SERIAL UNITS – only for trackSerial products (mobiles) */}
          {trackSerial && (
            <div className="border-t border-secondary p-4 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <Smartphone size={18} className="text-brand" />
                <h3 className="font-semibold text-primary">Serial / IMEI Units</h3>
              </div>

              {/* Add unit form */}
              <form onSubmit={handleAddUnit} className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <label className="mb-1.5 block text-xs font-medium text-primary">
                    IMEI <span className="text-[var(--color-danger)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={imei}
                    onChange={(e) => setImei(e.target.value)}
                    placeholder="e.g. 356938035643809"
                    className="h-10 w-full rounded-xl border border-primary bg-surface px-3 text-sm text-primary outline-none focus:border-brand"
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="mb-1.5 block text-xs font-medium text-primary">
                    Serial Number (optional)
                  </label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="Optional"
                    className="h-10 w-full rounded-xl border border-primary bg-surface px-3 text-sm text-primary outline-none focus:border-brand"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="submit"
                    disabled={isCreatingUnit}
                    className="inline-flex h-10 w-full items-center justify-center gap-2"
                  >
                    {isCreatingUnit ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Plus size={16} />
                    )}
                    Add Unit
                  </Button>
                </div>
              </form>

              {/* Units list */}
              {unitsLoading ? (
                <p className="text-sm text-secondary">Loading units…</p>
              ) : units.length === 0 ? (
                <p className="text-sm text-secondary">No serial units added yet.</p>
              ) : (
                <div className="space-y-2">
                  {units.map((unit) => (
                    <div
                      key={unit._id}
                      className="flex items-center justify-between rounded-xl border border-primary bg-surface px-4 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <Hash size={14} className="text-secondary" />
                        <span className="font-mono text-sm font-medium text-primary">
                          {unit.imei}
                        </span>
                        {unit.serialNumber && (
                          <span className="text-xs text-secondary">
                            · {unit.serialNumber}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteUnit(unit._id)}
                        disabled={isDeletingUnit}
                        className="rounded-lg border border-[var(--color-danger)]/20 p-1.5 text-[var(--color-danger)] transition hover:bg-[var(--color-danger)]/10"
                        title="Delete unit"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-secondary p-4 sm:flex-row sm:justify-end sm:p-5">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
          <Button
            type="button"
            onClick={onEdit}
            className="inline-flex w-full items-center justify-center gap-2 sm:w-auto"
          >
            <Pencil size={16} />
            Edit Inventory
          </Button>
        </div>
      </div>
    </div>
  );
}

// ======================================================
// SMALL UI HELPERS
// ======================================================

function FormField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  min,
  max,
  step,
  disabled = false,
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-medium text-primary">
        {label}
        {required && <span className="ml-1 text-[var(--color-danger)]">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="h-11 w-full rounded-xl border border-primary bg-surface px-4 text-sm text-primary outline-none transition focus:border-brand disabled:opacity-60"
      />
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-secondary">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-primary" title={String(value ?? "")}>
        {value}
      </p>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl border border-primary bg-surface p-3 sm:p-4">
      <p className="text-xs text-secondary">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-primary" title={String(value ?? "")}>
        {value}
      </p>
    </div>
  );
}

function InventorySkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 8 }).map((_, j) => (
            <td key={j} className="px-5 py-5">
              <div className="h-4 animate-pulse rounded bg-muted-action" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}