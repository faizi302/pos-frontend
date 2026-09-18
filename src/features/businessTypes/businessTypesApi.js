import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

export const businessTypesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBusinessTypes: builder.query({
      query: () => API_ROUTES.businessType,
      transformResponse: (response) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map((bt) => ({ type: "BusinessType", id: bt._id })),
              { type: "BusinessType", id: "LIST" },
            ]
          : [{ type: "BusinessType", id: "LIST" }],
    }),

    getPublicBusinessTypesByBusiness: builder.query({
  query: (businessId) =>
    `${API_ROUTES.businessType}/public/business/${businessId}`,
  transformResponse: (response) => response.data,
}),

    getBusinessTypesByBusiness: builder.query({
      query: (businessId) => `${API_ROUTES.businessType}/business/${businessId}`,
      transformResponse: (response) => response.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map((bt) => ({ type: "BusinessType", id: bt._id })),
              { type: "BusinessType", id: "LIST" },
            ]
          : [{ type: "BusinessType", id: "LIST" }],
    }),

    getBusinessTypeById: builder.query({
      query: (id) => `${API_ROUTES.businessType}/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: "BusinessType", id }],
    }),

    createBusinessType: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.businessType,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "BusinessType", id: "LIST" }],
    }),

    updateBusinessType: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `${API_ROUTES.businessType}/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "BusinessType", id },
        { type: "BusinessType", id: "LIST" },
      ],
    }),

    deleteBusinessType: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.businessType}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "BusinessType", id: "LIST" }],
    }),
  }),
});

export const {
  useGetBusinessTypesQuery,
  useGetPublicBusinessTypesByBusinessQuery,
  useGetBusinessTypesByBusinessQuery,
  useGetBusinessTypeByIdQuery,
  useCreateBusinessTypeMutation,
  useUpdateBusinessTypeMutation,
  useDeleteBusinessTypeMutation,
} = businessTypesApi;
