import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ==================================================
    // GET ALL PRODUCTS
    // GET /api/products?page&limit&search&category&brand&model&productType&isActive&trackSerial&stockStatus
    // Response data: { products, pagination }
    // ==================================================
    getProducts: builder.query({
      query: (params = {}) => ({
        url: API_ROUTES.products,
        method: "GET",
        params,
      }),
      transformResponse: (response) => response?.data ?? response,
      providesTags: (result) => {
        const list = result?.products;
        if (Array.isArray(list)) {
          return [
            ...list.map((p) => ({ type: "Product", id: p._id })),
            { type: "Product", id: "LIST" },
          ];
        }
        return [{ type: "Product", id: "LIST" }];
      },
    }),

    // ==================================================
    // GET PRODUCT BY ID
    // GET /api/products/:id
    // Accepts: id string  OR  { id, business?, businessType? }
    // ==================================================
    getProductById: builder.query({
      query: (arg) => {
        const id = typeof arg === "string" ? arg : arg?.id;
        const params = {};
        if (typeof arg === "object" && arg) {
          if (arg.business) params.business = arg.business;
          if (arg.businessType) params.businessType = arg.businessType;
        }
        return {
          url: `${API_ROUTES.products}/${id}`,
          method: "GET",
          params: Object.keys(params).length ? params : undefined,
        };
      },
      transformResponse: (response) => response?.data ?? response,
      providesTags: (result, error, arg) => {
        const id = typeof arg === "string" ? arg : arg?.id;
        return [{ type: "Product", id }];
      },
    }),

    // ==================================================
    // CREATE PRODUCT
    // POST /api/products  (JSON or FormData with field "images")
    // Admin body: category, brand, model?, name?, sku, salePrice, ...
    // Super Admin may also send tenantOwner / business / businessType
    // ==================================================
    createProduct: builder.mutation({
      query: (body) => {
        const isFormData =
          typeof FormData !== "undefined" && body instanceof FormData;
        return {
          url: API_ROUTES.products,
          method: "POST",
          body,
          // Let the browser set multipart boundary for FormData
          ...(isFormData
            ? {}
            : { headers: { "Content-Type": "application/json" } }),
        };
      },
      transformResponse: (response) => response?.data ?? response,
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),

    // ==================================================
    // UPDATE PRODUCT
    // PATCH /api/products/:id
    // Arg: { id, body } where body is JSON object or FormData
    // FormData may include "images" and "removeImages"
    // ==================================================
    updateProduct: builder.mutation({
      query: ({ id, body }) => {
        const isFormData =
          typeof FormData !== "undefined" && body instanceof FormData;
        return {
          url: `${API_ROUTES.products}/${id}`,
          method: "PATCH",
          body,
          ...(isFormData
            ? {}
            : { headers: { "Content-Type": "application/json" } }),
        };
      },
      transformResponse: (response) => response?.data ?? response,
      invalidatesTags: (result, error, { id }) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
      ],
    }),

    // ==================================================
    // DELETE PRODUCT (soft — isActive: false)
    // DELETE /api/products/:id
    // ==================================================
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.products}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
      ],
    }),

    // ==================================================
    // RESTORE PRODUCT
    // PATCH /api/products/:id/restore
    // ==================================================
    restoreProduct: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.products}/${id}/restore`,
        method: "PATCH",
      }),
      transformResponse: (response) => response?.data ?? response,
      invalidatesTags: (result, error, id) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProductsQuery,
  useLazyGetProductsQuery,
  useGetProductByIdQuery,
  useLazyGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useRestoreProductMutation,
} = productsApi;