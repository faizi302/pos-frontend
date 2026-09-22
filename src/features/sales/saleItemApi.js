import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

export const saleItemApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createSaleItem: builder.mutation({
      query: (data) => ({
        url: API_ROUTES.saleItems,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SaleItem", "Sale", "ProductInventory"],
    }),

    getAllSaleItems: builder.query({
      query: (params = {}) => ({
        url: API_ROUTES.saleItems,
        method: "GET",
        params,
      }),
      providesTags: ["SaleItem"],
    }),

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

    getSaleItemById: builder.query({
      query: (id) => ({
        url: `${API_ROUTES.saleItems}/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "SaleItem", id }],
    }),

    updateSaleItem: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${API_ROUTES.saleItems}/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["SaleItem", "Sale", "ProductInventory"],
    }),

    deleteSaleItem: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.saleItems}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SaleItem", "Sale", "ProductInventory"],
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