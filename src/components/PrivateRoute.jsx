import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { selectIsAuthenticated } from "../features/auth/authSlice"; // Adjust path if needed based on actual structure

const PrivateRoute = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // If authenticated, render the child routes (Outlet).
  // Otherwise, redirect to the login page.
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
