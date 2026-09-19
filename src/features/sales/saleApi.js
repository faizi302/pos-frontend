import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

export const saleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createSale: builder.mutation({
      query: (data) => ({
        url: API_ROUTES.sales,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Sale", "SaleItem", "SalePayment", "ProductInventory"],
    }),

    getAllSales: builder.query({
      query: (params = {}) => ({
        url: API_ROUTES.sales,
        method: "GET",
        params,
      }),
      providesTags: ["Sale"],
    }),

    getSaleById: builder.query({
      query: (id) => ({
        url: `${API_ROUTES.sales}/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [
        { type: "Sale", id },
      ],
    }),

    updateSale: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${API_ROUTES.sales}/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Sale",
        { type: "Sale", id },
        "SaleItem",
        "SalePayment",
      ],
    }),

    cancelSale: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.sales}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        "Sale",
        "SaleItem",
        "SalePayment",
        "ProductInventory",
      ],
    }),

    restoreSale: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.sales}/${id}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: [
        "Sale",
        "SaleItem",
        "SalePayment",
        "ProductInventory",
      ],
    }),
  }),
});

export const {
  useCreateSaleMutation,
  useGetAllSalesQuery,
  useGetSaleByIdQuery,
  useUpdateSaleMutation,
  useCancelSaleMutation,
  useRestoreSaleMutation,
} = saleApi;