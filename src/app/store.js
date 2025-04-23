import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice"; // Adjust path if needed
import { apiSlice } from "../services/api";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add other reducers here if you have more slices
  },
  
  // Optional: Add middleware, devTools configuration, etc.
});
