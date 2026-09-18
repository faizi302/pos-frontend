import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =====================================================
    // GET ALL USERS
    //
    // GET /api/users
    //
    // Super Admin -> Admin users
    // Admin       -> Own managers
    // Manager     -> 403
    // =====================================================
    getUsers: builder.query({
      query: () => API_ROUTES.users,

      transformResponse: (response) => response.data,

      providesTags: (result) =>
        result
          ? [
              ...result.map((user) => ({
                type: "User",
                id: user._id,
              })),
              { type: "User", id: "LIST" },
            ]
          : [{ type: "User", id: "LIST" }],
    }),

    // =====================================================
    // GET USER BY ID
    //
    // GET /api/users/:id
    //
    // Super Admin -> Admin + managers
    // Admin       -> Own manager
    // Manager     -> 403
    // =====================================================
    getUserById: builder.query({
      query: (id) => `${API_ROUTES.users}/${id}`,

      transformResponse: (response) => response.data,

      providesTags: (result, error, id) => [
        { type: "User", id },
      ],
    }),

    // =====================================================
    // CREATE USER
    //
    // POST /api/users
    //
    // Super Admin -> Create Admin
    // Admin       -> Backend may create Manager
    //
    // For Admin Manager UI, prefer createManager().
    // =====================================================
    createUser: builder.mutation({
      query: (body) => {
        const isFormData =
          typeof FormData !== "undefined" &&
          body instanceof FormData;

        return {
          url: API_ROUTES.users,
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
        { type: "User", id: "LIST" },
        { type: "Manager", id: "LIST" },
      ],
    }),

    // =====================================================
    // UPDATE USER
    //
    // PATCH /api/users/:id
    //
    // Super Admin -> Update Admin
    // Admin       -> Update own Manager
    // =====================================================
    updateUser: builder.mutation({
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
        { type: "User", id },
        { type: "User", id: "LIST" },

        { type: "Manager", id },
        { type: "Manager", id: "LIST" },
      ],
    }),

    // =====================================================
    // DELETE USER
    //
    // DELETE /api/users/:id
    //
    // Super Admin -> Delete Admin
    // Admin       -> Delete own Manager
    // =====================================================
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.users}/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: [
        { type: "User", id: "LIST" },
        { type: "Manager", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi;