import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { selectUserInfo } from "../features/auth/authSlice";

const PrivateAdminRoute = () => {
    const userInfo = useSelector(selectUserInfo);
    const isAdmin = userInfo && userInfo.role === "admin"; // Adjust based on your user object structure
    return isAdmin ? <Outlet /> : <Navigate to="/login" replace />;
}
 
export default PrivateAdminRoute;