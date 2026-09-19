import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

export const salePaymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createSalePayment: builder.mutation({
      query: (data) => ({
        url: API_ROUTES.salePayments,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SalePayment", "Sale"],
    }),

    getAllSalePayments: builder.query({
      query: (params = {}) => ({
        url: API_ROUTES.salePayments,
        method: "GET",
        params,
      }),
      providesTags: ["SalePayment"],
    }),

    getSalePaymentsBySale: builder.query({
      query: (saleId) => ({
        url: `${API_ROUTES.salePayments}/sale/${saleId}`,
        method: "GET",
      }),
      providesTags: (result, error, saleId) => [
        "SalePayment",
        { type: "SalePayment", id: `SALE-${saleId}` },
      ],
    }),

    getSalePaymentById: builder.query({
      query: (id) => ({
        url: `${API_ROUTES.salePayments}/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [
        { type: "SalePayment", id },
      ],
    }),

    updateSalePayment: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${API_ROUTES.salePayments}/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["SalePayment", "Sale"],
    }),

    cancelSalePayment: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.salePayments}/${id}/cancel`,
        method: "PATCH",
      }),
      invalidatesTags: ["SalePayment", "Sale"],
    }),

    deleteSalePayment: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.salePayments}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SalePayment", "Sale"],
    }),
  }),
});

export const {
  useCreateSalePaymentMutation,
  useGetAllSalePaymentsQuery,
  useGetSalePaymentsBySaleQuery,
  useGetSalePaymentByIdQuery,
  useUpdateSalePaymentMutation,
  useCancelSalePaymentMutation,
  useDeleteSalePaymentMutation,
} = salePaymentApi;