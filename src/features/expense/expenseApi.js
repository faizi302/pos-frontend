import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

export const expenseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =====================================================
    // GET ALL EXPENSES
    // GET /api/expenses
    // =====================================================
    getExpenses: builder.query({
      query: (params = {}) => ({
        url: API_ROUTES.expenses,
        method: "GET",
        params,
      }),

      // Keep the full payload so pagination is available
      transformResponse: (response) => response?.data ?? { expenses: [], pagination: {} },

      providesTags: (result) => {
        const list = Array.isArray(result?.expenses)
          ? result.expenses
          : Array.isArray(result)
          ? result
          : [];

        return [
          ...list.map((expense) => ({
            type: "Expense",
            id: expense._id,
          })),
          { type: "Expense", id: "LIST" },
        ];
      },
    }),

    // =====================================================
    // GET EXPENSE BY ID
    // GET /api/expenses/:id
    // =====================================================
    getExpenseById: builder.query({
      query: (id) => ({
        url: `${API_ROUTES.expenses}/${id}`,
        method: "GET",
      }),

      transformResponse: (response) => response?.data || null,

      providesTags: (result, error, id) => [
        {
          type: "Expense",
          id,
        },
      ],
    }),

    // =====================================================
    // CREATE EXPENSE
    // POST /api/expenses
    // =====================================================
    createExpense: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.expenses,
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
        },
      }),

      transformResponse: (response) => response?.data || null,

      invalidatesTags: [{ type: "Expense", id: "LIST" }],
    }),

    // =====================================================
    // UPDATE EXPENSE
    // PATCH /api/expenses/:id
    // =====================================================
    updateExpense: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `${API_ROUTES.expenses}/${id}`,
        method: "PATCH",
        body,
        headers: {
          "Content-Type": "application/json",
        },
      }),

      transformResponse: (response) => response?.data || null,

      invalidatesTags: (result, error, { id }) => [
        { type: "Expense", id },
        { type: "Expense", id: "LIST" },
      ],
    }),

    // =====================================================
    // CANCEL EXPENSE
    // PATCH /api/expenses/:id/cancel
    // =====================================================
    cancelExpense: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.expenses}/${id}/cancel`,
        method: "PATCH",
      }),

      transformResponse: (response) => response?.data || null,

      invalidatesTags: (result, error, id) => [
        { type: "Expense", id },
        { type: "Expense", id: "LIST" },
      ],
    }),

    // =====================================================
    // RESTORE EXPENSE
    // PATCH /api/expenses/:id/restore
    // =====================================================
    restoreExpense: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.expenses}/${id}/restore`,
        method: "PATCH",
      }),

      transformResponse: (response) => response?.data || null,

      invalidatesTags: (result, error, id) => [
        { type: "Expense", id },
        { type: "Expense", id: "LIST" },
      ],
    }),

    // =====================================================
    // SOFT DELETE EXPENSE
    // DELETE /api/expenses/:id
    // =====================================================
    deleteExpense: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.expenses}/${id}`,
        method: "DELETE",
      }),

      transformResponse: (response) => response?.data || null,

      invalidatesTags: (result, error, id) => [
        { type: "Expense", id },
        { type: "Expense", id: "LIST" },
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetExpensesQuery,
  useLazyGetExpensesQuery,
  useGetExpenseByIdQuery,
  useLazyGetExpenseByIdQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useCancelExpenseMutation,
  useRestoreExpenseMutation,
  useDeleteExpenseMutation,
} = expenseApi;