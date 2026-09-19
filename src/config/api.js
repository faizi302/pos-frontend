// Centralized API configuration.
// Never hardcode API URLs anywhere else in the app — import from here.

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// Backend route groups.
export const API_ROUTES = {
  // Users
  users: "/users",
  managers: "/users/managers",

  // Permissions & Roles
  permissions: "/permissions",
  roles: "/roles",

  // Business hierarchy
  business: "/business",
  businessType: "/business-type",
  brands: "/brand",
  models: "/model",
  categories: "/Prod-cat",

  // Products
  products: "/products",
  productInventory: "/products-Inventory",

  // Customers
  customers: "/customers",

  // Cash Register
  cashRegisters: "/cash-register",

  // Sales
  sales: "/sale",
  saleItems: "/sale-item",
  salePayments: "/sale-payment",

   payments: "/payment",
};