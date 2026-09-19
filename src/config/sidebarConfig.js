import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  KeyRound,
  Building2,
  Layers3,
  Tags,
  Boxes,
  Package,
  FolderTree,
  Warehouse,
  ArrowLeftRight,
  ClipboardList,
  Truck,
  ShoppingCart,
  List,
  CreditCard,
  RotateCcw,
  UsersRound,
  WalletCards,
  Receipt,
  Landmark,
  CircleDollarSign,
  BarChart3,
  ChartNoAxesCombined,
  Palette,
  UserCog,
} from "lucide-react";

export const sidebarConfig = [
  // =====================================================
  // DASHBOARD
  // =====================================================

  {
    title: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    section: "Dashboard",
    roles: ["super-admin", "admin", "manager"],
    comingSoon: false,
  },

  // =====================================================
  // MANAGEMENT
  // =====================================================

  {
    title: "Users",
    path: "/users",
    icon: Users,
    section: "Management",
    roles: ["super-admin", "admin"],
    comingSoon: false,
  },

  {
    title: "Roles",
    path: "/roles",
    icon: ShieldCheck,
    section: "Management",
    roles: ["super-admin"],
    comingSoon: false,
  },

  {
    title: "Permissions",
    path: "/permissions",
    icon: KeyRound,
    section: "Management",
    roles: ["super-admin"],
    comingSoon: false,
  },

  // =====================================================
  // BUSINESS SETUP
  // =====================================================

  {
    title: "Businesses",
    path: "/businesses",
    icon: Building2,
    section: "Business Setup",
    roles: ["super-admin"],
    comingSoon: false,
  },

  {
    title: "Business Types",
    path: "/business-types",
    icon: Layers3,
    section: "Business Setup",
    roles: ["super-admin"],
    comingSoon: false,
  },

  {
    title: "Brands",
    path: "/brands",
    icon: Tags,
    section: "Business Setup",
    roles: ["super-admin"],
    comingSoon: false,
  },

  {
    title: "Models",
    path: "/models",
    icon: Boxes,
    section: "Business Setup",
    roles: ["super-admin"],
    comingSoon: false,
  },

  // =====================================================
  // PRODUCTS & INVENTORY
  // =====================================================

  {
    title: "Products",
    path: "/products",
    icon: Package,
    section: "Products & Inventory",
    roles: ["admin", "manager"],
    comingSoon: false,
  },

  {
    title: "Categories",
    path: "/categories",
    icon: FolderTree,
    section: "Products & Inventory",
    roles: ["admin", "manager"],
    comingSoon: false,
  },

  {
    title: "Inventory",
    path: "/product-inventory",
    icon: Warehouse,
    section: "Products & Inventory",
    roles: ["admin", "manager"],
    comingSoon: false,
  },

  {
    title: "Stock Movements",
    path: "/stock-movements",
    icon: ArrowLeftRight,
    section: "Products & Inventory",
    roles: ["admin", "manager"],
    comingSoon: true,
  },

  // =====================================================
  // PURCHASES
  // =====================================================

  {
    title: "Purchases",
    path: "/purchases",
    icon: ClipboardList,
    section: "Purchases",
    roles: ["admin", "manager"],
    comingSoon: true,
  },

  {
    title: "Purchase Items",
    path: "/purchase-items",
    icon: List,
    section: "Purchases",
    roles: ["admin", "manager"],
    comingSoon: true,
  },

  {
    title: "Suppliers",
    path: "/suppliers",
    icon: Truck,
    section: "Purchases",
    roles: ["admin", "manager"],
    comingSoon: true,
  },

  // =====================================================
  // SALES
  // =====================================================

  {
    title: "POS",
    path: "/pos",
    icon: ShoppingCart,
    section: "Sales",
    roles: ["admin", "manager"],
    comingSoon: false,
  },

  {
    title: "Sales",
    path: "/sales",
    icon: Receipt,
    section: "Sales",
    roles: ["admin", "manager"],
    comingSoon: false,
  },

  {
    title: "Sale Items",
    path: "/sale-items",
    icon: List,
    section: "Sales",
    roles: ["admin", "manager"],
    comingSoon: false,
  },

  {
    title: "Sale Payments",
    path: "/sale-payments",
    icon: CreditCard,
    section: "Sales",
    roles: ["admin", "manager"],
    comingSoon: false,
  },

  {
    title: "Sale Returns",
    path: "/sale-returns",
    icon: RotateCcw,
    section: "Sales",
    roles: ["admin", "manager"],
    comingSoon: true,
  },

  // =====================================================
  // CUSTOMERS
  // =====================================================

  {
    title: "Customers",
    path: "/customers",
    icon: UsersRound,
    section: "Customers",
    roles: ["admin", "manager"],
    comingSoon: false,
  },

  // =====================================================
  // FINANCE
  // =====================================================

  {
    title: "Expenses",
    path: "/expenses",
    icon: WalletCards,
    section: "Finance",
    roles: ["admin", "manager"],
    comingSoon: true,
  },

  {
    title: "Expense Categories",
    path: "/expense-categories",
    icon: FolderTree,
    section: "Finance",
    roles: ["admin", "manager"],
    comingSoon: true,
  },

  {
    title: "Cash Register",
    path: "/cash-register",
    icon: Landmark,
    section: "Finance",
    roles: ["admin", "manager"],
    comingSoon: false,
  },

  {
    title: "Payments",
    path: "/payments",
    icon: CircleDollarSign,
    section: "Finance",
    roles: ["admin", "manager"],
    comingSoon: true,
  },

  // =====================================================
  // REPORTS
  // =====================================================

  {
    title: "Dashboard Report",
    path: "/reports/dashboard",
    icon: BarChart3,
    section: "Reports",
    roles: ["admin", "manager"],
    comingSoon: true,
  },

  {
    title: "Sales Report",
    path: "/reports/sales",
    icon: BarChart3,
    section: "Reports",
    roles: ["admin", "manager"],
    comingSoon: true,
  },

  {
    title: "Top Products",
    path: "/reports/top-products",
    icon: ChartNoAxesCombined,
    section: "Reports",
    roles: ["admin", "manager"],
    comingSoon: true,
  },

  {
    title: "Purchases Report",
    path: "/reports/purchases",
    icon: ClipboardList,
    section: "Reports",
    roles: ["admin", "manager"],
    comingSoon: true,
  },

  {
    title: "Inventory Report",
    path: "/reports/inventory",
    icon: Warehouse,
    section: "Reports",
    roles: ["admin", "manager"],
    comingSoon: true,
  },

  {
    title: "Expenses Report",
    path: "/reports/expenses",
    icon: WalletCards,
    section: "Reports",
    roles: ["admin", "manager"],
    comingSoon: true,
  },

  {
    title: "Customers Report",
    path: "/reports/customers",
    icon: UsersRound,
    section: "Reports",
    roles: ["admin", "manager"],
    comingSoon: true,
  },

  {
    title: "Suppliers Report",
    path: "/reports/suppliers",
    icon: Truck,
    section: "Reports",
    roles: ["admin", "manager"],
    comingSoon: true,
  },

  {
    title: "Stock Movements Report",
    path: "/reports/stock-movements",
    icon: ArrowLeftRight,
    section: "Reports",
    roles: ["admin", "manager"],
    comingSoon: true,
  },

  {
    title: "Payments Report",
    path: "/reports/payments",
    icon: CreditCard,
    section: "Reports",
    roles: ["admin", "manager"],
    comingSoon: true,
  },

  {
    title: "Cash Register Report",
    path: "/reports/cash-register",
    icon: Landmark,
    section: "Reports",
    roles: ["admin", "manager"],
    comingSoon: true,
  },

  {
    title: "Profit & Loss",
    path: "/reports/profit-loss",
    icon: CircleDollarSign,
    section: "Reports",
    roles: ["admin", "manager"],
    comingSoon: true,
  },

  // =====================================================
  // SETTINGS
  // =====================================================

  {
    title: "Theme",
    path: "/settings/theme",
    icon: Palette,
    section: "Settings",
    roles: ["super-admin", "admin", "manager"],
    comingSoon: false,
  },

  {
    title: "Account",
    path: "/settings/account",
    icon: UserCog,
    section: "Settings",
    roles: ["super-admin", "admin", "manager"],
    comingSoon: true,
  },
];
