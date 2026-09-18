import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

export const permissionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPermissions: builder.query({
      query: () => API_ROUTES.permissions,
      transformResponse: (response) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "Permission", id: p._id })),
              { type: "Permission", id: "LIST" },
            ]
          : [{ type: "Permission", id: "LIST" }],
    }),

    getPermissionById: builder.query({
      query: (id) => `${API_ROUTES.permissions}/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: "Permission", id }],
    }),

    createPermission: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.permissions,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Permission", id: "LIST" }],
    }),

    updatePermission: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `${API_ROUTES.permissions}/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Permission", id },
        { type: "Permission", id: "LIST" },
      ],
    }),

    deletePermission: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.permissions}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Permission", id: "LIST" }],
    }),

    togglePermissionStatus: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.permissions}/${id}/toggle-status`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Permission", id },
        { type: "Permission", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetPermissionsQuery,
  useGetPermissionByIdQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
  useTogglePermissionStatusMutation,
} = permissionsApi;
