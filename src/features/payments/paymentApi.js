import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =====================================================
    // CREATE PAYMENT
    // POST /api/payment/create
    // =====================================================
    createPayment: builder.mutation({
      query: (body) => ({
        url: `${API_ROUTES.payments}/create`,
        method: "POST",
        body,
      }),

      transformResponse: (response) => response?.data || null,

      invalidatesTags: [
        { type: "Payment", id: "LIST" },
        "Sale",
        "SalePayment",
      ],
    }),

    // =====================================================
    // CAPTURE PAYMENT
    // POST /api/payment/:id/capture
    // =====================================================
    capturePayment: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.payments}/${id}/capture`,
        method: "POST",
      }),

      transformResponse: (response) => response?.data || null,

      invalidatesTags: (result, error, id) => [
        { type: "Payment", id },
        { type: "Payment", id: "LIST" },
        "Sale",
        "SalePayment",
      ],
    }),

    // =====================================================
    // GET PAYMENT STATUS
    // GET /api/payment/:id
    // =====================================================
    getPaymentStatus: builder.query({
      query: (id) => ({
        url: `${API_ROUTES.payments}/${id}`,
        method: "GET",
      }),

      transformResponse: (response) => response?.data || null,

      providesTags: (result, error, id) => [
        { type: "Payment", id },
      ],
    }),

    // =====================================================
    // CANCEL PAYMENT
    // POST /api/payment/:id/cancel
    // =====================================================
    cancelPayment: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.payments}/${id}/cancel`,
        method: "POST",
      }),

      transformResponse: (response) => response?.data || null,

      invalidatesTags: (result, error, id) => [
        { type: "Payment", id },
        { type: "Payment", id: "LIST" },
        "Sale",
        "SalePayment",
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  useCreatePaymentMutation,
  useCapturePaymentMutation,
  useGetPaymentStatusQuery,
  useLazyGetPaymentStatusQuery,
  useCancelPaymentMutation,
} = paymentApi;