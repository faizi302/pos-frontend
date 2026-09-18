import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

export const managersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =====================================================
    // GET ALL MANAGERS
    //
    // Admin      -> own managers only
    // Super Admin -> all managers
    //
    // GET /api/users/managers
    // =====================================================
    getManagers: builder.query({
      query: () => API_ROUTES.managers,

      transformResponse: (response) => response.data,

      providesTags: (result) =>
        result
          ? [
              ...result.map((manager) => ({
                type: "Manager",
                id: manager._id,
              })),
              { type: "Manager", id: "LIST" },
            ]
          : [{ type: "Manager", id: "LIST" }],
    }),

    // =====================================================
    // GET MANAGER BY ID
    //
    // GET /api/users/managers/:id
    // =====================================================
    getManagerById: builder.query({
      query: (id) => `${API_ROUTES.managers}/${id}`,

      transformResponse: (response) => response.data,

      providesTags: (result, error, id) => [
        { type: "Manager", id },
      ],
    }),

    // =====================================================
    // CREATE MANAGER
    //
    // Admin only.
    //
    // POST /api/users/managers
    // =====================================================
    createManager: builder.mutation({
      query: (body) => {
        const isFormData =
          typeof FormData !== "undefined" &&
          body instanceof FormData;

        return {
          url: API_ROUTES.managers,
          method: "POST",
          body,

          ...(isFormData
            ? {}
            : {
                headers: {
                  "Content-Type": "application/json",
                },
              }),
        };
      },

      invalidatesTags: [
        { type: "Manager", id: "LIST" },
        { type: "User", id: "LIST" },
      ],
    }),

    // =====================================================
    // UPDATE MANAGER
    //
    // Uses existing:
    // PATCH /api/users/:id
    //
    // We keep this here because from the frontend
    // perspective the operation is Manager-related.
    // =====================================================
    updateManager: builder.mutation({
      query: ({ id, body }) => {
        const isFormData =
          typeof FormData !== "undefined" &&
          body instanceof FormData;

        return {
          url: `${API_ROUTES.users}/${id}`,
          method: "PATCH",
          body,

          ...(isFormData
            ? {}
            : {
                headers: {
                  "Content-Type": "application/json",
                },
              }),
        };
      },

      invalidatesTags: (result, error, { id }) => [
        { type: "Manager", id },
        { type: "Manager", id: "LIST" },
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),

    // =====================================================
    // DELETE MANAGER
    //
    // Uses existing:
    // DELETE /api/users/:id
    // =====================================================
    deleteManager: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.users}/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: [
        { type: "Manager", id: "LIST" },
        { type: "User", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetManagersQuery,
  useGetManagerByIdQuery,
  useCreateManagerMutation,
  useUpdateManagerMutation,
  useDeleteManagerMutation,
} = managersApi;