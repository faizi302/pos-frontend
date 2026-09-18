import { useMemo, useState } from "react";
import {
  Barcode,
  Banknote,
  Calculator,
  Check,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  Grid2X2,
  Minus,
  Package,
  Pause,
  Percent,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Smartphone,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

const MOCK_PRODUCTS = [
  {
    id: "p1",
    name: "Samsung Galaxy S22",
    sku: "SAM-S22-128",
    barcode: "8806094270123",
    brand: "Samsung",
    category: "Mobiles",
    price: 189999,
    purchasePrice: 165000,
    stock: 8,
    minStock: 3,
    variants: [
      { id: "v1", label: "Phantom Black / 128GB", price: 189999, stock: 5 },
      { id: "v2", label: "Green / 128GB", price: 191999, stock: 3 },
    ],
  },
  {
    id: "p2",
    name: "iPhone 17 Pro Max",
    sku: "APL-17PM-256",
    barcode: "0195949876543",
    brand: "Apple",
    category: "Mobiles",
    price: 449999,
    purchasePrice: 420000,
    stock: 4,
    minStock: 2,
    variants: [
      { id: "v3", label: "Natural Titanium / 256GB", price: 449999, stock: 2 },
      { id: "v4", label: "Black Titanium / 256GB", price: 455999, stock: 2 },
    ],
  },
  {
    id: "p3",
    name: "Oppo F17",
    sku: "OPP-F17-128",
    barcode: "6944284621458",
    brand: "Oppo",
    category: "Mobiles",
    price: 49999,
    purchasePrice: 44000,
    stock: 14,
    minStock: 5,
    variants: [
      { id: "v5", label: "Navy Blue / 128GB", price: 49999, stock: 8 },
      { id: "v6", label: "White / 128GB", price: 50999, stock: 6 },
    ],
  },
  {
    id: "p4",
    name: "HP ProBook 450 G10",
    sku: "HP-PB450-G10",
    barcode: "197192345678",
    brand: "HP",
    category: "Laptops",
    price: 214999,
    purchasePrice: 192000,
    stock: 6,
    minStock: 2,
    variants: [
      { id: "v7", label: "Core i5 / 8GB / 512GB", price: 214999, stock: 4 },
      { id: "v8", label: "Core i7 / 16GB / 512GB", price: 254999, stock: 2 },
    ],
  },
  {
    id: "p5",
    name: "Dell Latitude 5440",
    sku: "DELL-L5440",
    barcode: "5397184891234",
    brand: "Dell",
    category: "Laptops",
    price: 229999,
    purchasePrice: 205000,
    stock: 5,
    minStock: 2,
    variants: [
      { id: "v9", label: "Core i5 / 8GB / 512GB", price: 229999, stock: 3 },
      { id: "v10", label: "Core i7 / 16GB / 512GB", price: 259999, stock: 2 },
    ],
  },
  {
    id: "p6",
    name: "Lenovo ThinkPad E14",
    sku: "LEN-E14-G5",
    barcode: "196802345678",
    brand: "Lenovo",
    category: "Laptops",
    price: 199999,
    purchasePrice: 178000,
    stock: 9,
    minStock: 3,
    variants: [
      { id: "v11", label: "Core i5 / 8GB / 512GB", price: 199999, stock: 5 },
      { id: "v12", label: "Core i7 / 16GB / 512GB", price: 229999, stock: 4 },
    ],
  },
  {
    id: "p7",
    name: "Dawlance Inverter AC 1.5 Ton",
    sku: "DAW-AC-15",
    barcode: "8964001234567",
    brand: "Dawlance",
    category: "AC",
    price: 164999,
    purchasePrice: 145000,
    stock: 3,
    minStock: 1,
    variants: [
      { id: "v13", label: "White / 1.5 Ton", price: 164999, stock: 3 },
    ],
  },
  {
    id: "p8",
    name: "Samsung 55 Inch Smart TV",
    sku: "SAM-TV-55",
    barcode: "8806094999999",
    brand: "Samsung",
    category: "Electronics",
    price: 184999,
    purchasePrice: 165000,
    stock: 7,
    minStock: 2,
    variants: [
      { id: "v14", label: "55 Inch / Crystal UHD", price: 184999, stock: 7 },
    ],
  },
  {
    id: "p9",
    name: "SolarMax 550W Solar Panel",
    sku: "SOL-550W",
    barcode: "8941001234567",
    brand: "SolarMax",
    category: "Solar",
    price: 28500,
    purchasePrice: 25000,
    stock: 28,
    minStock: 8,
    variants: [
      { id: "v15", label: "550W / Mono", price: 28500, stock: 28 },
    ],
  },
  {
    id: "p10",
    name: "TP-Link Archer C6",
    sku: "TPL-C6-AC1200",
    barcode: "6935364081234",
    brand: "TP-Link",
    category: "Networking",
    price: 11999,
    purchasePrice: 9800,
    stock: 19,
    minStock: 5,
    variants: [
      { id: "v16", label: "AC1200 / Dual Band", price: 11999, stock: 19 },
    ],
  },
  {
    id: "p11",
    name: "Logitech MX Master 3S",
    sku: "LOG-MX3S",
    barcode: "5099206098765",
    brand: "Logitech",
    category: "Accessories",
    price: 24999,
    purchasePrice: 21000,
    stock: 12,
    minStock: 4,
    variants: [
      { id: "v17", label: "Graphite", price: 24999, stock: 7 },
      { id: "v18", label: "Pale Grey", price: 24999, stock: 5 },
    ],
  },
  {
    id: "p12",
    name: "Anker PowerCore 20K",
    sku: "ANK-P20K",
    barcode: "0194644123456",
    brand: "Anker",
    category: "Accessories",
    price: 8999,
    purchasePrice: 7300,
    stock: 24,
    minStock: 6,
    variants: [
      { id: "v19", label: "Black / 20,000mAh", price: 8999, stock: 24 },
    ],
  },
];

const CUSTOMERS = [
  {
    id: "walk-in",
    name: "Walk-in Customer",
    phone: "",
    type: "Walk-in",
  },
  {
    id: "c1",
    name: "Ali Raza",
    phone: "03001234567",
    type: "Regular",
  },
  {
    id: "c2",
    name: "Hamza Electronics",
    phone: "03219876543",
    type: "Business",
  },
  {
    id: "c3",
    name: "Ahmed Khan",
    phone: "03111223344",
    type: "Regular",
  },
  {
    id: "c4",
    name: "Usman Traders",
    phone: "03339876543",
    type: "Business",
  },
];

const CATEGORIES = [
  "All",
  "Mobiles",
  "Laptops",
  "Electronics",
  "AC",
  "Solar",
  "Networking",
  "Accessories",
];

const PAYMENT_METHODS = [
  {
    id: "cash",
    label: "Cash",
    icon: Banknote,
  },
  {
    id: "card",
    label: "Card",
    icon: CreditCard,
  },
  {
    id: "bank",
    label: "Bank Transfer",
    icon: WalletCards,
  },
  {
    id: "mobile",
    label: "Mobile Wallet",
    icon: Smartphone,
  },
];

const currency = (value) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value);

