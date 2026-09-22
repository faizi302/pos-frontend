import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

export const brandsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =====================================================
    // GET ALL BRANDS
    // GET /api/brands?search=&isActive=&business=&businessType=&tenantOwner=
    // =====================================================
    getBrands: builder.query({
      query: (params = {}) => ({
        url: API_ROUTES.brands,
        method: "GET",
        params,
      }),
      transformResponse: (response) => response?.data ?? response,
      providesTags: (result) =>
        result
          ? [
              ...(Array.isArray(result)
                ? result.map((b) => ({ type: "Brand", id: b._id }))
                : []),
              { type: "Brand", id: "LIST" },
            ]
          : [{ type: "Brand", id: "LIST" }],
    }),

    // =====================================================
    // GET BRANDS BY BUSINESS TYPE
    // GET /api/brands/business-type/:businessTypeId
    // =====================================================
    getBrandsByBusinessType: builder.query({
      query: (businessTypeId) => ({
        url: `${API_ROUTES.brands}/business-type/${businessTypeId}`,
        method: "GET",
      }),
      transformResponse: (response) => response?.data ?? response,
      providesTags: (result, error, businessTypeId) =>
        result
          ? [
              ...(Array.isArray(result)
                ? result.map((b) => ({ type: "Brand", id: b._id }))
                : []),
              { type: "Brand", id: `BUSINESS_TYPE_${businessTypeId}` },
              { type: "Brand", id: "LIST" },
            ]
          : [
              { type: "Brand", id: `BUSINESS_TYPE_${businessTypeId}` },
              { type: "Brand", id: "LIST" },
            ],
    }),

    // =====================================================
    // GET BRAND BY ID
    // GET /api/brands/:id
    // =====================================================
    getBrandById: builder.query({
      query: (id) => ({
        url: `${API_ROUTES.brands}/${id}`,
        method: "GET",
      }),
      transformResponse: (response) => response?.data ?? response,
      providesTags: (result, error, id) => [{ type: "Brand", id }],
    }),

    // =====================================================
    // CREATE BRAND
    // POST /api/brands
    // Admin body: { name, description?, isActive? }
    // Super Admin body: + business, businessType, tenantOwner
    // =====================================================
    createBrand: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.brands,
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Brand", id: "LIST" },
        // business-type lists refresh after create
        { type: "Brand" },
      ],
    }),

    // =====================================================
    // UPDATE BRAND
    // PUT /api/brands/:id
    // =====================================================
    updateBrand: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `${API_ROUTES.brands}/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Brand", id },
        { type: "Brand", id: "LIST" },
        { type: "Brand" },
      ],
    }),

    // =====================================================
    // DELETE BRAND
    // DELETE /api/brands/:id
    // =====================================================
    deleteBrand: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.brands}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Brand", id },
        { type: "Brand", id: "LIST" },
        { type: "Brand" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBrandsQuery,
  useLazyGetBrandsQuery,
  useGetBrandsByBusinessTypeQuery,
  useLazyGetBrandsByBusinessTypeQuery,
  useGetBrandByIdQuery,
  useLazyGetBrandByIdQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} = brandsApi;