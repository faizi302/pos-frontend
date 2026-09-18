import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ==================================================
    // GET ALL PRODUCTS
    // GET /api/products
    // ==================================================
    getProducts: builder.query({
      query: (params = {}) => ({
        url: API_ROUTES.products,
        method: "GET",
        params,
      }),

      transformResponse: (response) => response.data,

      providesTags: (result) =>
        result?.products
          ? [
              ...result.products.map((product) => ({
                type: "Product",
                id: product._id,
              })),
              { type: "Product", id: "LIST" },
            ]
          : [{ type: "Product", id: "LIST" }],
    }),

    // ==================================================
    // GET PRODUCT BY ID
    // GET /api/products/:id
    // ==================================================
    getProductById: builder.query({
      query: ({ id, business, businessType } = {}) => {
        const params = {};

        if (business) {
          params.business = business;
        }

        if (businessType) {
          params.businessType = businessType;
        }

        return {
          url: `${API_ROUTES.products}/${id}`,
          method: "GET",
          params:
            Object.keys(params).length > 0
              ? params
              : undefined,
        };
      },

      transformResponse: (response) => response.data,

      providesTags: (result, error, { id }) => [
        { type: "Product", id },
      ],
    }),

    // ==================================================
    // CREATE PRODUCT
    // POST /api/products
    //
    // Supports:
    // - Product fields
    // - Multiple images
    // - FormData
    // ==================================================
    createProduct: builder.mutation({
      query: (body) => {
        const isFormData =
          typeof FormData !== "undefined" &&
          body instanceof FormData;

        return {
          url: API_ROUTES.products,
          method: "POST",
          body,

          // IMPORTANT:
          // Never manually set Content-Type for FormData.
          // Browser automatically adds:
          //
          // multipart/form-data; boundary=...
          //
          ...(isFormData
            ? {}
            : {
                headers: {
                  "Content-Type": "application/json",
                },
              }),
        };
      },

      transformResponse: (response) => response.data,

      invalidatesTags: [
        { type: "Product", id: "LIST" },
      ],
    }),

    // ==================================================
    // UPDATE PRODUCT
    // PATCH /api/products/:id
    //
    // Supports:
    // - Product field updates
    // - Brand / model / category changes
    // - Price changes
    // - Boolean fields
    // - Add images
    // - Remove images
    // ==================================================
    updateProduct: builder.mutation({
      query: ({ id, body }) => {
        const isFormData =
          typeof FormData !== "undefined" &&
          body instanceof FormData;

        return {
          url: `${API_ROUTES.products}/${id}`,
          method: "PATCH",
          body,

          ...(isFormData
            ? {}
            : {
                headers: {
                  "Content-Type": "application/json",
                },
              }),
        };
      },

      transformResponse: (response) => response.data,

      invalidatesTags: (result, error, { id }) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
      ],
    }),

    // ==================================================
    // DELETE PRODUCT
    // DELETE /api/products/:id
    //
    // Backend performs SOFT DELETE:
    // - Product -> isActive = false
    // - Inventory -> isActive = false
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
    //
    // Backend restores:
    // - Product
    // - Product inventory
    // ==================================================
    restoreProduct: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.products}/${id}/restore`,
        method: "PATCH",
      }),

      transformResponse: (response) => response.data,

      invalidatesTags: (result, error, id) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
      ],
    }),
  }),
});

// ======================================================
// EXPORT HOOKS
// ======================================================

export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useRestoreProductMutation,
} = productsApi;