const formatNumber = (value) =>
  new Intl.NumberFormat("en-PK").format(value);

function getStockStatus(stock, minStock) {
  if (stock <= 0) {
    return {
      label: "Out of stock",
      className: "text-[var(--color-danger)] bg-[var(--color-danger)]/10",
    };
  }

  if (stock <= minStock) {
    return {
      label: "Low stock",
      className: "text-[var(--color-warning)] bg-[var(--color-warning)]/10",
    };
  }

  return {
    label: `${stock} in stock`,
    className: "text-[var(--color-success)] bg-[var(--color-success)]/10",
  };
}

function getProductInitials(name) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function ProductCard({ product, onAdd }) {
  const status = getStockStatus(product.stock, product.minStock);

  return (
    <button
      type="button"
      onClick={() => onAdd(product)}
      disabled={product.stock <= 0}
      className="group flex min-h-[218px] flex-col overflow-hidden rounded-2xl border border-primary bg-card text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="relative flex h-28 items-center justify-center border-b border-secondary bg-surface">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-lg font-bold text-brand">
          {getProductInitials(product.name)}
        </div>

        <div className="absolute left-3 top-3 rounded-lg bg-card px-2 py-1 text-[10px] font-semibold text-secondary shadow-sm">
          {product.brand}
        </div>

        <div
          className={`absolute right-3 top-3 rounded-lg px-2 py-1 text-[10px] font-semibold ${status.className}`}
        >
          {product.stock <= 0 ? "Out" : product.stock}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 min-h-10 text-sm font-semibold text-primary">
          {product.name}
        </p>

        <p className="mt-1 truncate text-[11px] text-secondary">
          SKU: {product.sku}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <p className="text-base font-bold text-primary">
              {currency(product.price)}
            </p>
            <p className="text-[10px] text-secondary">{product.category}</p>
          </div>

          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white transition-colors group-hover:bg-brand-hover">
            <Plus size={16} />
          </span>
        </div>
      </div>
    </button>
  );
}

