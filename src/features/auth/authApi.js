import { baseApi } from "@/app/api/baseApi";
import { API_ROUTES } from "@/config/api";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =====================================================
    // SIGNUP
    // POST /api/users/signup
    // =====================================================
    signup: builder.mutation({
      query: (body) => {
        const isFormData =
          typeof FormData !== "undefined" &&
          body instanceof FormData;

        return {
          url: `${API_ROUTES.users}/signup`,
          method: "POST",
          body,

          ...(isFormData
            ? {}
            : {
                headers: {
                  "Content-Type": "application/json",
                },
              }),
        };
      },

      transformResponse: (response) => ({
        user: response.data,
        message: response.message,
      }),

      invalidatesTags: ["CurrentUser"],
    }),

    // =====================================================
    // LOGIN
    // POST /api/users/login
    //
    // JWT is stored by backend in httpOnly cookie.
    // Frontend does NOT store the token.
    // =====================================================
    login: builder.mutation({
      query: (credentials) => ({
        url: `${API_ROUTES.users}/login`,
        method: "POST",
        body: credentials,
        headers: {
          "Content-Type": "application/json",
        },
      }),

      transformResponse: (response) => ({
        user: response.data.user,
        message: response.message,
      }),

      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          // ============================================
          // WIPE THE PREVIOUS SESSION'S CACHE
          // ============================================
          //
          // CRITICAL — MULTI-TENANT SAFETY:
          //
          // RTK Query caches responses by serialized query
          // args, NOT by which user/business made the call.
          // getProducts() called by Admin A and getProducts()
          // called by Admin B are the SAME cache key.
          //
          // Without this reset, logging out of Admin A and
          // logging into Admin B in the same browser tab
          // (no full page reload) would keep serving Admin
          // A's cached products/brands/models/etc. to Admin
          // B until each query happens to refetch on its own.
          //
          // This must run BEFORE setCurrentUser so nothing
          // in-flight re-populates the old cache under the
          // new user.
          //
          dispatch(baseApi.util.resetApiState());

          if (data?.user) {
            dispatch({
              type: "auth/setCurrentUser",
              payload: data.user,
            });
          }
        } catch {
          // Login error is handled by the UI.
        }
      },

      invalidatesTags: ["CurrentUser"],
    }),

    // =====================================================
    // LOGOUT
    // POST /api/users/logout
    //
    // Backend clears httpOnly cookie.
    // Redux user is also cleared.
    // =====================================================
    logout: builder.mutation({
      query: () => ({
        url: `${API_ROUTES.users}/logout`,
        method: "POST",
      }),

      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch({
            type: "auth/clearCurrentUser",
          });

          // ============================================
          // WIPE THE OUTGOING SESSION'S CACHE
          // ============================================
          //
          // Same multi-tenant reasoning as login above —
          // clear every cached query result (products,
          // brands, models, users, ...) the moment this
          // account logs out, so nothing from this tenant
          // can leak into whoever logs in next in this tab.
          //
          dispatch(baseApi.util.resetApiState());
        }
      },

      invalidatesTags: ["CurrentUser"],
    }),

    // =====================================================
    // GET MY PROFILE
    // GET /api/users/me
    //
    // Backend verifies the JWT cookie.
    // =====================================================
    getMyProfile: builder.query({
      query: () => `${API_ROUTES.users}/me`,

      transformResponse: (response) => response.data,

      providesTags: [
        "CurrentUser",
        { type: "User", id: "ME" },
      ],

      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data) {
            dispatch({
              type: "auth/setCurrentUser",
              payload: data,
            });

            dispatch({
              type: "auth/setAuthInitialized",
              payload: true,
            });
          }
        } catch {
          dispatch({
            type: "auth/clearCurrentUser",
          });

          dispatch({
            type: "auth/setAuthInitialized",
            payload: true,
          });
        }
      },
    }),

    // =====================================================
    // UPDATE MY PROFILE
    // PATCH /api/users/me
    // =====================================================
    updateMyProfile: builder.mutation({
      query: (body) => {
        const isFormData =
          typeof FormData !== "undefined" &&
          body instanceof FormData;

        return {
          url: `${API_ROUTES.users}/me`,
          method: "PATCH",
          body,

          ...(isFormData
            ? {}
            : {
                headers: {
                  "Content-Type": "application/json",
                },
              }),
        };
      },

      transformResponse: (response) => response.data,

      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data) {
            dispatch({
              type: "auth/setCurrentUser",
              payload: data,
            });
          }
        } catch {
          // Error handled by UI.
        }
      },

      invalidatesTags: [
        "CurrentUser",
        { type: "User", id: "ME" },
      ],
    }),

    // =====================================================
    // REMOVE MY AVATAR
    // DELETE /api/users/me/avatar
    // =====================================================
    removeMyAvatar: builder.mutation({
      query: () => ({
        url: `${API_ROUTES.users}/me/avatar`,
        method: "DELETE",
      }),

      transformResponse: (response) => response.data,

      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          if (data) {
            dispatch({
              type: "auth/setCurrentUser",
              payload: data,
            });
          }
        } catch {
          // Error handled by UI.
        }
      },

      invalidatesTags: [
        "CurrentUser",
        { type: "User", id: "ME" },
      ],
    }),

    // =====================================================
    // FORGOT PASSWORD
    // POST /api/users/forgot-password
    // =====================================================
    forgotPassword: builder.mutation({
      query: (body) => ({
        url: `${API_ROUTES.users}/forgot-password`,
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
        },
      }),

      transformResponse: (response) => ({
        data: response.data,
        message: response.message,
      }),
    }),

    // =====================================================
    // VERIFY OTP
    // POST /api/users/verify-otp
    // =====================================================
    verifyOtp: builder.mutation({
      query: (body) => ({
        url: `${API_ROUTES.users}/verify-otp`,
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
        },
      }),

      transformResponse: (response) => ({
        data: response.data,
        message: response.message,
      }),
    }),

    // =====================================================
    // RESET PASSWORD
    // POST /api/users/reset-password
    // =====================================================
    resetPassword: builder.mutation({
      query: (body) => ({
        url: `${API_ROUTES.users}/reset-password`,
        method: "POST",
        body,
        headers: {
          "Content-Type": "application/json",
        },
      }),

      transformResponse: (response) => ({
        data: response.data,
        message: response.message,
      }),
    }),
  }),
});

export const {
  useSignupMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useRemoveMyAvatarMutation,
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
} = authApi;