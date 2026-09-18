import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

export const brandsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =====================================================
    // GET ALL BRANDS
    // =====================================================
    getBrands: builder.query({
      query: (params = {}) => ({
        url: API_ROUTES.brands,
        method: "GET",
        params,
      }),

      transformResponse: (response) => response.data,

      providesTags: (result) =>
        result
          ? [
              ...result.map((brand) => ({
                type: "Brand",
                id: brand._id,
              })),
              { type: "Brand", id: "LIST" },
            ]
          : [{ type: "Brand", id: "LIST" }],
    }),

    // =====================================================
    // GET BRANDS BY BUSINESS TYPE
    // =====================================================
    getBrandsByBusinessType: builder.query({
      query: (businessTypeId) =>
        `${API_ROUTES.brands}/business-type/${businessTypeId}`,

      transformResponse: (response) => response.data,

      providesTags: (result, error, businessTypeId) =>
        result
          ? [
              ...result.map((brand) => ({
                type: "Brand",
                id: brand._id,
              })),
              {
                type: "Brand",
                id: `BUSINESS_TYPE_${businessTypeId}`,
              },
            ]
          : [
              {
                type: "Brand",
                id: `BUSINESS_TYPE_${businessTypeId}`,
              },
            ],
    }),

    // =====================================================
    // GET BRAND BY ID
    // =====================================================
    getBrandById: builder.query({
      query: (id) => `${API_ROUTES.brands}/${id}`,

      transformResponse: (response) => response.data,

      providesTags: (result, error, id) => [
        {
          type: "Brand",
          id,
        },
      ],
    }),

    // =====================================================
    // CREATE BRAND
    // =====================================================
    createBrand: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.brands,
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
        },
      }),

      invalidatesTags: [
        { type: "Brand", id: "LIST" },
      ],
    }),

    // =====================================================
    // UPDATE BRAND
    // =====================================================
    updateBrand: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `${API_ROUTES.brands}/${id}`,
        method: "PUT",
        body,
        headers: {
          "Content-Type": "application/json",
        },
      }),

      invalidatesTags: (result, error, { id }) => [
        { type: "Brand", id },
        { type: "Brand", id: "LIST" },
      ],
    }),

    // =====================================================
    // DELETE BRAND
    // =====================================================
    deleteBrand: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.brands}/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, id) => [
        { type: "Brand", id },
        { type: "Brand", id: "LIST" },
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetBrandsQuery,
  useGetBrandsByBusinessTypeQuery,
  useGetBrandByIdQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
} = brandsApi;