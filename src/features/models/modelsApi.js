import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

export const modelsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =====================================================
    // GET ALL MODELS
    // =====================================================
    getModels: builder.query({
      query: (params = {}) => ({
        url: API_ROUTES.models,
        method: "GET",
        params,
      }),

      transformResponse: (response) => response.data,

      providesTags: (result) =>
        result
          ? [
              ...result.map((model) => ({
                type: "Model",
                id: model._id,
              })),
              { type: "Model", id: "LIST" },
            ]
          : [{ type: "Model", id: "LIST" }],
    }),

    // =====================================================
    // GET MODELS BY BRAND
    // =====================================================
    getModelsByBrand: builder.query({
      query: (brandId) =>
        `${API_ROUTES.models}/brand/${brandId}`,

      transformResponse: (response) => response.data,

      providesTags: (result, error, brandId) =>
        result
          ? [
              ...result.map((model) => ({
                type: "Model",
                id: model._id,
              })),
              {
                type: "Model",
                id: `BRAND_${brandId}`,
              },
            ]
          : [
              {
                type: "Model",
                id: `BRAND_${brandId}`,
              },
            ],
    }),

    // =====================================================
    // GET MODEL BY ID
    // =====================================================
    getModelById: builder.query({
      query: (id) => `${API_ROUTES.models}/${id}`,

      transformResponse: (response) => response.data,

      providesTags: (result, error, id) => [
        {
          type: "Model",
          id,
        },
      ],
    }),

    // =====================================================
    // CREATE MODEL
    // =====================================================
    createModel: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.models,
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
        },
      }),

      invalidatesTags: [
        { type: "Model", id: "LIST" },
      ],
    }),

    // =====================================================
    // UPDATE MODEL
    // =====================================================
    updateModel: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `${API_ROUTES.models}/${id}`,
        method: "PUT",
        body,
        headers: {
          "Content-Type": "application/json",
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        { type: "Model", id },
        { type: "Model", id: "LIST" },
      ],
    }),

    // =====================================================
    // DELETE MODEL
    // =====================================================
    deleteModel: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.models}/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, id) => [
        { type: "Model", id },
        { type: "Model", id: "LIST" },
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetModelsQuery,
  useGetModelsByBrandQuery,
  useGetModelByIdQuery,
  useCreateModelMutation,
  useUpdateModelMutation,
  useDeleteModelMutation,
} = modelsApi;