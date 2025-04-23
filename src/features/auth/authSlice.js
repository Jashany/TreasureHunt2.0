import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userInfo: localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null, // Store user info from backend (id, name, email, role, etc.)
  isAuthenticated: !!localStorage.getItem("userInfo"), // Check if user info exists
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.userInfo = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem("userInfo", JSON.stringify(action.payload)); // Persist user info
    },
    logoutSuccess: (state) => {
      state.userInfo = null;
      state.isAuthenticated = false;
      localStorage.removeItem("userInfo"); // Clear user info
      // Also clear the httpOnly cookie by calling the backend logout endpoint
    },
    // You might add reducers for loginFailure, etc. if needed
  },
});

export const { loginSuccess, logoutSuccess } = authSlice.actions;

export default authSlice.reducer;

// Selector to get authentication status
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserInfo = (state) => state.auth.userInfo;
