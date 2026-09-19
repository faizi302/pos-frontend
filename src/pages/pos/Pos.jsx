import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Barcode,
  Banknote,
  Calculator,
  Check,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  Grid2X2,
  Loader2,
  Minus,
  Package,
  Pause,
  Percent,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingBag,
  Smartphone,
  Trash2,
  UserRound,
  WalletCards,
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { selectCurrentUser } from "../../features/auth/authSlice";
import {
  useGetProductsQuery,
} from "../../features/products/productApi";
import {
  useGetProductInventoryQuery,
} from "../../features/products/productInventoryApi";
import {
  useGetCategoriesQuery,
} from "../../features/category/categoryApi";
import {
  useGetCustomersQuery,
} from "../../features/customer/customerApi";
import {
  useGetCurrentCashRegisterQuery,
} from "../../features/cashRegister/cashRegisterApi";
import {
  useCreateSaleMutation,
  useUpdateSaleMutation,
} from "../../features/sales/saleApi";
import {
  useCreateSaleItemMutation,
} from "../../features/sales/saleItemApi";
import {
  useCreateSalePaymentMutation,
} from "../../features/sales/salePaymentApi";
import {
  useCreatePaymentMutation,
} from "../../features/payments/paymentApi";

// =====================================================
// CONSTANTS
// =====================================================

const PAYMENT_METHODS = [
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "card", label: "Card", icon: CreditCard },
  { id: "bank", label: "Bank Transfer", icon: WalletCards },
  { id: "mobile", label: "Mobile Wallet", icon: Smartphone },
  { id: "paypal", label: "PayPal", icon: CircleDollarSign },
];

const currency = (value) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatNumber = (value) =>
  new Intl.NumberFormat("en-PK").format(Number(value) || 0);

const roundMoney = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

// Sale/SalePayment backend uses the same manual payment enum.
// Mobile Wallet is represented as "other" because the current
// SalePayment controller does not allow "online" for manual payments.
const getBackendPaymentMethod = (method) => {
  if (method === "mobile") return "other";
  if (method === "paypal") return "online";
  return method;
};

// =====================================================
// HELPERS
// =====================================================

function getProductName(product) {
  return product?.name || "Unknown Product";
}

function getProductSku(product) {
  return product?.sku || "—";
}

function getProductBrand(product) {
  if (!product?.brand) return "—";
  return typeof product.brand === "object"
    ? product.brand.name || "—"
    : product.brand;
}

function getProductCategory(product) {
  if (!product?.category) return "—";
  return typeof product.category === "object"
    ? product.category.name || "—"
    : product.category;
}

function getStockStatus(qty, minStock = 0) {
  const quantity = Number(qty) || 0;
  const min = Number(minStock) || 0;

  if (quantity <= 0) {
    return {
      label: "Out of stock",
      className: "text-[var(--color-danger)] bg-[var(--color-danger)]/10",
      icon: XCircle,
    };
  }
  if (quantity <= min) {
    return {
      label: "Low stock",
      className: "text-[var(--color-warning)] bg-[var(--color-warning)]/10",
      icon: AlertTriangle,
    };
  }
  return {
    label: `${quantity} in stock`,
    className: "text-[var(--color-success)] bg-[var(--color-success)]/10",
    icon: CheckCircle2,
  };
}

function getProductInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase();
}

// =====================================================
// PRODUCT CARD
// =====================================================

