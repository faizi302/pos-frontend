import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

export const modelsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =====================================================
    // GET ALL MODELS
    // GET /api/models?search=&isActive=&brand=&business=&businessType=&tenantOwner=
    // =====================================================
    getModels: builder.query({
      query: (params = {}) => ({
        url: API_ROUTES.models,
        method: "GET",
        params,
      }),
      transformResponse: (response) => response?.data ?? response,
      providesTags: (result) =>
        result
          ? [
              ...(Array.isArray(result)
                ? result.map((m) => ({ type: "Model", id: m._id }))
                : []),
              { type: "Model", id: "LIST" },
            ]
          : [{ type: "Model", id: "LIST" }],
    }),

    // =====================================================
    // GET MODELS BY BRAND
    // GET /api/models/brand/:brandId
    // =====================================================
    getModelsByBrand: builder.query({
      query: (brandId) => ({
        url: `${API_ROUTES.models}/brand/${brandId}`,
        method: "GET",
      }),
      transformResponse: (response) => response?.data ?? response,
      providesTags: (result, error, brandId) =>
        result
          ? [
              ...(Array.isArray(result)
                ? result.map((m) => ({ type: "Model", id: m._id }))
                : []),
              { type: "Model", id: `BRAND_${brandId}` },
              { type: "Model", id: "LIST" },
            ]
          : [
              { type: "Model", id: `BRAND_${brandId}` },
              { type: "Model", id: "LIST" },
            ],
    }),

    // =====================================================
    // GET MODEL BY ID
    // GET /api/models/:id
    // =====================================================
    getModelById: builder.query({
      query: (id) => ({
        url: `${API_ROUTES.models}/${id}`,
        method: "GET",
      }),
      transformResponse: (response) => response?.data ?? response,
      providesTags: (result, error, id) => [{ type: "Model", id }],
    }),

    // =====================================================
    // CREATE MODEL
    // POST /api/models
    // Admin body: { name, brand, description?, isActive? }
    // Super Admin: + business, businessType, tenantOwner
    // =====================================================
    createModel: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.models,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, body) => [
        { type: "Model", id: "LIST" },
        { type: "Model" },
        ...(body?.brand
          ? [{ type: "Model", id: `BRAND_${body.brand}` }]
          : []),
      ],
    }),

    // =====================================================
    // UPDATE MODEL
    // PUT /api/models/:id
    // =====================================================
    updateModel: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `${API_ROUTES.models}/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Model", id: arg.id },
        { type: "Model", id: "LIST" },
        { type: "Model" },
        ...(arg?.brand
          ? [{ type: "Model", id: `BRAND_${arg.brand}` }]
          : []),
      ],
    }),

    // =====================================================
    // DELETE MODEL
    // DELETE /api/models/:id
    // =====================================================
    deleteModel: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.models}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Model", id },
        { type: "Model", id: "LIST" },
        { type: "Model" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetModelsQuery,
  useLazyGetModelsQuery,
  useGetModelsByBrandQuery,
  useLazyGetModelsByBrandQuery,
  useGetModelByIdQuery,
  useLazyGetModelByIdQuery,
  useCreateModelMutation,
  useUpdateModelMutation,
  useDeleteModelMutation,
} = modelsApi;