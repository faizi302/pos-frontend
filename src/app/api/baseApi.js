import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { API_BASE_URL } from "@/config/api";

export const baseApi = createApi({
  reducerPath: "api",

  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    credentials: "include",
  }),

  tagTypes: [
    "User",
    "CurrentUser",
    "Business",
    "BusinessType",
    "Brand",
    "Model",
    "Category",
    "Role",
    "Permission",
    "Product",
    "ProductInventory",
    "Customer",
    "Sale",
    "SaleItem",
    "SalePayment",
    "CashRegister",
    "Payment",
  ],

  endpoints: () => ({}),
});