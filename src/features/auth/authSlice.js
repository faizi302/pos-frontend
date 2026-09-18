import { createSlice } from "@reduxjs/toolkit";

// =====================================================
// IMPORTANT
// =====================================================
//
// JWT / authentication token is NOT stored here.
//
// JWT:
//     httpOnly cookie
//
// Redux:
//     current user information
//
// localStorage:
//     cached current user information
//
// Never store here:
// - JWT
// - password
// - reset token
// - reset OTP
// =====================================================

const STORAGE_KEY = "pos.currentUser";

// =====================================================
// LOAD CACHED USER
// =====================================================

function loadCachedUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

// =====================================================
// INITIAL STATE
// =====================================================

const initialState = {
  user: loadCachedUser(),

  // Backend authentication check completed or not.
  isInitialized: false,
};

// =====================================================
// SLICE
// =====================================================

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    // ===================================================
    // SET CURRENT USER
    // ===================================================

    setCurrentUser(state, action) {
      state.user = action.payload;

      if (action.payload) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(action.payload)
        );
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    },

    // ===================================================
    // CLEAR CURRENT USER
    // ===================================================

    clearCurrentUser(state) {
      state.user = null;

      localStorage.removeItem(STORAGE_KEY);
    },

    // ===================================================
    // SET AUTH INITIALIZED
    // ===================================================

    setAuthInitialized(state, action) {
      state.isInitialized = action.payload;
    },
  },
});

// =====================================================
// ACTIONS
// =====================================================

export const {
  setCurrentUser,
  clearCurrentUser,
  setAuthInitialized,
} = authSlice.actions;

// =====================================================
// REDUCER
// =====================================================

export default authSlice.reducer;

// =====================================================
// SELECTORS
// =====================================================

export const selectCurrentUser = (state) =>
  state.auth.user;

export const selectIsAuthenticated = (state) =>
  Boolean(state.auth.user);

export const selectAuthInitialized = (state) =>
  state.auth.isInitialized;

export const selectCurrentRole = (state) =>
  state.auth.user?.role?.slug || null;

export const selectCurrentBusiness = (state) =>
  state.auth.user?.business || null;

export const selectCurrentBusinessType = (state) =>
  state.auth.user?.businessType || null;

export const selectCurrentPermissions = (state) =>
  state.auth.user?.role?.permissions || [];
