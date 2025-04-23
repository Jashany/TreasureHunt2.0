import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Views/Home";
import Login from "./Views/Login";
import Signup from "./Views/Signup";
import PrivateRoute from "./components/PrivateRoute"; // Import PrivateRoute
// Import other components/views as needed
import TreasureTwo from "./Views/TreasureHunt2/TreasureTwo";
import GameManager from "./Views/GameManager";
import GameManager2 from "./Pages/GameManager";
import PrivateAdminRoute from "./components/PrivateAdminRoute";
import Admin from "./Pages/Admin";
const App = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Private Routes */}
      <Route element={<PrivateRoute />}>
        {/* Nest all private routes inside PrivateRoute */}
        <Route path="/" element={<Home />} />
        <Route path="/gameManager" element={<GameManager2 />} />
        {/* Add other private routes here, e.g., dashboard, profile */}
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
      </Route>
      {/* Admin Routes */}
      <Route element={<PrivateAdminRoute />}>
        {/* Nest all admin routes inside PrivateAdminRoute */}
        <Route path="/admin" element={<Admin />} />
        {/* Add other admin routes here */}
      </Route>

      {/* Optional: Add a 404 Not Found route */}
      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
};

export default App;
