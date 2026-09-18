import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

export const businessesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =====================================================
    // AUTHENTICATED - GET ALL BUSINESSES
    // =====================================================

    getBusinesses: builder.query({
      query: () => API_ROUTES.business,
      transformResponse: (response) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map((b) => ({
                type: "Business",
                id: b._id,
              })),
              { type: "Business", id: "LIST" },
            ]
          : [{ type: "Business", id: "LIST" }],
    }),

    // =====================================================
    // PUBLIC - GET ACTIVE BUSINESSES
    // =====================================================

    getPublicBusinesses: builder.query({
      query: () => `${API_ROUTES.business}/public`,
      transformResponse: (response) => response.data,
    }),

    // =====================================================
    // GET BUSINESS BY ID
    // =====================================================

    getBusinessById: builder.query({
      query: (id) => `${API_ROUTES.business}/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [
        { type: "Business", id },
      ],
    }),

    // =====================================================
    // CREATE
    // =====================================================

    createBusiness: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.business,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Business", id: "LIST" },
      ],
    }),

    // =====================================================
    // UPDATE
    // =====================================================

    updateBusiness: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `${API_ROUTES.business}/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Business", id },
        { type: "Business", id: "LIST" },
      ],
    }),

    // =====================================================
    // DELETE
    // =====================================================

    deleteBusiness: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.business}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Business", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetBusinessesQuery,
  useGetPublicBusinessesQuery,
  useGetBusinessByIdQuery,
  useCreateBusinessMutation,
  useUpdateBusinessMutation,
  useDeleteBusinessMutation,
} = businessesApi;