import { useEffect,useMemo, useState } from "react";
import { useSelector } from "react-redux";
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
  useGetProductsQuery,
} from "../../features/products/productApi";

// ======================================================
// HELPERS
// ======================================================

const getProductName = (product) => {
  if (!product) return "Unknown Product";

  return product.name || "Unknown Product";
};

const getProductSku = (product) => {
  return product?.sku || "-";
};

const getProductBrand = (product) => {
  if (!product?.brand) return "-";

  if (typeof product.brand === "object") {
    return product.brand.name || "-";
  }

  return product.brand;
};

const getProductModel = (product) => {
  if (!product?.model) return "-";

  if (typeof product.model === "object") {
    return product.model.name || "-";
  }

  return product.model;
};

const getStockStatus = (item) => {
  const quantity = Number(item?.quantity || 0);
  const minStock = Number(item?.minStock || 0);

  if (quantity <= 0) {
    return {
      label: "Out of Stock",
      className:
        "border-red-500/20 bg-red-500/10 text-red-500",
      icon: XCircle,
    };
  }

  if (quantity <= minStock) {
    return {
      label: "Low Stock",
      className:
        "border-yellow-500/20 bg-yellow-500/10 text-yellow-500",
      icon: AlertTriangle,
    };
  }

  return {
    label: "In Stock",
    className:
      "border-green-500/20 bg-green-500/10 text-green-500",
    icon: CheckCircle,
  };
};

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function ProductInventory() {
      const user = useSelector((state) => state.auth.user);
  const [search, setSearch] = useState("");
  const [stockStatus, setStockStatus] = useState("");
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editingInventory, setEditingInventory] = useState(null);
  const [selectedInventory, setSelectedInventory] = useState(null);

  // ====================================================
  // GET INVENTORY
  // ====================================================

  const {
    data: inventoryResponse,
    isLoading,
    isFetching,
    refetch,
  } = useGetProductInventoryQuery({
    page,
    limit: 20,
    search,
    stockStatus,
  });

  // ====================================================
  // GET PRODUCTS
  // ====================================================

  const {
    data: productResponse,
    isLoading: productsLoading,
  } = useGetProductsQuery({
    page: 1,
    limit: 100,
  });

  // ====================================================
  // MUTATIONS
  // ====================================================

  const [createProductInventory, { isLoading: isCreating }] =
    useCreateProductInventoryMutation();

  const [updateProductInventory, { isLoading: isUpdating }] =
    useUpdateProductInventoryMutation();

  const [deleteProductInventory, { isLoading: isDeleting }] =
    useDeleteProductInventoryMutation();

  // ====================================================
  // RESPONSE DATA
  // ====================================================

  const inventory =
    inventoryResponse?.data?.inventory ||
    inventoryResponse?.inventory ||
    [];

    // ====================================================
// DEBUG TENANT ISOLATION
// ====================================================

useEffect(() => {
  console.group(
    "========== PRODUCT INVENTORY ISOLATION DEBUG =========="
  );

  console.log("LOGGED-IN USER:", user);

  console.log("USER ID:", user?._id);

  console.log("USER NAME:", user?.name);

  console.log("USER EMAIL:", user?.email);

  console.log("USER ROLE:", user?.role);

  console.log("USER BUSINESS:", user?.business);

  console.log(
    "USER BUSINESS TYPE:",
    user?.businessType
  );

  console.log(
    "USER CREATED BY:",
    user?.createdBy
  );

  console.log(
    "INVENTORY API RESPONSE:",
    inventoryResponse
  );

  console.log(
    "TOTAL INVENTORIES:",
    inventory.length
  );

  console.log(
    "ALL INVENTORIES:",
    inventory
  );

  inventory.forEach((item, index) => {
    console.group(
      `Inventory ${index + 1}`
    );

    console.log(
      "Inventory ID:",
      item?._id
    );

    console.log(
      "Inventory Business:",
      item?.business
    );

    console.log(
      "Product ID:",
      item?.product?._id
    );

    console.log(
      "Product Name:",
      item?.product?.name
    );

    console.log(
      "Product SKU:",
      item?.product?.sku
    );

    console.log(
      "Product Business:",
      item?.product?.business
    );

    console.log(
      "Product Business Type:",
      item?.product?.businessType
    );

    console.log(
      "Inventory Created By:",
      item?.createdBy
    );

    console.log(
      "Inventory Quantity:",
      item?.quantity
    );

    console.groupEnd();
  });

  console.groupEnd();
}, [user, inventoryResponse, inventory]);

  const pagination =
    inventoryResponse?.data?.pagination ||
    inventoryResponse?.pagination ||
    {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    };

  const products =
    productResponse?.data?.products ||
    productResponse?.products ||
    [];

  // ====================================================
  // SEARCH
  // ====================================================

  const filteredInventory = useMemo(() => {
    if (!search.trim()) {
      return inventory;
    }

    const value = search.toLowerCase().trim();

    return inventory.filter((item) => {
      const product = item.product;

      return (
        getProductName(product)
          .toLowerCase()
          .includes(value) ||
        getProductSku(product)
          .toLowerCase()
          .includes(value) ||
        getProductBrand(product)
          .toLowerCase()
          .includes(value) ||
        getProductModel(product)
          .toLowerCase()
          .includes(value) ||
        String(item.color || "")
          .toLowerCase()
          .includes(value) ||
        String(item.size || "")
          .toLowerCase()
          .includes(value)
      );
    });
  }, [inventory, search]);

  // ====================================================
  // OPEN CREATE FORM
  // ====================================================

  const handleCreate = () => {
    setEditingInventory(null);
    setShowForm(true);
  };

  // ====================================================
  // OPEN EDIT FORM
  // ====================================================

  const handleEdit = (item) => {
    setSelectedInventory(null);
    setEditingInventory(item);
    setShowForm(true);
  };

  // ====================================================
  // CLOSE FORM
  // ====================================================

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingInventory(null);
  };

  // ====================================================
  // SUBMIT
  // ====================================================

  const handleSubmit = async (formData) => {
    try {
      if (editingInventory) {
        await updateProductInventory({
          id: editingInventory._id,
          ...formData,
          product:
            editingInventory.product?._id ||
            editingInventory.product,
        }).unwrap();

        toast.success(
          "Product inventory updated successfully."
        );
      } else {
        await createProductInventory(formData).unwrap();

        toast.success(
          "Product inventory created successfully."
        );
      }

      handleCloseForm();
    } catch (error) {
      toast.error(
        error?.data?.message ||
          "Something went wrong."
      );
    }
  };

  // ====================================================
  // DELETE
  // ====================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this inventory?"
    );

    if (!confirmed) return;

    try {
      await deleteProductInventory(id).unwrap();

      if (selectedInventory?._id === id) {
        setSelectedInventory(null);
      }

      toast.success(
        "Product inventory deleted successfully."
      );
    } catch (error) {
      toast.error(
        error?.data?.message ||
          "Failed to delete inventory."
      );
    }
  };

  // ====================================================
  // PAGE CHANGE
  // ====================================================

  const handlePageChange = (newPage) => {
    if (
      newPage < 1 ||
      newPage > pagination.totalPages
    ) {
      return;
    }

    setPage(newPage);
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="min-w-0 space-y-6">

      {/* ==================================================
          HEADER
      ================================================== */}

      <PageHeader
        title="Product Inventory"
        description="Manage product stock, variants, pricing and inventory levels."
      >
        <Button
          type="button"
          onClick={handleCreate}
          className="w-full gap-2 sm:w-auto"
        >
          <Plus size={18} />
          Add Inventory
        </Button>
      </PageHeader>

      {/* ==================================================
          SUMMARY CARDS
      ================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Inventory"
          value={pagination.total}
          icon={Boxes}
        />

        <SummaryCard
          title="In Stock"
          value={
            inventory.filter(
              (item) =>
                Number(item.quantity || 0) >
                Number(item.minStock || 0)
            ).length
          }
          icon={CheckCircle}
        />

        <SummaryCard
          title="Low Stock"
          value={
            inventory.filter(
              (item) =>
                Number(item.quantity || 0) > 0 &&
                Number(item.quantity || 0) <=
                  Number(item.minStock || 0)
            ).length
          }
          icon={AlertTriangle}
        />

        <SummaryCard
          title="Out of Stock"
          value={
            inventory.filter(
              (item) =>
                Number(item.quantity || 0) === 0
            ).length
          }
          icon={XCircle}
        />
      </div>

      {/* ==================================================
          FILTERS
      ================================================== */}

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="relative w-full lg:max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search product, SKU, brand..."
              className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none transition focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex">
            <select
              value={stockStatus}
              onChange={(e) => {
                setStockStatus(e.target.value);
                setPage(1);
              }}
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary sm:min-w-[150px]"
            >
              <option value="">All Stock</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">
                Out of Stock
              </option>
            </select>

            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium transition hover:bg-muted lg:w-auto"
            >
              <RefreshCw
                size={17}
                className={
                  isFetching
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================
          TABLE
      ================================================== */}

      <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">

            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-5 py-4 text-left font-semibold">
                  Product
                </th>

                <th className="px-5 py-4 text-left font-semibold">
                  SKU
                </th>

                <th className="px-5 py-4 text-left font-semibold">
                  Variant
                </th>

                <th className="px-5 py-4 text-left font-semibold">
                  Quantity
                </th>

                <th className="px-5 py-4 text-left font-semibold">
                  Purchase
                </th>

                <th className="px-5 py-4 text-left font-semibold">
                  Sale
                </th>

                <th className="px-5 py-4 text-left font-semibold">
                  Status
                </th>

                <th className="px-5 py-4 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">

              {isLoading ? (
                <InventorySkeleton />
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <Package
                        size={42}
                        className="mb-3 text-muted-foreground"
                      />

                      <h3 className="text-base font-semibold">
                        No inventory found
                      </h3>

                      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        Add inventory for one of your products to start managing stock.
                      </p>

                      <Button
                        type="button"
                        onClick={handleCreate}
                        className="mt-5 gap-2"
                      >
                        <Plus size={17} />
                        Add Inventory
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const status = getStockStatus(item);
                  const StatusIcon = status.icon;
                  const product = item.product;

                  return (
                    <tr
                      key={item._id}
                      className="transition hover:bg-muted/30"
                    >
                      {/* Product */}

                      <td className="px-5 py-4">
                        <p className="max-w-[260px] truncate font-semibold">
                          {getProductName(product)}
                        </p>
                      </td>

                      {/* SKU */}

                      <td className="px-5 py-4">
                        <span className="font-mono text-xs">
                          {getProductSku(product)}
                        </span>
                      </td>

                      {/* Variant */}

                      <td className="px-5 py-4">
                        {item.color || item.size ? (
                          <div className="flex max-w-[220px] flex-wrap gap-1.5">
                            {item.color && (
                              <span className="rounded-lg border border-border bg-muted px-2.5 py-1 text-xs">
                                Color: {item.color}
                              </span>
                            )}

                            {item.size && (
                              <span className="rounded-lg border border-border bg-muted px-2.5 py-1 text-xs">
                                Size: {item.size}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            No Variant
                          </span>
                        )}
                      </td>

                      {/* Quantity */}

                      <td className="px-5 py-4">
                        <div className="whitespace-nowrap">
                          <span className="font-semibold">
                            {item.quantity}
                          </span>

                          <span className="ml-2 text-xs text-muted-foreground">
                            / min {item.minStock}
                          </span>
                        </div>
                      </td>

                      {/* Purchase */}

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-medium">
                          {Number(
                            item.purchasePrice || 0
                          ).toLocaleString()}
                        </span>
                      </td>

                      {/* Sale */}

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-medium">
                          {Number(
                            item.salePrice || 0
                          ).toLocaleString()}
                        </span>
                      </td>

                      {/* Status */}

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${status.className}`}
                        >
                          <StatusIcon size={14} />
                          {status.label}
                        </span>
                      </td>

                      {/* Actions */}

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedInventory(item)
                            }
                            className="rounded-lg border border-border p-2 transition hover:bg-muted"
                            title="View Inventory"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(item)
                            }
                            className="rounded-lg border border-border p-2 transition hover:bg-muted"
                            title="Edit Inventory"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(item._id)
                            }
                            disabled={isDeleting}
                            className="rounded-lg border border-red-500/20 p-2 text-red-500 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Delete Inventory"
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

        {/* ==================================================
            PAGINATION
        ================================================== */}

        {pagination.totalPages > 1 && (
          <div className="flex flex-col gap-4 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">

            <p className="text-center text-sm text-muted-foreground sm:text-left">
              Page {pagination.page} of{" "}
              {pagination.totalPages}
            </p>

            <div className="flex w-full gap-2 sm:w-auto">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  handlePageChange(page - 1)
                }
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={
                  page >= pagination.totalPages
                }
                onClick={() =>
                  handlePageChange(page + 1)
                }
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================
          CREATE / EDIT FORM
      ================================================== */}

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

      {/* ==================================================
          VIEW INVENTORY
      ================================================== */}

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

function SummaryCard({
  title,
  value,
  icon: Icon,
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold">
            {value}
          </p>
        </div>

        <div className="shrink-0 rounded-xl bg-primary/10 p-3 text-primary">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

// ======================================================
// INVENTORY FORM
// ======================================================

function InventoryForm({
  products,
  productsLoading,
  inventory,
  loading,
  onClose,
  onSubmit,
}) {
  const isEdit = Boolean(inventory);

  const [form, setForm] = useState({
    product:
      inventory?.product?._id ||
      inventory?.product ||
      "",

    color: inventory?.color || "",
    size: inventory?.size || "",

    quantity:
      inventory?.quantity ?? 0,

    minStock:
      inventory?.minStock ?? 0,

    maxStock:
      inventory?.maxStock ?? "",

    purchasePrice:
      inventory?.purchasePrice ?? "",

    salePrice:
      inventory?.salePrice ?? "",

    discount:
      inventory?.discount ?? 0,

    tax:
      inventory?.tax ?? 0,
  });

  const selectedProduct = useMemo(() => {
    const product = products.find(
      (item) => item._id === form.product
    );

    if (product) {
      return product;
    }

    if (isEdit && inventory?.product) {
      return inventory.product;
    }

    return null;
  }, [
    products,
    form.product,
    isEdit,
    inventory,
  ]);

  const hasVariants =
    selectedProduct?.hasVariants === true;

  // ====================================================
  // CHANGE
  // ====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ====================================================
  // PRODUCT CHANGE
  // ====================================================

  const handleProductChange = (e) => {
    const productId = e.target.value;

    const product = products.find(
      (item) => item._id === productId
    );

    setForm((prev) => ({
      ...prev,
      product: productId,

      purchasePrice:
        product?.purchasePrice ?? "",

      salePrice:
        product?.salePrice ?? "",

      color: "",
      size: "",
    }));
  };

  // ====================================================
  // SUBMIT
  // ====================================================

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.product) {
      toast.error("Please select a product.");
      return;
    }

    if (
      form.quantity === "" ||
      Number(form.quantity) < 0
    ) {
      toast.error(
        "Please enter a valid quantity."
      );
      return;
    }

    if (
      form.minStock === "" ||
      Number(form.minStock) < 0
    ) {
      toast.error(
        "Please enter a valid minimum stock."
      );
      return;
    }

    if (
      form.maxStock !== "" &&
      Number(form.maxStock) <
        Number(form.minStock)
    ) {
      toast.error(
        "Maximum stock cannot be less than minimum stock."
      );
      return;
    }

    if (
      form.purchasePrice !== "" &&
      Number(form.purchasePrice) < 0
    ) {
      toast.error(
        "Purchase price cannot be negative."
      );
      return;
    }

    if (
      form.salePrice !== "" &&
      Number(form.salePrice) < 0
    ) {
      toast.error(
        "Sale price cannot be negative."
      );
      return;
    }

    if (
      Number(form.discount || 0) < 0 ||
      Number(form.discount || 0) > 100
    ) {
      toast.error(
        "Discount must be between 0 and 100."
      );
      return;
    }

    if (Number(form.tax || 0) < 0) {
      toast.error(
        "Tax cannot be negative."
      );
      return;
    }

    const payload = {
      product: form.product,

      color: hasVariants
        ? form.color.trim() || null
        : null,

      size: hasVariants
        ? form.size.trim() || null
        : null,

      quantity: Number(form.quantity),

      minStock: Number(form.minStock),

      maxStock:
        form.maxStock === ""
          ? null
          : Number(form.maxStock),

      purchasePrice:
        form.purchasePrice === ""
          ? 0
          : Number(form.purchasePrice),

      salePrice:
        form.salePrice === ""
          ? 0
          : Number(form.salePrice),

      discount: Number(
        form.discount || 0
      ),

      tax: Number(form.tax || 0),
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4">

      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full min-w-0 max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:max-h-[calc(100dvh-2rem)]">

        {/* Header */}

        <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-4 border-b border-border bg-card px-4 py-4 sm:px-6 sm:py-5">

          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold sm:text-xl">
              {isEdit
                ? "Update Product Inventory"
                : "Add Product Inventory"}
            </h2>

            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              {isEdit
                ? "Update stock and pricing information."
                : "Add stock and pricing information for a product."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 transition hover:bg-muted"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 p-4 sm:p-6"
          >

            {/* Product */}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Product
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <select
                name="product"
                value={form.product}
                onChange={handleProductChange}
                disabled={
                  isEdit ||
                  productsLoading
                }
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  {productsLoading
                    ? "Loading products..."
                    : "Select Product"}
                </option>

                {products.map((product) => (
                  <option
                    key={product._id}
                    value={product._id}
                  >
                    {getProductName(product)}
                    {" — "}
                    {getProductSku(product)}
                  </option>
                ))}
              </select>

              {selectedProduct && (
                <div className="mt-3 rounded-xl border border-border bg-muted/30 p-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <InfoItem
                      label="Product"
                      value={getProductName(
                        selectedProduct
                      )}
                    />

                    <InfoItem
                      label="Brand"
                      value={getProductBrand(
                        selectedProduct
                      )}
                    />

                    <InfoItem
                      label="Model"
                      value={getProductModel(
                        selectedProduct
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Variant */}

            {hasVariants && (
              <div>
                <div className="mb-3">
                  <h3 className="font-semibold">
                    Product Variant
                  </h3>

                  <p className="text-xs text-muted-foreground">
                    Add color and size for this inventory variant.
                  </p>
                </div>

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

            {/* Stock */}

            <div>
              <div className="mb-3">
                <h3 className="font-semibold">
                  Stock Information
                </h3>

                <p className="text-xs text-muted-foreground">
                  Configure current and stock-limit values.
                </p>
              </div>

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

            {/* Pricing */}

            <div>
              <div className="mb-3">
                <h3 className="font-semibold">
                  Pricing
                </h3>

                <p className="text-xs text-muted-foreground">
                  Set inventory-level purchase and selling prices.
                </p>
              </div>

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

            {/* Buttons */}

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={loading}
                className="w-full gap-2 sm:w-auto"
              >
                {loading ? (
                  <>
                    <RefreshCw
                      size={17}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus size={17} />
                    {isEdit
                      ? "Update Inventory"
                      : "Add Inventory"}
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
// FORM FIELD
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
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-medium">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
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
        className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
      />
    </div>
  );
}

// ======================================================
// INFO ITEM
// ======================================================

function InfoItem({
  label,
  value,
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p
        className="mt-1 truncate text-sm font-medium"
        title={String(value ?? "")}
      >
        {value}
      </p>
    </div>
  );
}

// ======================================================
// INVENTORY DETAILS
// ======================================================

function InventoryDetails({
  inventory,
  onClose,
  onEdit,
}) {
  const product = inventory?.product;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-4">

      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full min-w-0 max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:max-h-[calc(100dvh-2rem)]">

        {/* Header */}

        <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-4 border-b border-border bg-card px-4 py-4 sm:px-6 sm:py-5">

          <div className="min-w-0">
            <h2 className="text-lg font-bold sm:text-xl">
              Inventory Details
            </h2>

            <p
              className="mt-1 truncate text-sm text-muted-foreground"
              title={getProductName(product)}
            >
              {getProductName(product)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 transition hover:bg-muted"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Details */}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-6">

            <DetailItem
              label="Product"
              value={getProductName(product)}
            />

            <DetailItem
              label="SKU"
              value={getProductSku(product)}
            />

            <DetailItem
              label="Brand"
              value={getProductBrand(product)}
            />

            <DetailItem
              label="Model"
              value={getProductModel(product)}
            />

            <DetailItem
              label="Color"
              value={
                inventory.color ||
                "No Variant"
              }
            />

            <DetailItem
              label="Size"
              value={
                inventory.size ||
                "No Variant"
              }
            />

            <DetailItem
              label="Quantity"
              value={inventory.quantity}
            />

            <DetailItem
              label="Minimum Stock"
              value={inventory.minStock}
            />

            <DetailItem
              label="Maximum Stock"
              value={
                inventory.maxStock ??
                "No Limit"
              }
            />

            <DetailItem
              label="Purchase Price"
              value={Number(
                inventory.purchasePrice || 0
              ).toLocaleString()}
            />

            <DetailItem
              label="Sale Price"
              value={Number(
                inventory.salePrice || 0
              ).toLocaleString()}
            />

            <DetailItem
              label="Discount"
              value={`${inventory.discount || 0}%`}
            />

            <DetailItem
              label="Tax"
              value={inventory.tax || 0}
            />

            <DetailItem
              label="Stock Status"
              value={
                getStockStatus(inventory).label
              }
            />
          </div>
        </div>

        {/* Footer */}

        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-border bg-card p-4 sm:flex-row sm:justify-end sm:p-5">

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Close
          </Button>

          <Button
            type="button"
            onClick={onEdit}
            className="w-full gap-2 sm:w-auto"
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
// DETAIL ITEM
// ======================================================

function DetailItem({
  label,
  value,
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p
        className="mt-1 break-words text-sm font-semibold"
        title={String(value ?? "")}
      >
        {value}
      </p>
    </div>
  );
}

// ======================================================
// SKELETON
// ======================================================

function InventorySkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map(
        (_, index) => (
          <tr key={index}>
            {Array.from({ length: 8 }).map(
              (_, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-5 py-5"
                >
                  <div className="h-4 animate-pulse rounded bg-muted" />
                </td>
              )
            )}
          </tr>
        )
      )}
    </>
  );
}