function QuantityControl({ quantity, onDecrease, onIncrease }) {
  return (
    <div className="flex items-center overflow-hidden rounded-lg border border-primary">
      <button
        type="button"
        onClick={onDecrease}
        className="flex h-8 w-8 items-center justify-center text-secondary transition-colors hover:bg-surface hover:text-primary"
      >
        <Minus size={14} />
      </button>

      <span className="flex h-8 min-w-8 items-center justify-center border-x border-primary px-1 text-xs font-semibold text-primary">
        {quantity}
      </span>

      <button
        type="button"
        onClick={onIncrease}
        className="flex h-8 w-8 items-center justify-center text-secondary transition-colors hover:bg-surface hover:text-primary"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function Modal({ title, children, onClose, width = "max-w-lg" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        className={`w-full ${width} overflow-hidden rounded-2xl border border-primary bg-card shadow-2xl`}
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

        {children}
      </div>
    </div>
  );
}

export default function POS() {
  const [products] = useState(MOCK_PRODUCTS);
  const [customers] = useState(CUSTOMERS);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [cart, setCart] = useState([]);

  const [selectedCustomer, setSelectedCustomer] = useState(CUSTOMERS[0]);
  const [customerSearch, setCustomerSearch] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");

  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");

  const [taxRate, setTaxRate] = useState(0);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const [lastSale, setLastSale] = useState(null);
  const [heldOrders, setHeldOrders] = useState([]);

  const [registerOpen] = useState(true);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        category === "All" || product.category === category;

      if (!normalizedSearch) {
        return matchesCategory;
      }

      const matchesSearch =
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.sku.toLowerCase().includes(normalizedSearch) ||
        product.barcode.includes(normalizedSearch) ||
        product.brand.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [products, search, category]);

  const customerResults = useMemo(() => {
    const normalizedSearch = customerSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return customers;
    }

    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(normalizedSearch) ||
        customer.phone.includes(normalizedSearch)
    );
  }, [customers, customerSearch]);

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
    [cart]
  );

  const discountAmount = useMemo(() => {
    const value = Number(discountValue) || 0;

    if (discountType === "percentage") {
      return Math.min(subtotal, subtotal * (value / 100));
    }

    return Math.min(subtotal, value);
  }, [subtotal, discountType, discountValue]);

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  const taxAmount = useMemo(
    () => taxableAmount * (Number(taxRate) / 100),
    [taxableAmount, taxRate]
  );

  const grandTotal = Math.max(
    0,
    subtotal - discountAmount + taxAmount
  );

  const numericPaidAmount = Number(paidAmount) || 0;
  const changeAmount = Math.max(0, numericPaidAmount - grandTotal);
  const remainingAmount = Math.max(0, grandTotal - numericPaidAmount);

  const cartItemCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const addProduct = (product, variant = null) => {
    const selected = variant || product.variants?.[0];

    if (!selected) {
      toast.error("Product variant is not available.");
      return;
    }

    const existingIndex = cart.findIndex(
      (item) =>
        item.productId === product.id &&
        item.variantId === selected.id
    );

    if (existingIndex !== -1) {
      const existing = cart[existingIndex];

      if (existing.quantity >= selected.stock) {
        toast.error("Available stock limit reached.");
        return;
      }

      setCart((currentCart) =>
        currentCart.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        )
      );

      toast.success("Quantity increased.");
      return;
    }

    setCart((currentCart) => [
      ...currentCart,
      {
        productId: product.id,
        variantId: selected.id,
        name: product.name,
        sku: product.sku,
        brand: product.brand,
        variant: selected.label,
        price: selected.price,
        quantity: 1,
        availableStock: selected.stock,
      },
    ]);

    toast.success("Product added to cart.");
  };

  const handleProductClick = (product) => {
    if (product.stock <= 0) {
      toast.error("This product is out of stock.");
      return;
    }

    if (product.variants?.length > 1) {
      setSelectedProduct(product);
      setSelectedVariant(product.variants[0]);
      setShowVariantModal(true);
      return;
    }

    addProduct(product, product.variants?.[0]);
  };

  const updateQuantity = (productId, variantId, quantity) => {
    const item = cart.find(
      (cartItem) =>
        cartItem.productId === productId &&
        cartItem.variantId === variantId
    );

    if (!item) return;

    if (quantity > item.availableStock) {
      toast.error(`Only ${item.availableStock} units available.`);
      return;
    }

    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }

    setCart((currentCart) =>
      currentCart.map((cartItem) =>
        cartItem.productId === productId &&
        cartItem.variantId === variantId
          ? {
              ...cartItem,
              quantity,
            }
          : cartItem
      )
    );
  };

  const removeFromCart = (productId, variantId) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.variantId === variantId
          )
      )
    );
  };

  const clearCart = () => {
    if (!cart.length) return;

    setCart([]);
    setPaidAmount("");
    setDiscountValue("");
    setTaxRate(0);
    toast.success("Cart cleared.");
  };

  const holdOrder = () => {
    if (!cart.length) {
      toast.error("Cart is empty.");
      return;
    }

    const order = {
      id: `HOLD-${Date.now()}`,
      createdAt: new Date(),
      customer: selectedCustomer,
      cart,
      subtotal,
      discountAmount,
      taxAmount,
      grandTotal,
    };

    setHeldOrders((orders) => [...orders, order]);

    setCart([]);
    setPaidAmount("");
    setDiscountValue("");
    setTaxRate(0);

    toast.success("Order placed on hold.");
  };

  const restoreOrder = (order) => {
    setCart(order.cart);
    setSelectedCustomer(order.customer);
    setHeldOrders((orders) =>
      orders.filter((item) => item.id !== order.id)
    );

    toast.success("Held order restored.");
  };

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

  const completeSale = () => {
    if (numericPaidAmount < grandTotal) {
      toast.error("Paid amount is less than the total.");
      return;
    }

    const sale = {
      id: `SALE-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date(),
      customer: selectedCustomer,
      items: cart,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total: grandTotal,
      paid: numericPaidAmount,
      change: changeAmount,
      paymentMethod,
    };

    setLastSale(sale);
    setShowPaymentModal(false);
    setShowReceiptModal(true);

    setCart([]);
    setPaidAmount("");
    setDiscountValue("");
    setTaxRate(0);

    toast.success("Sale completed successfully.");
  };

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

  const setExactPayment = () => {
    setPaidAmount(String(Math.ceil(grandTotal)));
  };

  const setPaymentAmount = (amount) => {
    setPaidAmount(String(amount));
  };

  const quickCashAmounts = useMemo(() => {
    const roundedTotal = Math.ceil(grandTotal);

    const values = new Set([
      roundedTotal,
      Math.ceil(roundedTotal / 1000) * 1000,
      Math.ceil(roundedTotal / 5000) * 5000,
      Math.ceil(roundedTotal / 10000) * 10000,
    ]);

    return [...values]
      .filter((value) => value >= roundedTotal)
      .sort((a, b) => a - b)
      .slice(0, 4);
  }, [grandTotal]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface text-primary">
      {/* HEADER */}
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
                Information Technology • Mobiles
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                heldOrders.length
                  ? toast.success(`${heldOrders.length} held order(s)`)
                  : toast("No held orders.")
              }
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
              className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold ${
                registerOpen
                  ? "border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]"
                  : "border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  registerOpen
                    ? "bg-[var(--color-success)]"
                    : "bg-[var(--color-danger)]"
                }`}
              />
              Register {registerOpen ? "Open" : "Closed"}
            </div>

            <button
              type="button"
              onClick={() => toast("Register management will be connected to the backend later.")}
              className="flex h-9 items-center gap-2 rounded-lg border border-primary bg-card px-3 text-xs font-semibold text-primary transition-colors hover:bg-surface"
            >
              <Calculator size={15} />
              Register
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden xl:flex-row">
        {/* LEFT / PRODUCTS */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* SEARCH */}
          <div className="shrink-0 border-b border-primary bg-card p-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search product, SKU, barcode or brand..."
                  className="h-11 w-full rounded-xl border border-primary bg-surface pl-10 pr-10 text-sm text-primary outline-none transition-all placeholder:text-secondary focus:border-brand focus:ring-2 focus:ring-brand/10"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => toast("Barcode scanner integration will use the backend/API later.")}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-primary bg-card px-4 text-sm font-semibold text-primary transition-colors hover:bg-surface"
              >
                <Barcode size={18} />
                Scan
              </button>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                }}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-primary bg-card px-4 text-sm font-semibold text-primary transition-colors hover:bg-surface"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>

            {/* CATEGORIES */}
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                    category === item
                      ? "bg-brand text-white"
                      : "bg-surface text-secondary hover:text-primary"
                  }`}
                >
                  {item === "All" && <Grid2X2 size={14} />}
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* PRODUCT AREA */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold">Products</h2>
                <p className="mt-0.5 text-xs text-secondary">
                  {filteredProducts.length} products available
                </p>
              </div>

              <span className="rounded-lg bg-card px-3 py-1.5 text-xs font-semibold text-secondary">
                {category}
              </span>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={handleProductClick}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-dashed border-primary bg-card">
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-secondary">
                    <Package size={24} />
                  </div>
                  <h3 className="mt-4 text-sm font-bold">
                    No products found
                  </h3>
                  <p className="mt-1 text-xs text-secondary">
                    Try another search or category.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT / CART */}
        <aside className="flex min-h-[480px] w-full shrink-0 flex-col border-t border-primary bg-card xl:min-h-0 xl:w-[430px] xl:border-l xl:border-t-0 2xl:w-[470px]">
          {/* CART HEADER */}
          <div className="flex shrink-0 items-center justify-between border-b border-primary px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold">Current Order</h2>
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
                  {cartItemCount} items
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-secondary">
                Draft sale
              </p>
            </div>

            <button
              type="button"
              onClick={clearCart}
              disabled={!cart.length}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={14} />
              Clear
            </button>
          </div>

          {/* CUSTOMER */}
          <div className="shrink-0 border-b border-primary p-3">
            <button
              type="button"
              onClick={() => {
                setCustomerSearch("");
                setShowCustomerModal(true);
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-primary bg-surface p-3 text-left transition-colors hover:border-brand/50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <UserRound size={17} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wide text-secondary">
                  Customer
                </p>
                <p className="truncate text-xs font-bold text-primary">
                  {selectedCustomer.name}
                </p>
                {selectedCustomer.phone && (
                  <p className="truncate text-[10px] text-secondary">
                    {selectedCustomer.phone}
                  </p>
                )}
              </div>

              <ChevronDown size={15} className="text-secondary" />
            </button>
          </div>

          {/* CART ITEMS */}
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {cart.length > 0 ? (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId}`}
                    className="rounded-xl border border-primary bg-surface p-3"
                  >
                    <div className="flex gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-xs font-bold text-brand">
                        {getProductInitials(item.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-xs font-bold text-primary">
                              {item.name}
                            </p>
                            <p className="mt-0.5 text-[10px] text-secondary">
                              {item.variant}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(
                                item.productId,
                                item.variantId
                              )
                            }
                            className="shrink-0 text-secondary transition-colors hover:text-[var(--color-danger)]"
                          >
                            <X size={15} />
                          </button>
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <QuantityControl
                            quantity={item.quantity}
                            onDecrease={() =>
                              updateQuantity(
                                item.productId,
                                item.variantId,
                                item.quantity - 1
                              )
                            }
                            onIncrease={() =>
                              updateQuantity(
                                item.productId,
                                item.variantId,
                                item.quantity + 1
                              )
                            }
                          />

                          <div className="text-right">
                            <p className="text-[10px] text-secondary">
                              {currency(item.price)} × {item.quantity}
                            </p>
                            <p className="text-sm font-bold text-primary">
                              {currency(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full min-h-[250px] flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface text-secondary">
                  <ShoppingBag size={28} />
                </div>

                <h3 className="mt-4 text-sm font-bold">
                  Your cart is empty
                </h3>

                <p className="mt-1 max-w-[230px] text-xs leading-5 text-secondary">
                  Select products from the left side to start a new sale.
                </p>
              </div>
            )}
          </div>

          {/* SUMMARY */}
          <div className="shrink-0 border-t border-primary bg-card p-4">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-secondary">
                <span>Subtotal</span>
                <span className="font-semibold text-primary">
                  {currency(subtotal)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowDiscountModal(true)}
                className="flex w-full items-center justify-between rounded-lg py-1 text-xs text-secondary transition-colors hover:text-primary"
              >
                <span className="flex items-center gap-1.5">
                  <Percent size={13} />
                  Discount
                  {discountValue && (
                    <span className="text-brand">
                      (
                      {discountType === "percentage"
                        ? `${discountValue}%`
                        : currency(Number(discountValue))}
                      )
                    </span>
                  )}
                </span>

                <span className="font-semibold text-[var(--color-danger)]">
                  - {currency(discountAmount)}
                </span>
              </button>

              <div className="flex items-center justify-between text-secondary">
                <span>Tax ({taxRate}%)</span>
                <span className="font-semibold text-primary">
                  {currency(taxAmount)}
                </span>
              </div>

              <div className="my-2 border-t border-dashed border-primary" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-primary">
                  Total
                </span>
                <span className="text-xl font-extrabold text-primary">
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
                Hold Order
              </button>

              <button
                type="button"
                onClick={openPayment}
                disabled={!cart.length}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CircleDollarSign size={17} />
                Pay {currency(grandTotal)}
              </button>
            </div>

            {heldOrders.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {heldOrders.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => restoreOrder(order)}
                      className="shrink-0 rounded-lg border border-primary bg-surface px-3 py-2 text-left transition-colors hover:border-brand/50"
                    >
                      <p className="text-[10px] font-bold text-primary">
                        {order.id}
                      </p>
                      <p className="text-[10px] text-secondary">
                        {currency(order.grandTotal)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* VARIANT MODAL */}
      {showVariantModal && selectedProduct && (
        <Modal
          title="Select Product Variant"
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
                    {selectedProduct.brand} • {selectedProduct.sku}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {selectedProduct.variants.map((variant) => {
                const isSelected = selectedVariant?.id === variant.id;

                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={variant.stock <= 0}
                    onClick={() => setSelectedVariant(variant)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? "border-brand bg-brand/10"
                        : "border-primary bg-card hover:border-brand/50"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <div>
                      <p className="text-xs font-bold text-primary">
                        {variant.label}
                      </p>
                      <p className="mt-1 text-[10px] text-secondary">
                        {variant.stock > 0
                          ? `${variant.stock} units available`
                          : "Out of stock"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">
                        {currency(variant.price)}
                      </p>

                      {isSelected && (
                        <Check
                          size={15}
                          className="ml-auto mt-1 text-brand"
                        />
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
                disabled={!selectedVariant || selectedVariant.stock <= 0}
                onClick={() => {
                  addProduct(selectedProduct, selectedVariant);
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

      {/* CUSTOMER MODAL */}
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
                onChange={(event) =>
                  setCustomerSearch(event.target.value)
                }
                placeholder="Search customer or phone..."
                autoFocus
                className="h-10 w-full rounded-xl border border-primary bg-surface pl-9 pr-3 text-xs text-primary outline-none placeholder:text-secondary focus:border-brand focus:ring-2 focus:ring-brand/10"
              />
            </div>

            <div className="mt-3 max-h-[350px] space-y-2 overflow-y-auto">
              {customerResults.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowCustomerModal(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                    selectedCustomer.id === customer.id
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
                      {customer.phone || customer.type}
                    </p>
                  </div>

                  {selectedCustomer.id === customer.id && (
                    <Check size={16} className="text-brand" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* DISCOUNT MODAL */}
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
                className={`rounded-xl border p-3 text-left ${
                  discountType === "percentage"
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
                className={`rounded-xl border p-3 text-left ${
                  discountType === "fixed"
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
                  onChange={(event) =>
                    setDiscountValue(event.target.value)
                  }
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
                  - {currency(discountAmount)}
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

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <Modal
          title="Complete Payment"
          onClose={() => setShowPaymentModal(false)}
          width="max-w-2xl"
        >
          <div className="p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
              {/* PAYMENT METHODS */}
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
                        onClick={() => {
                          setPaymentMethod(method.id);

                          if (method.id !== "cash") {
                            setPaidAmount(String(Math.ceil(grandTotal)));
                          }
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                          active
                            ? "border-brand bg-brand/10"
                            : "border-primary hover:bg-surface"
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            active
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

              {/* PAYMENT DETAILS */}
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

                  <div className="mt-4">
                    <label className="mb-1.5 block text-xs font-bold">
                      Amount Received
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={paidAmount}
                      onChange={(event) =>
                        setPaymentAmount(event.target.value)
                      }
                      autoFocus
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
                          onClick={() => setPaymentAmount(amount)}
                          className="rounded-lg border border-primary bg-card px-3 py-2 text-[10px] font-bold text-primary hover:bg-surface"
                        >
                          {currency(amount)}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 space-y-2 border-t border-primary pt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-secondary">
                        Remaining
                      </span>

                      <span
                        className={`font-bold ${
                          remainingAmount > 0
                            ? "text-[var(--color-danger)]"
                            : "text-[var(--color-success)]"
                        }`}
                      >
                        {currency(remainingAmount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-secondary">
                        Change
                      </span>

                      <span className="font-bold text-[var(--color-success)]">
                        {currency(changeAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-primary p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-secondary">
                        Customer
                      </p>
                      <p className="text-xs font-bold text-primary">
                        {selectedCustomer.name}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] text-secondary">
                        Items
                      </p>
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
                className="h-11 flex-1 rounded-xl border border-primary text-xs font-bold text-primary transition-colors hover:bg-surface"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={completeSale}
                disabled={numericPaidAmount < grandTotal}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand text-xs font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Check size={17} />
                Complete Sale
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* RECEIPT MODAL */}
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
                  {lastSale.customer.name}
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
                <span className="text-sm font-bold">
                  Total Paid
                </span>
                <span className="text-lg font-extrabold">
                  {currency(lastSale.total)}
                </span>
              </div>

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
                onClick={() => toast("Receipt printing will be connected later.")}
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
    </div>
  );
}