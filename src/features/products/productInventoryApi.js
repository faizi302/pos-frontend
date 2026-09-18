import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

const productInventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ==========================================
    // GET ALL PRODUCT INVENTORY
    // ==========================================
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
      } = {}) => {
        const params = new URLSearchParams();

        params.append("page", page);
        params.append("limit", limit);

        if (product) {
          params.append("product", product);
        }

        if (business) {
          params.append("business", business);
        }

        if (businessType) {
          params.append("businessType", businessType);
        }

        if (color) {
          params.append("color", color);
        }

        if (size) {
          params.append("size", size);
        }

        if (stockStatus) {
          params.append("stockStatus", stockStatus);
        }

        if (search) {
          params.append("search", search);
        }

        return {
          url: API_ROUTES.productInventory,
          method: "GET",
          params,
        };
      },

      providesTags: (result) => [
        {
          type: "ProductInventory",
          id: "LIST",
        },

        ...(result?.data?.inventory?.map((item) => ({
          type: "ProductInventory",
          id: item._id,
        })) || []),
      ],
    }),

    // ==========================================
    // GET INVENTORY FOR ONE PRODUCT
    // ==========================================
    getProductInventoryByProduct: builder.query({
      query: (productId) => ({
        url: `${API_ROUTES.productInventory}/product/${productId}`,
        method: "GET",
      }),

      providesTags: (result, error, productId) => [
        {
          type: "ProductInventory",
          id: `PRODUCT-${productId}`,
        },
      ],
    }),

    // ==========================================
    // GET SINGLE INVENTORY
    // ==========================================
    getProductInventoryById: builder.query({
      query: (id) => ({
        url: `${API_ROUTES.productInventory}/${id}`,
        method: "GET",
      }),

      providesTags: (result, error, id) => [
        {
          type: "ProductInventory",
          id,
        },
      ],
    }),

    // ==========================================
    // CREATE INVENTORY
    // ==========================================
    createProductInventory: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.productInventory,
        method: "POST",
        body,
      }),

      invalidatesTags: [
        {
          type: "ProductInventory",
          id: "LIST",
        },
        "ProductInventory",
        "Product",
      ],
    }),

    // ==========================================
    // UPDATE INVENTORY
    // ==========================================
    updateProductInventory: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `${API_ROUTES.productInventory}/${id}`,
        method: "PATCH",
        body,
      }),

      invalidatesTags: (result, error, { id, product }) => [
        {
          type: "ProductInventory",
          id,
        },
        {
          type: "ProductInventory",
          id: "LIST",
        },

        ...(product
          ? [
              {
                type: "ProductInventory",
                id: `PRODUCT-${product}`,
              },
            ]
          : []),
      ],
    }),

    // ==========================================
    // UPDATE STOCK
    // ==========================================
    updateProductStock: builder.mutation({
      query: ({
        id,
        quantity,
        operation = "set",
      }) => ({
        url: `${API_ROUTES.productInventory}/${id}/stock`,
        method: "PATCH",
        body: {
          quantity,
          operation,
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        {
          type: "ProductInventory",
          id,
        },
        {
          type: "ProductInventory",
          id: "LIST",
        },
      ],
    }),

    // ==========================================
    // DELETE INVENTORY
    // ==========================================
    deleteProductInventory: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.productInventory}/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: [
        {
          type: "ProductInventory",
          id: "LIST",
        },
        "ProductInventory",
      ],
    }),

    // ==========================================
    // RESTORE INVENTORY
    // ==========================================
    restoreProductInventory: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.productInventory}/${id}/restore`,
        method: "PATCH",
      }),

      invalidatesTags: [
        {
          type: "ProductInventory",
          id: "LIST",
        },
        "ProductInventory",
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetProductInventoryQuery,
  useGetProductInventoryByProductQuery,
  useGetProductInventoryByIdQuery,

  useCreateProductInventoryMutation,
  useUpdateProductInventoryMutation,
  useUpdateProductStockMutation,
  useDeleteProductInventoryMutation,
  useRestoreProductInventoryMutation,
} = productInventoryApi;

export default productInventoryApi;