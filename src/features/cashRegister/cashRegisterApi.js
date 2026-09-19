import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

export const cashRegistersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =====================================================
    // GET CURRENT OPEN CASH REGISTER
    // GET /api/cash-registers/current
    //
    // Admin / Manager:
    // Backend automatically resolves their tenant.
    //
    // Super Admin:
    // Can optionally pass:
    //
    // {
    //   tenantOwner: "adminUserId"
    // }
    // =====================================================

    getCurrentCashRegister: builder.query({
      query: (params = {}) => ({
        url: `${API_ROUTES.cashRegisters}/current`,
        method: "GET",
        params,
      }),

      transformResponse: (response) => {
        return response?.data || null;
      },

      providesTags: (result) => [
        {
          type: "CashRegister",
          id: result?._id || "CURRENT",
        },
        {
          type: "CashRegister",
          id: "LIST",
        },
      ],
    }),

    // =====================================================
    // GET ALL CASH REGISTERS
    // GET /api/cash-registers
    //
    // Supports:
    //
    // page
    // limit
    // status
    // user
    // startDate
    // endDate
    // search
    //
    // Super Admin can also pass:
    //
    // tenantOwner
    // business
    //
    // Example:
    //
    // useGetCashRegistersQuery({
    //   page: 1,
    //   limit: 20,
    //   status: "closed",
    //   search: "REG-000001"
    // })
    // =====================================================

    getCashRegisters: builder.query({
      query: (params = {}) => ({
        url: API_ROUTES.cashRegisters,
        method: "GET",
        params,
      }),

      transformResponse: (response) => {
        // -------------------------------------------------
        // Backend response:
        //
        // {
        //   success: true,
        //   data: {
        //     registers: [],
        //     pagination: {}
        //   }
        // }
        // -------------------------------------------------

        if (
          Array.isArray(
            response?.data?.registers
          )
        ) {
          return {
            registers:
              response.data.registers,

            pagination:
              response.data.pagination || {
                page: 1,
                limit: 20,
                total:
                  response.data.registers.length,
                totalPages: 1,
              },
          };
        }

        // -------------------------------------------------
        // Fallback:
        //
        // {
        //   success: true,
        //   data: []
        // }
        // -------------------------------------------------

        if (Array.isArray(response?.data)) {
          return {
            registers: response.data,

            pagination: {
              page: 1,
              limit: response.data.length,
              total: response.data.length,
              totalPages: 1,
            },
          };
        }

        // -------------------------------------------------
        // Direct array fallback
        // -------------------------------------------------

        if (Array.isArray(response)) {
          return {
            registers: response,

            pagination: {
              page: 1,
              limit: response.length,
              total: response.length,
              totalPages: 1,
            },
          };
        }

        return {
          registers: [],

          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
        };
      },

      providesTags: (result) => [
        ...(Array.isArray(result?.registers)
          ? result.registers.map(
              (register) => ({
                type: "CashRegister",
                id: register._id,
              })
            )
          : []),

        {
          type: "CashRegister",
          id: "LIST",
        },
      ],
    }),

    // =====================================================
    // GET CASH REGISTER BY ID
    // GET /api/cash-registers/:id
    //
    // Simple:
    //
    // useGetCashRegisterByIdQuery(id)
    //
    // Super Admin can also use:
    //
    // useGetCashRegisterByIdQuery({
    //   id,
    //   tenantOwner
    // })
    // =====================================================

    getCashRegisterById: builder.query({
      query: (arg) => {
        // -------------------------------------------------
        // Simple usage:
        //
        // arg = "cashRegisterId"
        // -------------------------------------------------

        if (typeof arg === "string") {
          return {
            url: `${API_ROUTES.cashRegisters}/${arg}`,
            method: "GET",
          };
        }

        // -------------------------------------------------
        // Object usage:
        //
        // {
        //   id,
        //   tenantOwner
        // }
        // -------------------------------------------------

        const {
          id,
          tenantOwner,
        } = arg || {};

        const params = {};

        if (tenantOwner) {
          params.tenantOwner =
            tenantOwner;
        }

        return {
          url: `${API_ROUTES.cashRegisters}/${id}`,
          method: "GET",

          params:
            Object.keys(params).length > 0
              ? params
              : undefined,
        };
      },

      transformResponse: (response) => {
        return response?.data || null;
      },

      providesTags: (result, error, arg) => {
        const id =
          typeof arg === "string"
            ? arg
            : arg?.id;

        return [
          {
            type: "CashRegister",
            id,
          },
        ];
      },
    }),

    // =====================================================
    // OPEN CASH REGISTER
    // POST /api/cash-registers/open
    //
    // Admin / Manager:
    //
    // {
    //   openingBalance,
    //   notes
    // }
    //
    // Super Admin:
    //
    // {
    //   tenantOwner,
    //   user,
    //   openingBalance,
    //   notes
    // }
    //
    // Backend determines business/businessType.
    // =====================================================

    openCashRegister: builder.mutation({
      query: (body) => ({
        url: `${API_ROUTES.cashRegisters}/open`,
        method: "POST",
        body,

        headers: {
          "Content-Type":
            "application/json",
        },
      }),

      transformResponse: (response) => {
        return response?.data || null;
      },

      invalidatesTags: [
        {
          type: "CashRegister",
          id: "LIST",
        },
        {
          type: "CashRegister",
          id: "CURRENT",
        },
      ],
    }),

    // =====================================================
    // ADD CASH IN
    // POST /api/cash-registers/cash-in
    //
    // Body:
    //
    // {
    //   amount: 5000,
    //   notes: "Cash added"
    // }
    //
    // Super Admin can optionally include:
    //
    // {
    //   tenantOwner,
    //   amount,
    //   notes
    // }
    // =====================================================

    addCashIn: builder.mutation({
      query: (body) => ({
        url: `${API_ROUTES.cashRegisters}/cash-in`,
        method: "POST",
        body,

        headers: {
          "Content-Type":
            "application/json",
        },
      }),

      transformResponse: (response) => {
        return response?.data || null;
      },

      invalidatesTags: [
        {
          type: "CashRegister",
          id: "CURRENT",
        },
        {
          type: "CashRegister",
          id: "LIST",
        },
      ],
    }),

    // =====================================================
    // ADD CASH OUT
    // POST /api/cash-registers/cash-out
    //
    // Body:
    //
    // {
    //   amount: 2000,
    //   notes: "Petty cash"
    // }
    // =====================================================

    addCashOut: builder.mutation({
      query: (body) => ({
        url: `${API_ROUTES.cashRegisters}/cash-out`,
        method: "POST",
        body,

        headers: {
          "Content-Type":
            "application/json",
        },
      }),

      transformResponse: (response) => {
        return response?.data || null;
      },

      invalidatesTags: [
        {
          type: "CashRegister",
          id: "CURRENT",
        },
        {
          type: "CashRegister",
          id: "LIST",
        },
      ],
    }),

    // =====================================================
    // CLOSE CASH REGISTER
    // PATCH /api/cash-registers/close
    //
    // Body:
    //
    // {
    //   actualClosingBalance: 50000,
    //   notes: "End of day"
    // }
    //
    // Super Admin can optionally include:
    //
    // {
    //   tenantOwner,
    //   actualClosingBalance,
    //   notes
    // }
    // =====================================================

    closeCashRegister: builder.mutation({
      query: (body) => ({
        url: `${API_ROUTES.cashRegisters}/close`,
        method: "PATCH",
        body,

        headers: {
          "Content-Type":
            "application/json",
        },
      }),

      transformResponse: (response) => {
        return response?.data || null;
      },

      invalidatesTags: [
        {
          type: "CashRegister",
          id: "CURRENT",
        },
        {
          type: "CashRegister",
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
  useGetCurrentCashRegisterQuery,
  useGetCashRegistersQuery,
  useGetCashRegisterByIdQuery,
  useOpenCashRegisterMutation,
  useAddCashInMutation,
  useAddCashOutMutation,
  useCloseCashRegisterMutation,
} = cashRegistersApi;