import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

export const saleItemApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ====================== CREATE ======================
    createSaleItem: builder.mutation({
      query: (data) => ({
        url: API_ROUTES.saleItems,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        "SaleItem",
        "Sale",
        "ProductInventory",
        "InventoryUnit", // ← important
        { type: "InventoryUnit", id: "LIST" },
        // More precise invalidation (recommended)
        ...(arg?.productInventory
          ? [
              {
                type: "InventoryUnit",
                id: `PRODUCT-INVENTORY-${arg.productInventory}`,
              },
            ]
          : []),
      ],
    }),

    // ====================== GET ALL ======================
    getAllSaleItems: builder.query({
      query: (params = {}) => ({
        url: API_ROUTES.saleItems,
        method: "GET",
        params,
      }),
      providesTags: ["SaleItem"],
    }),

    // ====================== GET BY SALE ======================
    getSaleItemsBySale: builder.query({
      query: (saleId) => ({
        url: `${API_ROUTES.saleItems}/sale/${saleId}`,
        method: "GET",
      }),
      providesTags: (result, error, saleId) => [
        "SaleItem",
        { type: "SaleItem", id: `SALE-${saleId}` },
      ],
    }),

    // ====================== GET BY ID ======================
    getSaleItemById: builder.query({
      query: (id) => ({
        url: `${API_ROUTES.saleItems}/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "SaleItem", id }],
    }),

    // ====================== UPDATE ======================
    updateSaleItem: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${API_ROUTES.saleItems}/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        "SaleItem",
        "Sale",
        "ProductInventory",
        "InventoryUnit",
        { type: "InventoryUnit", id: "LIST" },
        ...(arg?.productInventory
          ? [
              {
                type: "InventoryUnit",
                id: `PRODUCT-INVENTORY-${arg.productInventory}`,
              },
            ]
          : []),
      ],
    }),

    // ====================== DELETE ======================
    deleteSaleItem: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.saleItems}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        "SaleItem",
        "Sale",
        "ProductInventory",
        "InventoryUnit",
        { type: "InventoryUnit", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useCreateSaleItemMutation,
  useGetAllSaleItemsQuery,
  useGetSaleItemsBySaleQuery,
  useGetSaleItemByIdQuery,
  useUpdateSaleItemMutation,
  useDeleteSaleItemMutation,
} = saleItemApi;