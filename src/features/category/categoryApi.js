import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =====================================================
    // GET ALL CATEGORIES
    // GET /api/categories
    //
    // Example:
    // useGetCategoriesQuery()
    //
    // Super Admin can optionally pass:
    // {
    //   business,
    //   businessType,
    //   search,
    //   isActive,
    //   page,
    //   limit
    // }
    //
    // Admin / Manager:
    // business + businessType are resolved by backend.
    // =====================================================

    getCategories: builder.query({
      query: (params = {}) => ({
        url: API_ROUTES.categories,
        method: "GET",
        params,
      }),

      transformResponse: (response) => {
        // Backend:
        //
        // {
        //   success: true,
        //   data: {
        //     categories: [],
        //     pagination: {}
        //   }
        // }

        if (
          Array.isArray(
            response?.data?.categories
          )
        ) {
          return {
            categories:
              response.data.categories,

            pagination:
              response.data.pagination || {
                page: 1,
                limit: 20,
                total: response.data.categories.length,
                totalPages: 1,
              },
          };
        }

        // Backend:
        //
        // {
        //   success: true,
        //   data: []
        // }

        if (Array.isArray(response?.data)) {
          return {
            categories: response.data,

            pagination: {
              page: 1,
              limit: response.data.length,
              total: response.data.length,
              totalPages: 1,
            },
          };
        }

        // Direct array fallback

        if (Array.isArray(response)) {
          return {
            categories: response,

            pagination: {
              page: 1,
              limit: response.length,
              total: response.length,
              totalPages: 1,
            },
          };
        }

        return {
          categories: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
        };
      },

      providesTags: (result) => [
        ...(Array.isArray(result?.categories)
          ? result.categories.map(
              (category) => ({
                type: "Category",
                id: category._id,
              })
            )
          : []),

        {
          type: "Category",
          id: "LIST",
        },
      ],
    }),

    // =====================================================
    // GET CATEGORY BY ID
    // GET /api/categories/:id
    //
    // Supports:
    //
    // useGetCategoryByIdQuery(id)
    //
    // OR Super Admin:
    //
    // useGetCategoryByIdQuery({
    //   id,
    //   business,
    //   businessType
    // })
    // =====================================================

    getCategoryById: builder.query({
      query: (arg) => {
        // -----------------------------------------------
        // Simple usage:
        //
        // arg = "categoryId"
        // -----------------------------------------------

        if (typeof arg === "string") {
          return {
            url: `${API_ROUTES.categories}/${arg}`,
            method: "GET",
          };
        }

        // -----------------------------------------------
        // Object usage:
        //
        // {
        //   id,
        //   business,
        //   businessType
        // }
        // -----------------------------------------------

        const {
          id,
          business,
          businessType,
        } = arg || {};

        const params = {};

        if (business) {
          params.business = business;
        }

        if (businessType) {
          params.businessType = businessType;
        }

        return {
          url: `${API_ROUTES.categories}/${id}`,
          method: "GET",
          params:
            Object.keys(params).length > 0
              ? params
              : undefined,
        };
      },

      transformResponse: (response) =>
        response.data,

      providesTags: (result, error, arg) => {
        const id =
          typeof arg === "string"
            ? arg
            : arg?.id;

        return [
          {
            type: "Category",
            id,
          },
        ];
      },
    }),

    // =====================================================
    // CREATE CATEGORY
    // POST /api/categories
    //
    // Supports:
    // - JSON
    // - FormData
    // - Image upload
    // =====================================================

    createCategory: builder.mutation({
      query: (body) => {
        const isFormData =
          typeof FormData !== "undefined" &&
          body instanceof FormData;

        return {
          url: API_ROUTES.categories,
          method: "POST",
          body,

          // Do NOT manually set Content-Type for FormData.
          // Browser will automatically add multipart boundary.
          ...(isFormData
            ? {}
            : {
                headers: {
                  "Content-Type":
                    "application/json",
                },
              }),
        };
      },

      transformResponse: (response) =>
        response.data,

      invalidatesTags: [
        {
          type: "Category",
          id: "LIST",
        },
      ],
    }),

    // =====================================================
    // UPDATE CATEGORY
    // PATCH /api/categories/:id
    //
    // Supports:
    // - JSON
    // - FormData
    // - New image
    // - Remove image
    // =====================================================

    updateCategory: builder.mutation({
      query: ({ id, body }) => {
        const isFormData =
          typeof FormData !== "undefined" &&
          body instanceof FormData;

        return {
          url: `${API_ROUTES.categories}/${id}`,
          method: "PATCH",
          body,

          // Do NOT manually set Content-Type for FormData.
          ...(isFormData
            ? {}
            : {
                headers: {
                  "Content-Type":
                    "application/json",
                },
              }),
        };
      },

      transformResponse: (response) =>
        response.data,

      invalidatesTags: (result, error, { id }) => [
        {
          type: "Category",
          id,
        },
        {
          type: "Category",
          id: "LIST",
        },
      ],
    }),

    // =====================================================
    // DELETE CATEGORY
    // DELETE /api/categories/:id
    //
    // Backend performs SOFT DELETE.
    // =====================================================

    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.categories}/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, id) => [
        {
          type: "Category",
          id,
        },
        {
          type: "Category",
          id: "LIST",
        },
      ],
    }),

    // =====================================================
    // RESTORE CATEGORY
    // PATCH /api/categories/:id/restore
    // =====================================================

    restoreCategory: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.categories}/${id}/restore`,
        method: "PATCH",
      }),

      transformResponse: (response) =>
        response.data,

      invalidatesTags: (result, error, id) => [
        {
          type: "Category",
          id,
        },
        {
          type: "Category",
          id: "LIST",
        },
      ],
    }),
  }),

  overrideExisting: false,
});

// =====================================================
// HOOKS
// =====================================================

export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useRestoreCategoryMutation,
} = categoriesApi;