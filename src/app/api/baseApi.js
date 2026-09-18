import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "@/config/api";

// A single RTK Query "api" instance. Every feature injects its own
// endpoints into this instance instead of creating separate APIs,
// so caching/tags/hooks all share one place.
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    credentials: "include", // backend auth relies on an httpOnly cookie
  }),
  tagTypes: [
    "User",
    "CurrentUser",
    "Business",
    "BusinessType",
    "Brand",
    "Model",
    "Role",
    "Permission",
  ],
  endpoints: () => ({}),
});
