import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

const productInventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ==================================================
    // GET ALL PRODUCT INVENTORY
    // GET /api/products-Inventory
    // Supports: page, limit, product, business, businessType,
    //           color, size, stockStatus, search, imei, unitBarcode
    // ==================================================
    getProductInventory: builder.query({
      query: ({
        page = 1,
        limit = 20,
        product = "",
        business = "",
        businessType = "",
        color = "",
        size = "",
        stockStatus = "",
        search = "",
        imei = "",
        unitBarcode = "",
      } = {}) => {
        const params = {
          page,
          limit,
          ...(product && { product }),
          ...(business && { business }),
          ...(businessType && { businessType }),
          ...(color && { color }),
          ...(size && { size }),
          ...(stockStatus && { stockStatus }),
          ...(search && { search }),
          ...(imei && { imei }),
          ...(unitBarcode && { unitBarcode }),
        };

        return {
          url: API_ROUTES.productInventory,
          method: "GET",
          params,
        };
      },

      transformResponse: (response) => response?.data ?? response,

      // Cache list for 60 seconds
      keepUnusedDataFor: 60,

      providesTags: (result) => {
        const list = result?.inventory || result?.data?.inventory || [];
        if (Array.isArray(list)) {
          return [
            ...list.map((item) => ({
              type: "ProductInventory",
              id: item._id,
            })),
            { type: "ProductInventory", id: "LIST" },
          ];
        }
        return [{ type: "ProductInventory", id: "LIST" }];
      },
    }),

    // ==================================================
    // GET INVENTORY FOR ONE PRODUCT
    // GET /api/products-Inventory/product/:productId
    // ==================================================
    getProductInventoryByProduct: builder.query({
      query: (productId) => ({
        url: `${API_ROUTES.productInventory}/product/${productId}`,
        method: "GET",
      }),

      transformResponse: (response) => response?.data ?? response,

      providesTags: (result, error, productId) => [
        { type: "ProductInventory", id: `PRODUCT-${productId}` },
        { type: "ProductInventory", id: "LIST" },
      ],
    }),

    // ==================================================
    // GET SINGLE INVENTORY BY ID
    // GET /api/products-Inventory/:id
    // ==================================================
    getProductInventoryById: builder.query({
      query: (id) => ({
        url: `${API_ROUTES.productInventory}/${id}`,
        method: "GET",
      }),

      transformResponse: (response) => response?.data ?? response,

      providesTags: (result, error, id) => [
        { type: "ProductInventory", id },
      ],
    }),

    // ==================================================
    // SCAN BY IMEI OR UNIT BARCODE
    // GET /api/products-Inventory/scan?code=...
    // (Keep if your backend supports it. Otherwise remove.)
    // ==================================================
    scanProductInventory: builder.query({
      query: (code) => ({
        url: `${API_ROUTES.productInventory}/scan`,
        method: "GET",
        params: { code },
      }),

      transformResponse: (response) => response?.data ?? response,

      // Scan results should not stay in cache long
      keepUnusedDataFor: 30,
    }),

    // ==================================================
    // CREATE INVENTORY
    // POST /api/products-Inventory
    // ==================================================
    createProductInventory: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.productInventory,
        method: "POST",
        body,
      }),

      transformResponse: (response) => response?.data ?? response,

      invalidatesTags: [
        { type: "ProductInventory", id: "LIST" },
        "ProductInventory",
        "Product",
      ],
    }),

    // ==================================================
    // UPDATE INVENTORY
    // PATCH /api/products-Inventory/:id
    // ==================================================
    updateProductInventory: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `${API_ROUTES.productInventory}/${id}`,
        method: "PATCH",
        body,
      }),

      transformResponse: (response) => response?.data ?? response,

      invalidatesTags: (result, error, { id, product }) => [
        { type: "ProductInventory", id },
        { type: "ProductInventory", id: "LIST" },
        ...(product
          ? [{ type: "ProductInventory", id: `PRODUCT-${product}` }]
          : []),
        "Product",
      ],
    }),

    // ==================================================
    // UPDATE STOCK
    // PATCH /api/products-Inventory/:id/stock
    // ==================================================
    updateProductStock: builder.mutation({
      query: ({ id, quantity, operation = "set" }) => ({
        url: `${API_ROUTES.productInventory}/${id}/stock`,
        method: "PATCH",
        body: { quantity, operation },
      }),

      transformResponse: (response) => response?.data ?? response,

      invalidatesTags: (result, error, { id }) => [
        { type: "ProductInventory", id },
        { type: "ProductInventory", id: "LIST" },
        "Product",
      ],
    }),

    // ==================================================
    // DELETE INVENTORY (soft)
    // DELETE /api/products-Inventory/:id
    // ==================================================
    deleteProductInventory: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.productInventory}/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: [
        { type: "ProductInventory", id: "LIST" },
        "ProductInventory",
        "Product",
      ],
    }),

    // ==================================================
    // RESTORE INVENTORY
    // PATCH /api/products-Inventory/:id/restore
    // ==================================================
    restoreProductInventory: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.productInventory}/${id}/restore`,
        method: "PATCH",
      }),

      transformResponse: (response) => response?.data ?? response,

      invalidatesTags: [
        { type: "ProductInventory", id: "LIST" },
        "ProductInventory",
        "Product",
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetProductInventoryQuery,
  useLazyGetProductInventoryQuery,
  useGetProductInventoryByProductQuery,
  useLazyGetProductInventoryByProductQuery,
  useGetProductInventoryByIdQuery,
  useLazyGetProductInventoryByIdQuery,
  useScanProductInventoryQuery,
  useLazyScanProductInventoryQuery, // perfect for barcode / IMEI scanners
  useCreateProductInventoryMutation,
  useUpdateProductInventoryMutation,
  useUpdateProductStockMutation,
  useDeleteProductInventoryMutation,
  useRestoreProductInventoryMutation,
} = productInventoryApi;

export default productInventoryApi;