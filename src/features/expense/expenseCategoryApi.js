import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

export const expenseCategoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =====================================================
    // GET ALL EXPENSE CATEGORIES
    // GET /api/expense-categories
    // =====================================================
    getExpenseCategories: builder.query({
      query: (params = {}) => ({
        url: API_ROUTES.expenseCategories,
        method: "GET",
        params,
      }),

      // Keep the full payload so pagination is available
      transformResponse: (response) =>
        response?.data ?? { categories: [], pagination: {} },

      providesTags: (result) => {
        const list = Array.isArray(result?.categories)
          ? result.categories
          : Array.isArray(result)
          ? result
          : [];

        return [
          ...list.map((category) => ({
            type: "ExpenseCategory",
            id: category._id,
          })),
          { type: "ExpenseCategory", id: "LIST" },
        ];
      },
    }),

    // =====================================================
    // GET EXPENSE CATEGORY BY ID
    // GET /api/expense-categories/:id
    // =====================================================
    getExpenseCategoryById: builder.query({
      query: (id) => ({
        url: `${API_ROUTES.expenseCategories}/${id}`,
        method: "GET",
      }),

      transformResponse: (response) => response?.data || null,

      providesTags: (result, error, id) => [
        {
          type: "ExpenseCategory",
          id,
        },
      ],
    }),

    // =====================================================
    // CREATE EXPENSE CATEGORY
    // POST /api/expense-categories
    // =====================================================
    createExpenseCategory: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.expenseCategories,
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
        },
      }),

      transformResponse: (response) => response?.data || null,

      invalidatesTags: [
        {
          type: "ExpenseCategory",
          id: "LIST",
        },
      ],
    }),

    // =====================================================
    // UPDATE EXPENSE CATEGORY
    // PATCH /api/expense-categories/:id
    // =====================================================
    updateExpenseCategory: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `${API_ROUTES.expenseCategories}/${id}`,
        method: "PATCH",
        body,
        headers: {
          "Content-Type": "application/json",
        },
      }),

      transformResponse: (response) => response?.data || null,

      invalidatesTags: (result, error, { id }) => [
        {
          type: "ExpenseCategory",
          id,
        },
        {
          type: "ExpenseCategory",
          id: "LIST",
        },
      ],
    }),

    // =====================================================
    // SOFT DELETE EXPENSE CATEGORY
    // DELETE /api/expense-categories/:id
    // =====================================================
    deleteExpenseCategory: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.expenseCategories}/${id}`,
        method: "DELETE",
      }),

      transformResponse: (response) => response?.data || null,

      invalidatesTags: (result, error, id) => [
        {
          type: "ExpenseCategory",
          id,
        },
        {
          type: "ExpenseCategory",
          id: "LIST",
        },
      ],
    }),

    // =====================================================
    // RESTORE EXPENSE CATEGORY
    // PATCH /api/expense-categories/:id/restore
    // =====================================================
    restoreExpenseCategory: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.expenseCategories}/${id}/restore`,
        method: "PATCH",
      }),

      transformResponse: (response) => response?.data || null,

      invalidatesTags: (result, error, id) => [
        {
          type: "ExpenseCategory",
          id,
        },
        {
          type: "ExpenseCategory",
          id: "LIST",
        },
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetExpenseCategoriesQuery,
  useLazyGetExpenseCategoriesQuery,
  useGetExpenseCategoryByIdQuery,
  useLazyGetExpenseCategoryByIdQuery,
  useCreateExpenseCategoryMutation,
  useUpdateExpenseCategoryMutation,
  useDeleteExpenseCategoryMutation,
  useRestoreExpenseCategoryMutation,
} = expenseCategoryApi;