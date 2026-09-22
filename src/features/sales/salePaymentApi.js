import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

export const salePaymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =====================================================
    // CREATE SALE PAYMENT
    // =====================================================
    createSalePayment: builder.mutation({
      query: (data) => ({
        url: API_ROUTES.salePayments,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SalePayment", "Sale"],
    }),

    // =====================================================
    // GET ALL SALE PAYMENTS
    // =====================================================
    getAllSalePayments: builder.query({
      query: (params = {}) => ({
        url: API_ROUTES.salePayments,
        method: "GET",
        params,
      }),
      providesTags: ["SalePayment"],
    }),

    // =====================================================
    // GET PAYMENTS BY SALE
    // =====================================================
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

    // =====================================================
    // GET PAYMENT BY ID
    // =====================================================
    getSalePaymentById: builder.query({
      query: (id) => ({
        url: `${API_ROUTES.salePayments}/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [
        { type: "SalePayment", id },
      ],
    }),

    // =====================================================
    // UPDATE SALE PAYMENT
    // =====================================================
    updateSalePayment: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${API_ROUTES.salePayments}/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["SalePayment", "Sale"],
    }),

    // =====================================================
    // CANCEL SALE PAYMENT
    // =====================================================
    cancelSalePayment: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.salePayments}/${id}/cancel`,
        method: "PATCH",
      }),
      invalidatesTags: ["SalePayment", "Sale"],
    }),

    // =====================================================
    // DELETE SALE PAYMENT (blocked on backend)
    // =====================================================
    deleteSalePayment: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.salePayments}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SalePayment", "Sale"],
    }),
  }),
  overrideExisting: false,
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