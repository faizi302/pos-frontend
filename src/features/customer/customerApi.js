import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

export const customersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =====================================================
    // GET ALL CUSTOMERS
    // GET /api/customers
    //
    // Example:
    // useGetCustomersQuery()
    //
    // Optional params:
    // {
    //   search,
    //   isActive,
    //   page,
    //   limit
    // }
    //
    // Super Admin can optionally pass:
    // {
    //   business,
    //   businessType
    // }
    //
    // Admin / Manager:
    // business + businessType are resolved by backend.
    // =====================================================

    getCustomers: builder.query({
      query: (params = {}) => ({
        url: API_ROUTES.customers,
        method: "GET",
        params,
      }),

      transformResponse: (response) => {
        // -----------------------------------------------
        // Backend:
        //
        // {
        //   success: true,
        //   data: {
        //     customers: [],
        //     pagination: {}
        //   }
        // }
        // -----------------------------------------------

        if (
          Array.isArray(
            response?.data?.customers
          )
        ) {
          return {
            customers:
              response.data.customers,

            pagination:
              response.data.pagination || {
                page: 1,
                limit: 20,
                total:
                  response.data.customers.length,
                totalPages: 1,
              },
          };
        }

        // -----------------------------------------------
        // Backend:
        //
        // {
        //   success: true,
        //   data: []
        // }
        // -----------------------------------------------

        if (Array.isArray(response?.data)) {
          return {
            customers: response.data,

            pagination: {
              page: 1,
              limit: response.data.length,
              total: response.data.length,
              totalPages: 1,
            },
          };
        }

        // -----------------------------------------------
        // Direct array fallback
        // -----------------------------------------------

        if (Array.isArray(response)) {
          return {
            customers: response,

            pagination: {
              page: 1,
              limit: response.length,
              total: response.length,
              totalPages: 1,
            },
          };
        }

        // -----------------------------------------------
        // Empty fallback
        // -----------------------------------------------

        return {
          customers: [],

          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
        };
      },

      providesTags: (result) => [
        ...(Array.isArray(result?.customers)
          ? result.customers.map(
              (customer) => ({
                type: "Customer",
                id: customer._id,
              })
            )
          : []),

        {
          type: "Customer",
          id: "LIST",
        },
      ],
    }),

    // =====================================================
    // GET CUSTOMER BY ID
    // GET /api/customers/:id
    //
    // Supports:
    //
    // useGetCustomerByIdQuery(customerId)
    //
    // OR Super Admin:
    //
    // useGetCustomerByIdQuery({
    //   id,
    //   business,
    //   businessType
    // })
    //
    // Note:
    // Admin / Manager do not need to send business or
    // businessType. Backend resolves tenant context.
    // =====================================================

    getCustomerById: builder.query({
      query: (arg) => {
        // -----------------------------------------------
        // Simple usage:
        //
        // arg = "customerId"
        // -----------------------------------------------

        if (typeof arg === "string") {
          return {
            url: `${API_ROUTES.customers}/${arg}`,
            method: "GET",
          };
        }

        // -----------------------------------------------
        // Object usage:
        //
        // {
        //   id,
        //   business,
        //   businessType
        // }
        // -----------------------------------------------

        const {
          id,
          business,
          businessType,
        } = arg || {};

        const params = {};

        if (business) {
          params.business = business;
        }

        if (businessType) {
          params.businessType = businessType;
        }

        return {
          url: `${API_ROUTES.customers}/${id}`,
          method: "GET",

          params:
            Object.keys(params).length > 0
              ? params
              : undefined,
        };
      },

      transformResponse: (response) =>
        response.data,

      providesTags: (result, error, arg) => {
        const id =
          typeof arg === "string"
            ? arg
            : arg?.id;

        return [
          {
            type: "Customer",
            id,
          },
        ];
      },
    }),

    // =====================================================
    // CREATE CUSTOMER
    // POST /api/customers
    //
    // JSON request
    //
    // Admin / Manager:
    // Do NOT send business/businessType for security.
    //
    // Super Admin:
    // Can optionally send business/businessType if
    // creating a customer for a specific tenant.
    // =====================================================

    createCustomer: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.customers,
        method: "POST",
        body,

        headers: {
          "Content-Type": "application/json",
        },
      }),

      transformResponse: (response) =>
        response.data,

      invalidatesTags: [
        {
          type: "Customer",
          id: "LIST",
        },
      ],
    }),

    // =====================================================
    // UPDATE CUSTOMER
    // PATCH /api/customers/:id
    //
    // Example:
    //
    // updateCustomer({
    //   id: customerId,
    //   body: {
    //     name: "...",
    //     phone: "..."
    //   }
    // })
    //
    // business/businessType should NOT be changed here.
    // Backend controls tenant ownership.
    // =====================================================

    updateCustomer: builder.mutation({
      query: ({ id, body }) => ({
        url: `${API_ROUTES.customers}/${id}`,
        method: "PATCH",
        body,

        headers: {
          "Content-Type": "application/json",
        },
      }),

      transformResponse: (response) =>
        response.data,

      invalidatesTags: (
        result,
        error,
        { id }
      ) => [
        {
          type: "Customer",
          id,
        },
        {
          type: "Customer",
          id: "LIST",
        },
      ],
    }),

    // =====================================================
    // DELETE CUSTOMER
    // DELETE /api/customers/:id
    //
    // Backend performs SOFT DELETE.
    // =====================================================

    deleteCustomer: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.customers}/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: (
        result,
        error,
        id
      ) => [
        {
          type: "Customer",
          id,
        },
        {
          type: "Customer",
          id: "LIST",
        },
      ],
    }),

    // =====================================================
    // RESTORE CUSTOMER
    // PATCH /api/customers/:id/restore
    // =====================================================

    restoreCustomer: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.customers}/${id}/restore`,
        method: "PATCH",
      }),

      transformResponse: (response) =>
        response.data,

      invalidatesTags: (
        result,
        error,
        id
      ) => [
        {
          type: "Customer",
          id,
        },
        {
          type: "Customer",
          id: "LIST",
        },
      ],
    }),
  }),

  overrideExisting: false,
});

// =====================================================
// HOOKS
// =====================================================

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useRestoreCustomerMutation,
} = customersApi;