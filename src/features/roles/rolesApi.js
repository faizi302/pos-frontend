import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

export const rolesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query({
      query: () => API_ROUTES.roles,
      transformResponse: (response) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map((r) => ({ type: "Role", id: r._id })),
              { type: "Role", id: "LIST" },
            ]
          : [{ type: "Role", id: "LIST" }],
    }),

    getRoleById: builder.query({
      query: (id) => `${API_ROUTES.roles}/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: "Role", id }],
    }),

    createRole: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.roles,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Role", id: "LIST" }],
    }),

    updateRole: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `${API_ROUTES.roles}/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Role", id },
        { type: "Role", id: "LIST" },
      ],
    }),

    deleteRole: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.roles}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Role", id: "LIST" }],
    }),

    toggleRoleStatus: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.roles}/${id}/toggle-status`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Role", id },
        { type: "Role", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useToggleRoleStatusMutation,
} = rolesApi;