function ProductCard({ product, inventoryItems, onAdd }) {
  const totalStock = inventoryItems.reduce(
    (sum, inv) => sum + (Number(inv.quantity) || 0),
    0
  );
  const minStock = inventoryItems[0]?.minStock ?? product.minStock ?? 0;
  const status = getStockStatus(totalStock, minStock);
  const price =
    inventoryItems[0]?.salePrice ??
    product.salePrice ??
    product.price ??
    0;

  return (
    <button
      type="button"
      onClick={() => onAdd(product, inventoryItems)}
      disabled={totalStock <= 0}
      className="group flex min-h-[210px] flex-col overflow-hidden rounded-2xl border border-primary bg-card text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-55"
    >
      <div className="relative flex h-24 items-center justify-center border-b border-secondary bg-surface">
        {product?.images?.[0]?.url ? (
          <img
            src={product.images[0].url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-base font-bold text-brand">
            {getProductInitials(product.name)}
          </div>
        )}

        <div className="absolute left-2.5 top-2.5 rounded-lg bg-card/90 px-2 py-0.5 text-[10px] font-semibold text-secondary shadow-sm backdrop-blur">
          {getProductBrand(product)}
        </div>

        <div
          className={`absolute right-2.5 top-2.5 rounded-lg px-2 py-0.5 text-[10px] font-semibold ${status.className}`}
        >
          {totalStock <= 0 ? "Out" : totalStock}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-primary">
          {getProductName(product)}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-secondary">
          SKU: {getProductSku(product)}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
          <div>
            <p className="text-base font-bold text-primary">
              {currency(price)}
            </p>
            <p className="text-[10px] text-secondary">
              {getProductCategory(product)}
            </p>
          </div>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white transition-colors group-hover:bg-brand-hover">
            <Plus size={15} />
          </span>
        </div>
      </div>
    </button>
  );
}

// =====================================================
// QUANTITY CONTROL
// =====================================================

function QuantityControl({ quantity, onDecrease, onIncrease, disabled }) {
  return (
    <div className="flex items-center overflow-hidden rounded-lg border border-primary">
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled}
        className="flex h-8 w-8 items-center justify-center text-secondary transition-colors hover:bg-surface hover:text-primary disabled:opacity-40"
      >
        <Minus size={14} />
      </button>
      <span className="flex h-8 min-w-8 items-center justify-center border-x border-primary px-1 text-xs font-semibold text-primary">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled}
        className="flex h-8 w-8 items-center justify-center text-secondary transition-colors hover:bg-surface hover:text-primary disabled:opacity-40"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

// =====================================================
// MODAL
// =====================================================

function Modal({ title, children, onClose, width = "max-w-lg" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div
        className={`w-full ${width} max-h-[90vh] overflow-hidden rounded-2xl border border-primary bg-card shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-secondary px-5 py-4">
          <h2 className="text-base font-bold text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-surface hover:text-primary"
          >
            <X size={17} />
          </button>
        </div>
        <div className="max-h-[calc(90vh-4rem)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// MAIN POS COMPONENT
// =====================================================

export default function POS() {
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);

  // -------------------------------------------------
  // UI STATE
  // -------------------------------------------------
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [heldOrders, setHeldOrders] = useState([]);
  const [lastSale, setLastSale] = useState(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showHeldModal, setShowHeldModal] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedInventoryItems, setSelectedInventoryItems] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // -------------------------------------------------
  // API QUERIES
  // -------------------------------------------------
  const {
    data: productsData,
    isLoading: productsLoading,
    isFetching: productsFetching,
    refetch: refetchProducts,
  } = useGetProductsQuery({
    search: search || undefined,
    limit: 100,
    isActive: true,
  });

  const {
    data: inventoryData,
    isLoading: inventoryLoading,
    refetch: refetchInventory,
  } = useGetProductInventoryQuery({
    page: 1,
    limit: 200,
  });

  const { data: categoriesData } = useGetCategoriesQuery({
    limit: 100,
    isActive: true,
  });

  const { data: customersData, isLoading: customersLoading } =
    useGetCustomersQuery({
      limit: 100,
      isActive: true,
    });

  const {
    data: currentRegister,
    isLoading: registerLoading,
    refetch: refetchRegister,
  } = useGetCurrentCashRegisterQuery();

  // -------------------------------------------------
  // MUTATIONS
  // -------------------------------------------------
  const [createSale] = useCreateSaleMutation();
  const [updateSale] = useUpdateSaleMutation();
  const [createSaleItem] = useCreateSaleItemMutation();
  const [createSalePayment] = useCreateSalePaymentMutation();
  const [createPayment] = useCreatePaymentMutation();

  // -------------------------------------------------
  // NORMALIZED DATA
  // -------------------------------------------------
  const products = useMemo(() => {
    if (Array.isArray(productsData?.products)) return productsData.products;
    if (Array.isArray(productsData)) return productsData;
    if (Array.isArray(productsData?.data?.products))
      return productsData.data.products;
    if (Array.isArray(productsData?.data)) return productsData.data;
    return [];
  }, [productsData]);

  const inventoryList = useMemo(() => {
    if (Array.isArray(inventoryData?.data?.inventory))
      return inventoryData.data.inventory;
    if (Array.isArray(inventoryData?.inventory)) return inventoryData.inventory;
    if (Array.isArray(inventoryData?.data)) return inventoryData.data;
    return [];
  }, [inventoryData]);

  const categories = useMemo(() => {
    if (Array.isArray(categoriesData?.categories))
      return categoriesData.categories;
    if (Array.isArray(categoriesData)) return categoriesData;
    if (Array.isArray(categoriesData?.data?.categories))
      return categoriesData.data.categories;
    if (Array.isArray(categoriesData?.data)) return categoriesData.data;
    return [];
  }, [categoriesData]);

  const customers = useMemo(() => {
    if (Array.isArray(customersData?.customers)) return customersData.customers;
    if (Array.isArray(customersData)) return customersData;
    if (Array.isArray(customersData?.data?.customers))
      return customersData.data.customers;
    if (Array.isArray(customersData?.data)) return customersData.data;
    return [];
  }, [customersData]);

  // Default walk-in customer
  useEffect(() => {
    if (!selectedCustomer && customers.length > 0) {
      const walkIn = customers.find(
        (c) =>
          c.name?.toLowerCase().includes("walk") ||
          c.type === "Walk-in" ||
          !c.phone
      );
      setSelectedCustomer(walkIn || customers[0]);
    }
  }, [customers, selectedCustomer]);

  // Inventory grouped by product
  const inventoryByProduct = useMemo(() => {
    const map = new Map();
    inventoryList.forEach((inv) => {
      const productId =
        inv.product?._id || inv.product || inv.productId;
      if (!productId) return;
      const key = String(productId);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(inv);
    });
    return map;
  }, [inventoryList]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products.filter((product) => {
      if (product.isActive === false) return false;

      const matchesCategory =
        categoryId === "all" ||
        String(product.category?._id || product.category) ===
        String(categoryId);

      if (!matchesCategory) return false;

      if (!term) return true;

      const name = (product.name || "").toLowerCase();
      const sku = (product.sku || "").toLowerCase();
      const barcode = (product.barcode || "").toLowerCase();
      const brand = getProductBrand(product).toLowerCase();

      return (
        name.includes(term) ||
        sku.includes(term) ||
        barcode.includes(term) ||
        brand.includes(term)
      );
    });
  }, [products, search, categoryId]);

  const customerResults = useMemo(() => {
    const term = customerSearch.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(term) ||
        (c.phone || "").includes(term)
    );
  }, [customers, customerSearch]);

  // -------------------------------------------------
  // CART CALCULATIONS
  // -------------------------------------------------
  const subtotal = useMemo(
    () =>
      roundMoney(
        cart.reduce(
          (sum, item) =>
            sum + Number(item.price) * Number(item.quantity),
          0
        )
      ),
    [cart]
  );

  const discountAmount = useMemo(() => {
    const value = Number(discountValue) || 0;
    const discount =
      discountType === "percentage"
        ? subtotal * (value / 100)
        : value;

    return roundMoney(Math.min(subtotal, Math.max(0, discount)));
  }, [subtotal, discountType, discountValue]);

  const taxableAmount = Math.max(
    0,
    roundMoney(subtotal - discountAmount)
  );

  const taxAmount = useMemo(
    () =>
      roundMoney(
        taxableAmount * (Number(taxRate) / 100)
      ),
    [taxableAmount, taxRate]
  );

  const grandTotal = Math.max(
    0,
    roundMoney(subtotal - discountAmount + taxAmount)
  );

  const numericPaidAmount = Math.max(
    0,
    roundMoney(Number(paidAmount) || 0)
  );

  const changeAmount = Math.max(
    0,
    roundMoney(numericPaidAmount - grandTotal)
  );

  const remainingAmount = Math.max(
    0,
    roundMoney(grandTotal - numericPaidAmount)
  );
  const cartItemCount = cart.reduce(
    (sum, item) => sum + Number(item.quantity),
    0
  );

  const registerOpen = Boolean(currentRegister && currentRegister.status === "open");

  // -------------------------------------------------
  // CART ACTIONS
  // -------------------------------------------------
  const addToCart = useCallback(
    (product, inventoryItem) => {
      if (!inventoryItem) {
        toast.error("No inventory available for this product.");
        return;
      }

      const available = Number(inventoryItem.quantity) || 0;
      if (available <= 0) {
        toast.error("This variant is out of stock.");
        return;
      }

      const price =
        Number(inventoryItem.salePrice) ||
        Number(product.salePrice) ||
        0;

      const variantLabel = [
        inventoryItem.color,
        inventoryItem.size,
      ]
        .filter(Boolean)
        .join(" / ") || "Standard";

      const cartKey = `${product._id}-${inventoryItem._id}`;

      setCart((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.cartKey === cartKey
        );

        if (existingIndex !== -1) {
          const existing = prev[existingIndex];
          if (existing.quantity >= available) {
            toast.error(`Only ${available} units available.`);
            return prev;
          }
          const next = [...prev];
          next[existingIndex] = {
            ...existing,
            quantity: existing.quantity + 1,
          };
          toast.success("Quantity increased.");
          return next;
        }

        toast.success("Product added to cart.");
        return [
          ...prev,
          {
            cartKey,
            productId: product._id,
            inventoryId: inventoryItem._id,
            name: product.name,
            sku: product.sku,
            brand: getProductBrand(product),
            variant: variantLabel,
            price,
            quantity: 1,
            availableStock: available,
            color: inventoryItem.color || null,
            size: inventoryItem.size || null,
            tax: Number(inventoryItem.tax) || Number(product.tax) || 0,
            discount: Number(inventoryItem.discount) || 0,
          },
        ];
      });
    },
    []
  );

  const handleProductClick = (product, inventoryItems = []) => {
    const activeItems = inventoryItems.filter(
      (inv) => inv.isActive !== false && Number(inv.quantity) > 0
    );

    if (activeItems.length === 0) {
      toast.error("This product is out of stock.");
      return;
    }

    if (activeItems.length === 1 && !product.hasVariants) {
      addToCart(product, activeItems[0]);
      return;
    }

    // Multiple variants → open modal
    setSelectedProduct(product);
    setSelectedInventoryItems(activeItems);
    setSelectedVariant(activeItems[0]);
    setShowVariantModal(true);
  };

  const updateQuantity = (cartKey, quantity) => {
    setCart((prev) => {
      const item = prev.find((i) => i.cartKey === cartKey);
      if (!item) return prev;

      if (quantity > item.availableStock) {
        toast.error(`Only ${item.availableStock} units available.`);
        return prev;
      }

      if (quantity <= 0) {
        return prev.filter((i) => i.cartKey !== cartKey);
      }

      return prev.map((i) =>
        i.cartKey === cartKey ? { ...i, quantity } : i
      );
    });
  };

  const removeFromCart = (cartKey) => {
    setCart((prev) => prev.filter((i) => i.cartKey !== cartKey));
  };

  const clearCart = () => {
    if (!cart.length) return;
    setCart([]);
    setPaidAmount("");
    setDiscountValue("");
    setTaxRate(0);
    toast.success("Cart cleared.");
  };

  // -------------------------------------------------
  // HOLD / RESTORE
  // -------------------------------------------------
  const holdOrder = () => {
    if (!cart.length) {
      toast.error("Cart is empty.");
      return;
    }

    const order = {
      id: `HOLD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      customer: selectedCustomer,
      cart: [...cart],
      subtotal,
      discountAmount,
      taxAmount,
      grandTotal,
      discountType,
      discountValue,
      taxRate,
    };

    setHeldOrders((prev) => [...prev, order]);
    setCart([]);
    setPaidAmount("");
    setDiscountValue("");
    setTaxRate(0);
    toast.success("Order placed on hold.");
  };

  const restoreOrder = (order) => {
    setCart(order.cart);
    setSelectedCustomer(order.customer);
    setDiscountType(order.discountType || "percentage");
    setDiscountValue(order.discountValue || "");
    setTaxRate(order.taxRate || 0);
    setHeldOrders((prev) => prev.filter((o) => o.id !== order.id));
    setShowHeldModal(false);
    toast.success("Held order restored.");
  };

  // -------------------------------------------------
  // PAYMENT FLOW
  // -------------------------------------------------
  const openPayment = () => {
    if (!registerOpen) {
      toast.error("Please open the cash register first.");
      return;
    }
    if (!cart.length) {
      toast.error("Add at least one product.");
      return;
    }
    setPaidAmount("");
    setShowPaymentModal(true);
  };

  const setExactPayment = () => {
    setPaidAmount(String(Math.ceil(grandTotal)));
  };

  const quickCashAmounts = useMemo(() => {
    const rounded = Math.ceil(grandTotal);
    const values = new Set([
      rounded,
      Math.ceil(rounded / 1000) * 1000,
      Math.ceil(rounded / 5000) * 5000,
      Math.ceil(rounded / 10000) * 10000,
    ]);
    return [...values]
      .filter((v) => v >= rounded)
      .sort((a, b) => a - b)
      .slice(0, 4);
  }, [grandTotal]);

  // -------------------------------------------------
  // COMPLETE SALE (Cash / Card / Bank / Mobile)
  // -------------------------------------------------
  const completeLocalSale = async () => {
    if (!cart.length) {
      toast.error("Add at least one product.");
      return;
    }

    if (grandTotal <= 0) {
      toast.error("Sale total must be greater than zero.");
      return;
    }

    if (numericPaidAmount < grandTotal) {
      toast.error("Paid amount is less than the total.");
      return;
    }

    setIsProcessing(true);

    let saleId = null;

    try {
      // IMPORTANT:
      // SaleItem backend does not allow adding items to a completed sale.
      // Therefore the flow is:
      // 1. Create draft Sale
      // 2. Create all SaleItems
      // 3. Create completed SalePayment
      // 4. Mark Sale completed
      //
      // Errors are NOT swallowed so the UI never reports a false success.

      const backendPaymentMethod =
        getBackendPaymentMethod(paymentMethod);

      const amountToRecord = roundMoney(
        Math.min(numericPaidAmount, grandTotal)
      );

      // 1. Create draft Sale
      const saleResult = await createSale({
        customer: selectedCustomer?._id || null,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        totalAmount: grandTotal,
        paidAmount: 0,
        dueAmount: grandTotal,
        paymentMethod: backendPaymentMethod,
        status: "draft",
        notes: "",
      }).unwrap();

      saleId =
        saleResult?._id ||
        saleResult?.data?._id ||
        saleResult?.data?.sale?._id ||
        saleResult?.id;

      if (!saleId) {
        throw new Error("Sale was created but no sale ID was returned.");
      }

      // 2. Create every SaleItem.
      // SaleItem controller recalculates the Sale from item lines, so the
      // POS-level discount/tax must be distributed across the items.
      const cartLineSubtotals = cart.map((item) =>
        roundMoney(
          Number(item.price) * Number(item.quantity)
        )
      );

      const cartSubtotal = roundMoney(
        cartLineSubtotals.reduce(
          (sum, value) => sum + value,
          0
        )
      );

      let allocatedDiscount = 0;
      let allocatedTax = 0;

      for (let index = 0; index < cart.length; index += 1) {
        const item = cart[index];
        const lineSubtotal = cartLineSubtotals[index];
        const isLastItem = index === cart.length - 1;

        // Allocate the exact remaining amount to the last item so
        // floating-point rounding cannot change the sale total.
        const discountShare = isLastItem
          ? roundMoney(discountAmount - allocatedDiscount)
          : roundMoney(
              cartSubtotal > 0
                ? (discountAmount * lineSubtotal) /
                    cartSubtotal
                : 0
            );

        allocatedDiscount = roundMoney(
          allocatedDiscount + discountShare
        );

        const taxableLineSubtotal = Math.max(
          0,
          lineSubtotal - discountShare
        );

        const taxShare = isLastItem
          ? roundMoney(taxAmount - allocatedTax)
          : roundMoney(
              taxableAmount > 0
                ? (taxAmount * taxableLineSubtotal) /
                    taxableAmount
                : 0
            );

        allocatedTax = roundMoney(
          allocatedTax + taxShare
        );

        await createSaleItem({
          sale: saleId,
          product: item.productId,
          productInventory: item.inventoryId,
          quantity: Number(item.quantity),
          salePrice: roundMoney(item.price),
          discount: Math.max(0, discountShare),
          tax: Math.max(0, taxShare),
        }).unwrap();
      }

      // 3. Create the actual completed manual payment.
      // SalePayment controller generates paymentNumber and sets status
      // to completed/paymentDate automatically.
      await createSalePayment({
        sale: saleId,
        customer: selectedCustomer?._id || null,
        amount: amountToRecord,
        currency: "PKR",
        paymentMethod: backendPaymentMethod,
        paymentDate: new Date().toISOString(),
        referenceNumber: "",
        notes: "",
      }).unwrap();

      // 4. Finalize the Sale after items and payment exist.
      await updateSale({
        id: saleId,
        status: "completed",
        paidAmount: amountToRecord,
        dueAmount: 0,
        paymentMethod: backendPaymentMethod,
      }).unwrap();

      const saleRecord = {
        id: saleId,
        date: new Date(),
        customer: selectedCustomer,
        items: cart,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total: grandTotal,
        paid: amountToRecord,
        received: numericPaidAmount,
        change: changeAmount,
        paymentMethod,
      };

      setLastSale(saleRecord);
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      setCart([]);
      setPaidAmount("");
      setDiscountValue("");
      setTaxRate(0);

      await Promise.all([
        refetchInventory(),
        refetchProducts(),
        refetchRegister(),
      ]);

      toast.success("Sale completed successfully.");
    } catch (error) {
      console.error("Complete sale error:", error);

      const message =
        error?.data?.message ||
        error?.data?.errors?.[0]?.message ||
        error?.error ||
        error?.message ||
        "Failed to complete sale.";

      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  // -------------------------------------------------
  // PAYPAL / GATEWAY FLOW
  // -------------------------------------------------
  const startGatewayPayment = async () => {
    if (!cart.length) {
      toast.error("Cart is empty.");
      return;
    }

    if (grandTotal <= 0) {
      toast.error("Sale total must be greater than zero.");
      return;
    }

    setIsProcessing(true);

    let saleId = null;

    try {
      // PayPal needs a Sale ID before the gateway order can be created.
      // Keep the Sale in draft until PayPal capture succeeds.
      const saleResult = await createSale({
        customer: selectedCustomer?._id || null,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        totalAmount: grandTotal,
        paidAmount: 0,
        dueAmount: grandTotal,
        paymentMethod: "online",
        status: "draft",
        notes: "",
      }).unwrap();

      saleId =
        saleResult?._id ||
        saleResult?.data?._id ||
        saleResult?.data?.sale?._id ||
        saleResult?.id;

      if (!saleId) {
        throw new Error("Could not create the PayPal sale.");
      }

      // PayPal flow also needs SaleItems before the gateway payment.
      // Distribute the sale-level discount/tax across item lines because
      // the SaleItem controller recalculates the Sale from those lines.
      const cartLineSubtotals = cart.map((item) =>
        roundMoney(
          Number(item.price) * Number(item.quantity)
        )
      );

      const cartSubtotal = roundMoney(
        cartLineSubtotals.reduce(
          (sum, value) => sum + value,
          0
        )
      );

      let allocatedDiscount = 0;
      let allocatedTax = 0;

      for (let index = 0; index < cart.length; index += 1) {
        const item = cart[index];
        const lineSubtotal = cartLineSubtotals[index];
        const isLastItem = index === cart.length - 1;

        const discountShare = isLastItem
          ? roundMoney(discountAmount - allocatedDiscount)
          : roundMoney(
              cartSubtotal > 0
                ? (discountAmount * lineSubtotal) /
                    cartSubtotal
                : 0
            );

        allocatedDiscount = roundMoney(
          allocatedDiscount + discountShare
        );

        const taxableLineSubtotal = Math.max(
          0,
          lineSubtotal - discountShare
        );

        const taxShare = isLastItem
          ? roundMoney(taxAmount - allocatedTax)
          : roundMoney(
              taxableAmount > 0
                ? (taxAmount * taxableLineSubtotal) /
                    taxableAmount
                : 0
            );

        allocatedTax = roundMoney(
          allocatedTax + taxShare
        );

        await createSaleItem({
          sale: saleId,
          product: item.productId,
          productInventory: item.inventoryId,
          quantity: Number(item.quantity),
          salePrice: roundMoney(item.price),
          discount: Math.max(0, discountShare),
          tax: Math.max(0, taxShare),
        }).unwrap();
      }

      const origin = window.location.origin;
      const returnUrl =
        `${origin}/pos/payment-return?saleId=${saleId}`;
      const cancelUrl =
        `${origin}/pos?cancelled=1&saleId=${saleId}`;

      const paymentResult = await createPayment({
        saleId,
        amount: grandTotal,
        currency: "PKR",
        returnUrl,
        cancelUrl,
      }).unwrap();

      const approvalUrl =
        paymentResult?.approvalUrl ||
        paymentResult?.data?.approvalUrl ||
        paymentResult?.links?.find(
          (link) => link.rel === "approve"
        )?.href ||
        paymentResult?.data?.links?.find(
          (link) => link.rel === "approve"
        )?.href;

      if (!approvalUrl) {
        throw new Error("PayPal approval URL was not returned.");
      }

      sessionStorage.setItem(
        "pos_pending_sale",
        JSON.stringify({
          saleId,
          cart,
          customer: selectedCustomer,
          subtotal,
          discount: discountAmount,
          tax: taxAmount,
          grandTotal,
          paymentMethod: "paypal",
        })
      );

      window.location.href = approvalUrl;
    } catch (error) {
      console.error("Gateway payment error:", error);

      const message =
        error?.data?.message ||
        error?.data?.errors?.[0]?.message ||
        error?.error ||
        error?.message ||
        "Failed to initiate PayPal payment.";

      toast.error(message);

      // If gateway creation failed, do not leave a draft sale around
      // as a completed sale. It remains a draft for safe inspection.
      setIsProcessing(false);
    }
  };

  const handleCompleteSale = () => {
    if (paymentMethod === "paypal") {
      startGatewayPayment();
      return;
    }

    completeLocalSale();
  };

  // -------------------------------------------------
  // DISCOUNT
  // -------------------------------------------------
  const applyDiscount = () => {
    const value = Number(discountValue) || 0;
    if (value < 0) {
      toast.error("Discount cannot be negative.");
      return;
    }
    if (discountType === "percentage" && value > 100) {
      toast.error("Percentage discount cannot exceed 100%.");
      return;
    }
    if (discountType === "fixed" && value > subtotal) {
      toast.error("Discount cannot exceed subtotal.");
      return;
    }
    setShowDiscountModal(false);
    toast.success("Discount applied.");
  };

  // -------------------------------------------------
  // RENDER
  // -------------------------------------------------
  const isLoading = productsLoading || inventoryLoading || registerLoading;

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface text-primary">
      {/* ===================== HEADER ===================== */}
      <header className="shrink-0 border-b border-primary bg-card px-4 py-3 lg:px-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
              <ShoppingBag size={19} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Point of Sale
              </h1>
              <p className="text-xs text-secondary">
                {user?.business?.name || "Your Business"} •{" "}
                {user?.name || "Cashier"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHeldModal(true)}
              className="flex h-9 items-center gap-2 rounded-lg border border-primary bg-card px-3 text-xs font-semibold text-primary transition-colors hover:bg-surface"
            >
              <Pause size={15} />
              Held
              {heldOrders.length > 0 && (
                <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] text-white">
                  {heldOrders.length}
                </span>
              )}
            </button>

            <div
              className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold ${registerOpen
                  ? "border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]"
                  : "border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
                }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${registerOpen
                    ? "bg-[var(--color-success)]"
                    : "bg-[var(--color-danger)]"
                  }`}
              />
              Register {registerOpen ? "Open" : "Closed"}
            </div>

            <button
              type="button"
              onClick={() => navigate("/cash-register")}
              className="flex h-9 items-center gap-2 rounded-lg border border-primary bg-card px-3 text-xs font-semibold text-primary transition-colors hover:bg-surface"
            >
              <Calculator size={15} />
              Register
            </button>

            <button
              type="button"
              onClick={() => {
                refetchProducts();
                refetchInventory();
                refetchRegister();
              }}
              className="flex h-9 items-center gap-2 rounded-lg border border-primary bg-card px-3 text-xs font-semibold text-primary transition-colors hover:bg-surface"
            >
              <RefreshCw
                size={15}
                className={productsFetching ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* ===================== MAIN ===================== */}
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden xl:flex-row">
        {/* LEFT — PRODUCTS */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* Search + Categories */}
          <div className="shrink-0 border-b border-primary bg-card p-4">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product, SKU, barcode..."
                className="h-11 w-full rounded-xl border border-primary bg-surface pl-10 pr-4 text-sm text-primary outline-none placeholder:text-secondary focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCategoryId("all")}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${categoryId === "all"
                    ? "bg-brand text-white"
                    : "border border-primary bg-surface text-primary hover:border-brand/40"
                  }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => setCategoryId(cat._id)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${categoryId === cat._id
                      ? "bg-brand text-white"
                      : "border border-primary bg-surface text-primary hover:border-brand/40"
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3 text-secondary">
                <Loader2 size={28} className="animate-spin text-brand" />
                <p className="text-sm">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-secondary">
                <Package size={40} />
                <p className="text-sm font-medium">No products found</p>
                <p className="text-xs">
                  Try a different search or category.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredProducts.map((product) => {
                  const invItems =
                    inventoryByProduct.get(String(product._id)) || [];
                  return (
                    <ProductCard
                      key={product._id}
                      product={product}
                      inventoryItems={invItems}
                      onAdd={handleProductClick}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT — CART */}
        <aside className="flex w-full shrink-0 flex-col border-t border-primary bg-card xl:w-[400px] xl:border-l xl:border-t-0 2xl:w-[440px]">
          {/* Customer */}
          <div className="shrink-0 border-b border-secondary p-4">
            <button
              type="button"
              onClick={() => setShowCustomerModal(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-primary bg-surface p-3 text-left transition-colors hover:border-brand/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <UserRound size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-primary">
                  {selectedCustomer?.name || "Select Customer"}
                </p>
                <p className="truncate text-[11px] text-secondary">
                  {selectedCustomer?.phone ||
                    selectedCustomer?.type ||
                    "Walk-in / Search customer"}
                </p>
              </div>
              <ChevronDown size={16} className="text-secondary" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-2 text-secondary">
                <ShoppingBag size={36} className="opacity-40" />
                <p className="text-sm font-medium">Cart is empty</p>
                <p className="text-xs">Tap a product to add it.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.cartKey}
                    className="rounded-xl border border-primary bg-surface p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-primary">
                          {item.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-secondary">
                          {item.variant} • {item.sku}
                        </p>
                        <p className="mt-1 text-sm font-bold text-primary">
                          {currency(item.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.cartKey)}
                        className="rounded-lg p-1.5 text-secondary transition-colors hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <QuantityControl
                        quantity={item.quantity}
                        onDecrease={() =>
                          updateQuantity(item.cartKey, item.quantity - 1)
                        }
                        onIncrease={() =>
                          updateQuantity(item.cartKey, item.quantity + 1)
                        }
                      />
                      <p className="text-sm font-bold text-primary">
                        {currency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary + Actions */}
          <div className="shrink-0 border-t border-secondary p-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-secondary">
                  Subtotal ({cartItemCount} items)
                </span>
                <span className="font-semibold">{currency(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(true)}
                  className="flex items-center gap-1 text-brand hover:underline"
                >
                  <Percent size={12} />
                  Discount
                </button>
                <span className="font-semibold text-[var(--color-danger)]">
                  − {currency(discountAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-secondary">Tax</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="h-6 w-14 rounded border border-primary bg-surface px-1.5 text-[11px] outline-none focus:border-brand"
                  />
                  <span className="text-secondary">%</span>
                </div>
                <span className="font-semibold">{currency(taxAmount)}</span>
              </div>

              <div className="my-2 border-t border-primary" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Total</span>
                <span className="text-lg font-extrabold text-primary">
                  {currency(grandTotal)}
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={holdOrder}
                disabled={!cart.length}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-primary bg-surface text-xs font-bold text-primary transition-colors hover:bg-[var(--action-secondary-hover)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Pause size={16} />
                Hold
              </button>

              <button
                type="button"
                onClick={clearCart}
                disabled={!cart.length}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-primary bg-surface text-xs font-bold text-primary transition-colors hover:bg-[var(--action-secondary-hover)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw size={16} />
                Clear
              </button>
            </div>

            <button
              type="button"
              onClick={openPayment}
              disabled={!cart.length || !registerOpen}
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CircleDollarSign size={18} />
              Pay {currency(grandTotal)}
            </button>

            {!registerOpen && (
              <p className="mt-2 text-center text-[11px] text-[var(--color-danger)]">
                Open cash register to accept payments
              </p>
            )}
          </div>
        </aside>
      </main>

      {/* ===================== VARIANT MODAL ===================== */}
      {showVariantModal && selectedProduct && (
        <Modal
          title="Select Variant"
          onClose={() => {
            setShowVariantModal(false);
            setSelectedProduct(null);
            setSelectedVariant(null);
          }}
        >
          <div className="p-5">
            <div className="rounded-xl border border-primary bg-surface p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 font-bold text-brand">
                  {getProductInitials(selectedProduct.name)}
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-xs text-secondary">
                    {getProductBrand(selectedProduct)} •{" "}
                    {getProductSku(selectedProduct)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {selectedInventoryItems.map((inv) => {
                const isSelected = selectedVariant?._id === inv._id;
                const label =
                  [inv.color, inv.size].filter(Boolean).join(" / ") ||
                  "Standard";
                const stock = Number(inv.quantity) || 0;

                return (
                  <button
                    key={inv._id}
                    type="button"
                    disabled={stock <= 0}
                    onClick={() => setSelectedVariant(inv)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${isSelected
                        ? "border-brand bg-brand/10"
                        : "border-primary bg-card hover:border-brand/50"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <div>
                      <p className="text-xs font-bold text-primary">
                        {label}
                      </p>
                      <p className="mt-1 text-[10px] text-secondary">
                        {stock > 0
                          ? `${stock} units available`
                          : "Out of stock"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">
                        {currency(inv.salePrice || selectedProduct.salePrice)}
                      </p>
                      {isSelected && (
                        <Check size={15} className="ml-auto mt-1 text-brand" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowVariantModal(false)}
                className="h-10 flex-1 rounded-xl border border-primary text-xs font-bold text-primary transition-colors hover:bg-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  !selectedVariant || Number(selectedVariant.quantity) <= 0
                }
                onClick={() => {
                  addToCart(selectedProduct, selectedVariant);
                  setShowVariantModal(false);
                  setSelectedProduct(null);
                  setSelectedVariant(null);
                }}
                className="h-10 flex-1 rounded-xl bg-brand text-xs font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ===================== CUSTOMER MODAL ===================== */}
      {showCustomerModal && (
        <Modal
          title="Select Customer"
          onClose={() => setShowCustomerModal(false)}
        >
          <div className="p-5">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
              />
              <input
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customer or phone..."
                autoFocus
                className="h-10 w-full rounded-xl border border-primary bg-surface pl-9 pr-3 text-xs text-primary outline-none placeholder:text-secondary focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
            </div>

            <div className="mt-3 max-h-[350px] space-y-2 overflow-y-auto">
              {customersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={22} className="animate-spin text-brand" />
                </div>
              ) : customerResults.length === 0 ? (
                <p className="py-8 text-center text-sm text-secondary">
                  No customers found
                </p>
              ) : (
                customerResults.map((customer) => (
                  <button
                    key={customer._id}
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setShowCustomerModal(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${selectedCustomer?._id === customer._id
                        ? "border-brand bg-brand/10"
                        : "border-primary hover:bg-surface"
                      }`}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <UserRound size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-primary">
                        {customer.name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-secondary">
                        {customer.phone || customer.email || "—"}
                      </p>
                    </div>
                    {selectedCustomer?._id === customer._id && (
                      <Check size={16} className="text-brand" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ===================== DISCOUNT MODAL ===================== */}
      {showDiscountModal && (
        <Modal
          title="Apply Discount"
          onClose={() => setShowDiscountModal(false)}
        >
          <div className="p-5">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDiscountType("percentage")}
                className={`rounded-xl border p-3 text-left ${discountType === "percentage"
                    ? "border-brand bg-brand/10"
                    : "border-primary"
                  }`}
              >
                <Percent size={17} className="text-brand" />
                <p className="mt-2 text-xs font-bold">Percentage</p>
                <p className="mt-0.5 text-[10px] text-secondary">
                  Example: 10%
                </p>
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("fixed")}
                className={`rounded-xl border p-3 text-left ${discountType === "fixed"
                    ? "border-brand bg-brand/10"
                    : "border-primary"
                  }`}
              >
                <CircleDollarSign size={17} className="text-brand" />
                <p className="mt-2 text-xs font-bold">Fixed Amount</p>
                <p className="mt-0.5 text-[10px] text-secondary">
                  Example: Rs. 5,000
                </p>
              </button>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-semibold text-primary">
                Discount Value
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max={discountType === "percentage" ? 100 : subtotal}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={
                    discountType === "percentage"
                      ? "Enter percentage"
                      : "Enter amount"
                  }
                  className="h-11 w-full rounded-xl border border-primary bg-surface px-3 pr-12 text-sm text-primary outline-none placeholder:text-secondary focus:border-brand focus:ring-2 focus:ring-brand/10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-secondary">
                  {discountType === "percentage" ? "%" : "PKR"}
                </span>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-surface p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary">Discount</span>
                <span className="font-bold text-[var(--color-danger)]">
                  − {currency(discountAmount)}
                </span>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setDiscountValue("");
                  setShowDiscountModal(false);
                }}
                className="h-10 flex-1 rounded-xl border border-primary text-xs font-bold text-primary hover:bg-surface"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={applyDiscount}
                className="h-10 flex-1 rounded-xl bg-brand text-xs font-bold text-white hover:bg-brand-hover"
              >
                Apply Discount
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ===================== PAYMENT MODAL ===================== */}
      {showPaymentModal && (
        <Modal
          title="Complete Payment"
          onClose={() => !isProcessing && setShowPaymentModal(false)}
          width="max-w-2xl"
        >
          <div className="p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
              {/* Methods */}
              <div>
                <p className="mb-2 text-xs font-bold text-primary">
                  Payment Method
                </p>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    const active = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        disabled={isProcessing}
                        onClick={() => {
                          setPaymentMethod(method.id);
                          if (method.id !== "cash") {
                            setPaidAmount(String(Math.ceil(grandTotal)));
                          }
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${active
                            ? "border-brand bg-brand/10"
                            : "border-primary hover:bg-surface"
                          }`}
                      >
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${active
                              ? "bg-brand text-white"
                              : "bg-surface text-secondary"
                            }`}
                        >
                          <Icon size={17} />
                        </div>
                        <span className="flex-1 text-xs font-bold">
                          {method.label}
                        </span>
                        {active && (
                          <Check size={15} className="text-brand" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount */}
              <div>
                <div className="rounded-2xl bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-secondary">
                      Amount Due
                    </span>
                    <span className="text-xl font-extrabold text-primary">
                      {currency(grandTotal)}
                    </span>
                  </div>

                  {paymentMethod !== "paypal" && (
                    <>
                      <div className="mt-4">
                        <label className="mb-1.5 block text-xs font-bold">
                          Amount Received
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value)}
                          autoFocus
                          disabled={isProcessing}
                          className="h-12 w-full rounded-xl border border-primary bg-card px-3 text-lg font-bold text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
                        />
                      </div>

                      {paymentMethod === "cash" && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={setExactPayment}
                            className="rounded-lg border border-primary bg-card px-3 py-2 text-[10px] font-bold text-primary hover:bg-surface"
                          >
                            Exact Amount
                          </button>
                          {quickCashAmounts.map((amount) => (
                            <button
                              key={amount}
                              type="button"
                              onClick={() => setPaidAmount(String(amount))}
                              className="rounded-lg border border-primary bg-card px-3 py-2 text-[10px] font-bold text-primary hover:bg-surface"
                            >
                              {currency(amount)}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 space-y-2 border-t border-primary pt-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-secondary">Remaining</span>
                          <span
                            className={`font-bold ${remainingAmount > 0
                                ? "text-[var(--color-danger)]"
                                : "text-[var(--color-success)]"
                              }`}
                          >
                            {currency(remainingAmount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-secondary">Change</span>
                          <span className="font-bold text-[var(--color-success)]">
                            {currency(changeAmount)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {paymentMethod === "paypal" && (
                    <p className="mt-4 text-xs text-secondary">
                      You will be redirected to PayPal to complete the
                      payment securely.
                    </p>
                  )}
                </div>

                <div className="mt-3 rounded-xl border border-primary p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-secondary">Customer</p>
                      <p className="text-xs font-bold text-primary">
                        {selectedCustomer?.name || "Walk-in"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-secondary">Items</p>
                      <p className="text-xs font-bold text-primary">
                        {cartItemCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                disabled={isProcessing}
                className="h-11 flex-1 rounded-xl border border-primary text-xs font-bold text-primary transition-colors hover:bg-surface disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={
                  isProcessing ||
                  (paymentMethod !== "paypal" &&
                    numericPaidAmount < grandTotal)
                }
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand text-xs font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check size={17} />
                    {paymentMethod === "paypal"
                      ? "Pay with PayPal"
                      : "Complete Sale"}
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ===================== RECEIPT MODAL ===================== */}
      {showReceiptModal && lastSale && (
        <Modal
          title="Sale Completed"
          onClose={() => setShowReceiptModal(false)}
          width="max-w-md"
        >
          <div className="p-5">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)]">
                <Check size={28} />
              </div>
              <h2 className="mt-3 text-lg font-extrabold">
                Payment Successful
              </h2>
              <p className="mt-1 text-xs text-secondary">
                Sale {lastSale.id}
              </p>
            </div>

            <div className="mt-5 rounded-xl border border-primary bg-surface p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary">Customer</span>
                <span className="font-semibold">
                  {lastSale.customer?.name || "Walk-in"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-secondary">Payment</span>
                <span className="font-semibold capitalize">
                  {lastSale.paymentMethod}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-secondary">Items</span>
                <span className="font-semibold">
                  {lastSale.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                  )}
                </span>
              </div>
              <div className="my-3 border-t border-primary" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Sale Total</span>
                <span className="text-lg font-extrabold">
                  {currency(lastSale.total)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-secondary">Payment Recorded</span>
                <span className="font-semibold">
                  {currency(lastSale.paid)}
                </span>
              </div>
              {lastSale.received > lastSale.paid && (
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-secondary">Amount Received</span>
                  <span className="font-semibold">
                    {currency(lastSale.received)}
                  </span>
                </div>
              )}
              {lastSale.change > 0 && (
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-secondary">Change</span>
                  <span className="font-bold text-[var(--color-success)]">
                    {currency(lastSale.change)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  toast("Receipt printing will be connected later.")
                }
                className="h-10 rounded-xl border border-primary text-xs font-bold text-primary hover:bg-surface"
              >
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="h-10 rounded-xl bg-brand text-xs font-bold text-white hover:bg-brand-hover"
              >
                New Sale
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ===================== HELD ORDERS MODAL ===================== */}
      {showHeldModal && (
        <Modal
          title="Held Orders"
          onClose={() => setShowHeldModal(false)}
          width="max-w-md"
        >
          <div className="p-5">
            {heldOrders.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-secondary">
                <Pause size={32} className="opacity-40" />
                <p className="mt-3 text-sm">No held orders</p>
              </div>
            ) : (
              <div className="space-y-2">
                {heldOrders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => restoreOrder(order)}
                    className="flex w-full items-center justify-between rounded-xl border border-primary bg-surface p-3 text-left transition-colors hover:border-brand/50"
                  >
                    <div>
                      <p className="text-xs font-bold text-primary">
                        {order.id}
                      </p>
                      <p className="mt-0.5 text-[10px] text-secondary">
                        {order.customer?.name || "Walk-in"} •{" "}
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-primary">
                      {currency(order.grandTotal)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}