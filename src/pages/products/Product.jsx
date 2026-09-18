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
} from "lucide-react";

import PageHeader from "@/components/common/PageHeader";
import Button from "@/components/ui/Button";
import ConfirmModal from "../../components/modals/ConfirmModal";

import {
  useGetProductsQuery,
  useDeleteProductMutation,
  useRestoreProductMutation,
} from "../../features/products/productApi";


// ======================================================
// PERMISSIONS
// ======================================================

const PERMISSIONS = {
  CREATE: "products.create",
  READ: "products.read",
  UPDATE: "products.update",
  DELETE: "products.delete",
};


// ======================================================
// PRODUCT PAGE
// ======================================================

const Product = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [deleteModal, setDeleteModal] = useState(null);
  const [restoreModal, setRestoreModal] = useState(null);

  // ====================================================
  // API
  // ====================================================

  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useGetProductsQuery({
    search: search || undefined,
    status:
      statusFilter === "all"
        ? undefined
        : statusFilter,
  });

  const [deleteProduct, { isLoading: isDeleting }] =
    useDeleteProductMutation();

  const [restoreProduct, { isLoading: isRestoring }] =
    useRestoreProductMutation();


  // ====================================================
  // EXTRACT PRODUCTS
  // ====================================================

  const products = useMemo(() => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.products)) {
      return data.products;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    return [];
  }, [data]);


  // ====================================================
  // CLIENT SIDE FILTER
  // ====================================================

  const filteredProducts = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !searchValue ||
        product?.name
          ?.toLowerCase()
          .includes(searchValue) ||
        product?.sku
          ?.toLowerCase()
          .includes(searchValue) ||
        product?.barcode
          ?.toLowerCase()
          .includes(searchValue) ||
        product?.brand?.name
          ?.toLowerCase()
          .includes(searchValue) ||
        product?.model?.name
          ?.toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          product?.isActive === true) ||
        (statusFilter === "inactive" &&
          product?.isActive === false);

      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);


  // ====================================================
  // DELETE
  // ====================================================

  const handleDelete = async () => {
    if (!deleteModal?._id) return;

    try {
      await deleteProduct(deleteModal._id).unwrap();

      toast.success("Product deleted successfully");

      setDeleteModal(null);
    } catch (error) {
      toast.error(
        error?.data?.message ||
        error?.message ||
        "Failed to delete product"
      );
    }
  };


  // ====================================================
  // RESTORE
  // ====================================================

  const handleRestore = async () => {
    if (!restoreModal?._id) return;

    try {
      await restoreProduct(restoreModal._id).unwrap();

      toast.success("Product restored successfully");

      setRestoreModal(null);
    } catch (error) {
      toast.error(
        error?.data?.message ||
        error?.message ||
        "Failed to restore product"
      );
    }
  };


  // ====================================================
  // LOADING
  // ====================================================

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Products"
          description="Manage your products and inventory catalog."
        />

        <div className="rounded-xl border border-border bg-background p-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />

          <p className="mt-4 text-sm text-muted-foreground">
            Loading products...
          </p>
        </div>
      </div>
    );
  }


  // ====================================================
  // ERROR
  // ====================================================

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Products"
          description="Manage your products and inventory catalog."
        />

        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
          <Package className="mx-auto h-10 w-10 text-red-500" />

          <h3 className="mt-3 text-lg font-semibold">
            Failed to load products
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            {error?.data?.message ||
              "Something went wrong while loading products."}
          </p>
        </div>
      </div>
    );
  }


  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="space-y-6">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Products
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage products, pricing, brands, models and catalog information.
          </p>
        </div>

        <Link to="/products/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>


      {/* ==================================================
          FILTERS
      ================================================== */}

      <div className="rounded-xl border border-border bg-background p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          {/* Search */}

          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, SKU, barcode, brand..."
              className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none transition focus:border-primary"
            />
          </div>


          {/* Status */}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          >
            <option value="all">
              All Status
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>
          </select>

        </div>
      </div>


      {/* ==================================================
          SUMMARY
      ================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Total Products
              </p>

              <h3 className="mt-2 text-2xl font-bold">
                {products.length}
              </h3>
            </div>

            <div className="rounded-lg bg-primary/10 p-3">
              <Package className="h-5 w-5 text-primary" />
            </div>
          </div>
        </div>


        <div className="rounded-xl border border-border bg-background p-5">
          <p className="text-sm text-muted-foreground">
            Active Products
          </p>

          <h3 className="mt-2 text-2xl font-bold">
            {
              products.filter(
                (product) =>
                  product?.isActive === true
              ).length
            }
          </h3>
        </div>


        <div className="rounded-xl border border-border bg-background p-5">
          <p className="text-sm text-muted-foreground">
            Inactive Products
          </p>

          <h3 className="mt-2 text-2xl font-bold">
            {
              products.filter(
                (product) =>
                  product?.isActive === false
              ).length
            }
          </h3>
        </div>

      </div>


      {/* ==================================================
          TABLE
      ================================================== */}

      <div className="overflow-hidden rounded-xl border border-border bg-background">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1200px] text-sm">

            <thead className="border-b border-border bg-muted/40">

              <tr>

                <th className="px-4 py-3 text-left font-semibold">
                  Product
                </th>

                <th className="px-4 py-3 text-left font-semibold">
                  SKU
                </th>

                <th className="px-4 py-3 text-left font-semibold">
                  Category
                </th>

                <th className="px-4 py-3 text-left font-semibold">
                  Brand
                </th>

                <th className="px-4 py-3 text-left font-semibold">
                  Model
                </th>

                <th className="px-4 py-3 text-right font-semibold">
                  Purchase
                </th>

                <th className="px-4 py-3 text-right font-semibold">
                  Sale
                </th>

                <th className="px-4 py-3 text-center font-semibold">
                  Status
                </th>

                <th className="px-4 py-3 text-right font-semibold">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody className="divide-y divide-border">

              {filteredProducts.length === 0 ? (

                <tr>
                  <td
                    colSpan="9"
                    className="px-4 py-12 text-center"
                  >
                    <Package className="mx-auto h-10 w-10 text-muted-foreground" />

                    <p className="mt-3 font-medium">
                      No products found
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Try changing your search or filters.
                    </p>
                  </td>
                </tr>

              ) : (

                filteredProducts.map((product) => (

                  <tr
                    key={product._id}
                    className="transition hover:bg-muted/30"
                  >

                    {/* Product */}

                    <td className="px-4 py-4">

                      <div className="flex items-center gap-3">

                        <div className="h-11 w-11 overflow-hidden rounded-lg border border-border bg-muted">

                          {product?.images?.[0]?.url ? (
                            <img
                              src={product.images[0].url}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}

                        </div>

                        <div className="min-w-0">

                          <p className="truncate font-semibold">
                            {product?.name || "—"}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {product?.productType || "simple"}
                          </p>

                        </div>

                      </div>

                    </td>


                    {/* SKU */}

                    <td className="px-4 py-4">
                      <span className="font-mono text-xs">
                        {product?.sku || "—"}
                      </span>
                    </td>


                    {/* Category */}

                    <td className="px-4 py-4">
                      {product?.category?.name || "—"}
                    </td>


                    {/* Brand */}

                    <td className="px-4 py-4">
                      {product?.brand?.name || "—"}
                    </td>


                    {/* Model */}

                    <td className="px-4 py-4">
                      {product?.model?.name || "—"}
                    </td>


                    {/* Purchase */}

                    <td className="px-4 py-4 text-right">
                      {Number(
                        product?.purchasePrice || 0
                      ).toLocaleString()}
                    </td>


                    {/* Sale */}

                    <td className="px-4 py-4 text-right font-semibold">
                      {Number(
                        product?.salePrice || 0
                      ).toLocaleString()}
                    </td>


                    {/* Status */}

                    <td className="px-4 py-4 text-center">

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${product?.isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                          }`}
                      >
                        {product?.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>

                    </td>


                    {/* Actions */}

                    <td className="px-4 py-4">

                      <div className="flex justify-end gap-2">

                        {/* View */}

                        <Link
                          to={`/products/${product._id}`}
                          className="rounded-lg border border-border p-2 transition hover:bg-muted"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>


                        {/* Edit */}

                        <Link
                          to={`/products/${product._id}/edit`}
                          className="rounded-lg border border-border p-2 transition hover:bg-muted"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>


                        {/* Restore */}

                        {!product?.isActive && (
                          <button
                            type="button"
                            onClick={() =>
                              setRestoreModal(product)
                            }
                            className="rounded-lg border border-border p-2 transition hover:bg-muted"
                            title="Restore"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}


                        {/* Delete */}

                        {product?.isActive && (
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteModal(product)
                            }
                            className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
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


        {/* Fetching indicator */}

        {isFetching && !isLoading && (
          <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
            Updating products...
          </div>
        )}

      </div>


      {/* ==================================================
          DELETE MODAL
      ================================================== */}

      <ConfirmModal
        open={Boolean(deleteModal)}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        description={
          deleteModal
            ? `Are you sure you want to delete "${deleteModal.name}"?`
            : "Are you sure you want to delete this product?"
        }
        confirmText="Delete"
        loading={isDeleting}
        danger
      />


      {/* ==================================================
          RESTORE MODAL
      ================================================== */}

      <ConfirmModal
        open={Boolean(restoreModal)}
        onClose={() => setRestoreModal(null)}
        onConfirm={handleRestore}
        title="Restore Product"
        description={
          restoreModal
            ? `Are you sure you want to restore "${restoreModal.name}"?`
            : "Are you sure you want to restore this product?"
        }
        confirmText="Restore"
        loading={isRestoring}
      />

    </div>
  );
};

export default Product;