import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

const inventoryUnitApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ==================================================
    // GET ALL INVENTORY UNITS
    // GET /api/inventory-units
    // Supports: page, limit, search, productInventory, status,
    //           imei, unitBarcode, business, businessType
    // ==================================================
    getInventoryUnits: builder.query({
      query: ({
        page = 1,
        limit = 20,
        search = "",
        productInventory = "",
        status = "",
        imei = "",
        unitBarcode = "",
        business = "",
        businessType = "",
      } = {}) => {
        const params = new URLSearchParams();

        params.append("page", page);
        params.append("limit", limit);

        if (search) params.append("search", search);
        if (productInventory) params.append("productInventory", productInventory);
        if (status) params.append("status", status);
        if (imei) params.append("imei", imei);
        if (unitBarcode) params.append("unitBarcode", unitBarcode);
        if (business) params.append("business", business);
        if (businessType) params.append("businessType", businessType);

        return {
          url: API_ROUTES.inventoryUnits,
          method: "GET",
          params,
        };
      },

      // Keep data for 60 seconds (good default for inventory lists)
      keepUnusedDataFor: 60,

      providesTags: (result) => {
        const list = result?.data?.units || result?.units || [];
        if (Array.isArray(list)) {
          return [
            ...list.map((u) => ({ type: "InventoryUnit", id: u._id })),
            { type: "InventoryUnit", id: "LIST" },
          ];
        }
        return [{ type: "InventoryUnit", id: "LIST" }];
      },
    }),

    // ==================================================
    // GET UNITS BY PRODUCT INVENTORY
    // GET /api/inventory-units/product-inventory/:productInventoryId
    // ==================================================
    getInventoryUnitsByProductInventory: builder.query({
      query: (productInventoryId) => ({
        url: `${API_ROUTES.inventoryUnits}/product-inventory/${productInventoryId}`,
        method: "GET",
      }),

      providesTags: (result, error, productInventoryId) => [
        { type: "InventoryUnit", id: `PRODUCT-INVENTORY-${productInventoryId}` },
        { type: "InventoryUnit", id: "LIST" },
      ],
    }),

    // ==================================================
    // SCAN / GET BY IMEI
    // GET /api/inventory-units/imei/:imei
    // ==================================================
    getInventoryUnitByImei: builder.query({
      query: (imei) => ({
        url: `${API_ROUTES.inventoryUnits}/imei/${imei}`,
        method: "GET",
      }),

      // Scan results should not live long in cache
      keepUnusedDataFor: 30,

      providesTags: (result, error, imei) => [
        { type: "InventoryUnit", id: `IMEI-${imei}` },
      ],
    }),

    // ==================================================
    // GET SINGLE INVENTORY UNIT BY ID
    // GET /api/inventory-units/:id
    // ==================================================
    getInventoryUnitById: builder.query({
      query: (id) => ({
        url: `${API_ROUTES.inventoryUnits}/${id}`,
        method: "GET",
      }),

      providesTags: (result, error, id) => [{ type: "InventoryUnit", id }],
    }),

    // ==================================================
    // CREATE INVENTORY UNIT
    // POST /api/inventory-units
    // ==================================================
    createInventoryUnit: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.inventoryUnits,
        method: "POST",
        body,
      }),

      invalidatesTags: [
        { type: "InventoryUnit", id: "LIST" },
        "InventoryUnit",
        "ProductInventory", // stock counts may change
      ],
    }),

    // ==================================================
    // UPDATE INVENTORY UNIT
    // PATCH /api/inventory-units/:id
    // ==================================================
    updateInventoryUnit: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `${API_ROUTES.inventoryUnits}/${id}`,
        method: "PATCH",
        body,
      }),

      invalidatesTags: (result, error, { id, productInventory }) => [
        { type: "InventoryUnit", id },
        { type: "InventoryUnit", id: "LIST" },
        ...(productInventory
          ? [{ type: "InventoryUnit", id: `PRODUCT-INVENTORY-${productInventory}` }]
          : []),
        "ProductInventory",
      ],
    }),

    // ==================================================
    // DELETE INVENTORY UNIT (soft)
    // DELETE /api/inventory-units/:id
    // ==================================================
    deleteInventoryUnit: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.inventoryUnits}/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: [
        { type: "InventoryUnit", id: "LIST" },
        "InventoryUnit",
        "ProductInventory",
      ],
    }),

    // ==================================================
    // RESTORE INVENTORY UNIT
    // PATCH /api/inventory-units/:id/restore
    // ==================================================
    restoreInventoryUnit: builder.mutation({
      query: (id) => ({
        url: `${API_ROUTES.inventoryUnits}/${id}/restore`,
        method: "PATCH",
      }),

      invalidatesTags: [
        { type: "InventoryUnit", id: "LIST" },
        "InventoryUnit",
        "ProductInventory",
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetInventoryUnitsQuery,
  useLazyGetInventoryUnitsQuery,
  useGetInventoryUnitsByProductInventoryQuery,
  useLazyGetInventoryUnitsByProductInventoryQuery,
  useGetInventoryUnitByImeiQuery,
  useLazyGetInventoryUnitByImeiQuery, // perfect for barcode / IMEI scanners
  useGetInventoryUnitByIdQuery,
  useLazyGetInventoryUnitByIdQuery,
  useCreateInventoryUnitMutation,
  useUpdateInventoryUnitMutation,
  useDeleteInventoryUnitMutation,
  useRestoreInventoryUnitMutation,
} = inventoryUnitApi;

export default inventoryUnitApi;