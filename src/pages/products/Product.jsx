import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  RotateCcw,
  Search,
  Package,
  Smartphone,
  RefreshCw,
  X,
} from "lucide-react";

import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/Button";
import ConfirmModal from "@/components/modals/ConfirmModal";

import { usePermissions } from "@/hooks/usePermissions";
import { getApiErrorMessage } from "@/utils/apiError";

import {
  useGetProductsQuery,
  useDeleteProductMutation,
  useRestoreProductMutation,
} from "@/features/products/productApi";

const PERMISSIONS = {
  CREATE: "products.create",
  UPDATE: "products.update",
  DELETE: "products.delete",
};

const formatMoney = (value) =>
  `Rs ${Number(value || 0).toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  })}`;

const toTitleCase = (value = "") =>
  String(value)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function Product() {
  const { can } = usePermissions();
  const canCreate = can(PERMISSIONS.CREATE);
  const canUpdate = can(PERMISSIONS.UPDATE);
  const canDelete = can(PERMISSIONS.DELETE);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [viewing, setViewing] = useState(null);

  const queryArgs = useMemo(() => {
    const params = {
      page,
      limit: 20,
    };
    if (search.trim()) params.search = search.trim();
    if (statusFilter === "active") params.isActive = true;
    if (statusFilter === "inactive") params.isActive = false;
    return params;
  }, [page, search, statusFilter]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetProductsQuery(queryArgs);

  const [deleteProduct, { isLoading: isDeleting }] =
    useDeleteProductMutation();
  const [restoreProduct, { isLoading: isRestoring }] =
    useRestoreProductMutation();

  const products = useMemo(() => {
    if (Array.isArray(data?.products)) return data.products;
    if (Array.isArray(data?.data?.products)) return data.data.products;
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  const pagination = data?.pagination || {
    page: 1,
    limit: 20,
    total: products.length,
    totalPages: 1,
  };

  const activeCount = products.filter((p) => p.isActive).length;
  const inactiveCount = products.filter((p) => !p.isActive).length;
  const serialCount = products.filter((p) => p.trackSerial).length;

  async function handleDelete() {
    if (!deleteTarget?._id) return;
    try {
      await deleteProduct(deleteTarget._id).unwrap();
      toast.success("Product deactivated successfully");
      setDeleteTarget(null);
      if (viewing?._id === deleteTarget._id) setViewing(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err) || "Failed to deactivate product");
    }
  }

  async function handleRestore() {
    if (!restoreTarget?._id) return;
    try {
      await restoreProduct(restoreTarget._id).unwrap();
      toast.success("Product restored successfully");
      setRestoreTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err) || "Failed to restore product");
    }
  }

  if (isLoading) {
    return (
      <div className="animate-fade-up space-y-6">
        <PageHeader
          title="Products"
          description="Manage your products and inventory catalog."
        />
        <div className="rounded-2xl border border-primary bg-card p-16 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="mt-4 text-sm text-secondary">Loading products…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="animate-fade-up space-y-6">
        <PageHeader
          title="Products"
          description="Manage your products and inventory catalog."
        />
        <div className="rounded-2xl border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 p-10 text-center">
          <Package className="mx-auto h-10 w-10 text-[var(--color-danger)]" />
          <h3 className="mt-3 text-lg font-semibold text-primary">
            Failed to load products
          </h3>
          <p className="mt-1 text-sm text-secondary">
            {error?.data?.message ||
              getApiErrorMessage(error) ||
              "Something went wrong."}
          </p>
          <Button onClick={() => refetch()} className="mt-5">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Products"
          description="Manage products, pricing, brands, models and serial tracking."
        />
        {canCreate && (
          <Link to="/products/create">
            <Button className="inline-flex w-full items-center justify-center gap-2 sm:w-auto">
              <Plus size={18} />
              Add Product
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total (page)"
          value={pagination.total ?? products.length}
          icon={Package}
        />
        <SummaryCard title="Active (page)" value={activeCount} icon={Package} />
        <SummaryCard
          title="Inactive (page)"
          value={inactiveCount}
          icon={Package}
        />
        <SummaryCard
          title="Serial / IMEI"
          value={serialCount}
          icon={Smartphone}
        />
      </div>

      <div className="rounded-2xl border border-primary bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, SKU, barcode…"
              className="h-11 w-full rounded-xl border border-primary bg-surface pl-10 pr-4 text-sm text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-11 rounded-xl border border-primary bg-surface px-4 text-sm text-primary outline-none focus:border-brand"
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-primary bg-surface px-4 text-sm font-medium text-primary transition hover:bg-muted-action"
            >
              <RefreshCw
                size={17}
                className={isFetching ? "animate-spin" : ""}
              />
              Refresh
            </button>

            {canCreate && (
              <Link to="/products/create" className="hidden sm:inline-flex">
                <Button className="inline-flex h-11 items-center gap-2">
                  <Plus size={17} />
                  Add Product
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div
        className={`min-w-0 overflow-hidden rounded-2xl border border-primary bg-card shadow-sm ${
          isFetching ? "opacity-80" : ""
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b border-secondary bg-surface">
              <tr>
                <th className="px-5 py-4 text-left font-semibold text-primary">
                  Product
                </th>
                <th className="px-5 py-4 text-left font-semibold text-primary">
                  SKU
                </th>
                <th className="px-5 py-4 text-left font-semibold text-primary">
                  Brand / Model
                </th>
                <th className="px-5 py-4 text-left font-semibold text-primary">
                  Type
                </th>
                <th className="px-5 py-4 text-right font-semibold text-primary">
                  Purchase
                </th>
                <th className="px-5 py-4 text-right font-semibold text-primary">
                  Sale
                </th>
                <th className="px-5 py-4 text-center font-semibold text-primary">
                  Status
                </th>
                <th className="px-5 py-4 text-right font-semibold text-primary">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border-secondary-color)]">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <Package
                      size={42}
                      className="mx-auto mb-3 text-secondary"
                    />
                    <h3 className="text-base font-semibold text-primary">
                      No products found
                    </h3>
                    <p className="mt-1 text-sm text-secondary">
                      {search || statusFilter !== "all"
                        ? "Try a different search or status filter."
                        : "Create your first product to get started."}
                    </p>
                    {canCreate && (
                      <Link to="/products/create">
                        <Button className="mt-5 inline-flex items-center gap-2">
                          <Plus size={17} />
                          Add Product
                        </Button>
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product._id}
                    className="transition hover:bg-surface"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-primary bg-surface">
                          {product?.images?.[0]?.url ? (
                            <img
                              src={product.images[0].url}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package
                                size={18}
                                className="text-secondary"
                              />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-primary">
                            {toTitleCase(product.name || "") || "—"}
                          </p>
                          {product.trackSerial && (
                            <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-brand">
                              <Smartphone size={12} />
                              Serial
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-mono text-xs text-primary">
                        {product.sku || "—"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-primary">
                        {toTitleCase(product?.brand?.name || "") || "—"}
                      </p>
                      <p className="text-xs text-secondary">
                        {toTitleCase(product?.model?.name || "") || "—"}
                      </p>
                    </td>

                    <td className="px-5 py-4 capitalize text-secondary">
                      {product.productType || "simple"}
                    </td>

                    <td className="px-5 py-4 text-right text-primary">
                      {formatMoney(product.purchasePrice)}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-primary">
                      {formatMoney(product.salePrice)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          product.isActive
                            ? "border border-[var(--color-success)]/20 bg-[var(--color-success)]/10 text-[var(--color-success)]"
                            : "border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
                        }`}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewing(product)}
                          className="rounded-lg border border-primary p-2 text-secondary transition hover:bg-muted-action hover:text-primary"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>

                        {canUpdate && (
                          <Link
                            to={`/products/${product._id}/edit`}
                            className="rounded-lg border border-primary p-2 text-secondary transition hover:bg-muted-action hover:text-brand"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </Link>
                        )}

                        {canUpdate && !product.isActive && (
                          <button
                            type="button"
                            onClick={() => setRestoreTarget(product)}
                            className="rounded-lg border border-primary p-2 text-secondary transition hover:bg-muted-action hover:text-primary"
                            title="Restore"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}

                        {canDelete && product.isActive && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(product)}
                            className="rounded-lg border border-[var(--color-danger)]/20 p-2 text-[var(--color-danger)] transition hover:bg-[var(--color-danger)]/10"
                            title="Deactivate"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex flex-col gap-4 border-t border-secondary px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-center text-sm text-secondary sm:text-left">
              Page {pagination.page} of {pagination.totalPages} ·{" "}
              {pagination.total} total
            </p>
            <div className="flex w-full gap-2 sm:w-auto">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex-1 rounded-lg border border-primary px-3 py-2 text-sm text-primary transition hover:bg-muted-action disabled:opacity-40 sm:flex-none"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex-1 rounded-lg border border-primary px-3 py-2 text-sm text-primary transition hover:bg-muted-action disabled:opacity-40 sm:flex-none"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {viewing && (
        <ProductDetailsModal
          product={viewing}
          canUpdate={canUpdate}
          onClose={() => setViewing(null)}
        />
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Deactivate product?"
        description={
          deleteTarget
            ? `"${toTitleCase(deleteTarget.name || "")}" will be set inactive (soft delete). You can restore it later from the Inactive filter.`
            : "Are you sure?"
        }
        confirmText="Deactivate"
        loading={isDeleting}
        danger
      />

      <ConfirmModal
        open={Boolean(restoreTarget)}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        title="Restore product?"
        description={
          restoreTarget
            ? `Restore "${toTitleCase(restoreTarget.name || "")}" and its inventory?`
            : "Are you sure?"
        }
        confirmText="Restore"
        loading={isRestoring}
      />
    </div>
  );
}

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

function ProductDetailsModal({ product, canUpdate, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4">
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-primary bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-secondary px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-primary">Product details</h2>
            <p className="mt-1 truncate text-sm text-secondary">
              {toTitleCase(product.name || "")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-secondary transition hover:bg-muted-action hover:text-primary"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-5 flex justify-center">
            {product?.images?.[0]?.url ? (
              <img
                src={product.images[0].url}
                alt={product.name}
                className="h-40 w-40 rounded-2xl border border-primary object-cover"
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-2xl border border-primary bg-surface">
                <Package size={40} className="text-secondary" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailItem label="Name" value={toTitleCase(product.name || "")} />
            <DetailItem label="SKU" value={product.sku} />
            <DetailItem
              label="Brand"
              value={toTitleCase(product?.brand?.name || "") || "—"}
            />
            <DetailItem
              label="Model"
              value={toTitleCase(product?.model?.name || "") || "—"}
            />
            <DetailItem
              label="Category"
              value={product?.category?.name || "—"}
            />
            <DetailItem label="Type" value={product.productType} />
            <DetailItem label="Unit" value={product.unit} />
            <DetailItem
              label="Serial tracking"
              value={product.trackSerial ? "Yes (IMEI)" : "No"}
            />
            <DetailItem
              label="Purchase price"
              value={formatMoney(product.purchasePrice)}
            />
            <DetailItem
              label="Sale price"
              value={formatMoney(product.salePrice)}
            />
            <DetailItem label="Discount" value={`${product.discount || 0}%`} />
            <DetailItem label="Tax" value={product.tax || 0} />
            <DetailItem
              label="Status"
              value={product.isActive ? "Active" : "Inactive"}
            />
            <DetailItem
              label="Featured"
              value={product.isFeatured ? "Yes" : "No"}
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-secondary p-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {canUpdate && (
            <Link to={`/products/${product._id}/edit`}>
              <Button className="inline-flex items-center gap-2">
                <Pencil size={16} />
                Edit product
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl border border-primary bg-surface p-3">
      <p className="text-xs text-secondary">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-primary">
        {value ?? "—"}
      </p>
    </div>
  );
}