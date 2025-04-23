import React, { useState, useEffect } from "react"; // Import hooks
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Views/Home";
import Login from "./Views/Login";
import Signup from "./Views/Signup";
import PrivateRoute from "./components/PrivateRoute";
import GameManager2 from "./Pages/GameManager";
import PrivateAdminRoute from "./components/PrivateAdminRoute";
import Admin from "./Pages/Admin";
// Import CSS for the popup - ensure these styles are defined globally or in App.css
import "./App.css"; // Or wherever your popup styles are defined

// Key for localStorage to track if the popup has been shown
const POPUP_SHOWN_KEY = "huntOverPopupShown";

const App = () => {
  const [showInfoPopup, setShowInfoPopup] = useState(false); // State for the popup

  useEffect(() => {
    // Check localStorage to see if the info popup should be shown
    const hasSeenPopup = localStorage.getItem(POPUP_SHOWN_KEY);
    if (!hasSeenPopup) {
      setShowInfoPopup(true); // Show popup if not seen before
    }
  }, []); // Run only once on initial app load

  const handleDismissPopup = () => {
    localStorage.setItem(POPUP_SHOWN_KEY, "true"); // Mark as seen in localStorage
    setShowInfoPopup(false); // Hide the popup
  };

  return (
    <>
      {" "}
      {/* Use Fragment to wrap popup and Routes */}
      {/* One-Time Info Popup */}
      {showInfoPopup && (
        <div className="popup-overlay">
          {" "}
          {/* Use styles defined in App.css or global CSS */}
          <div className="popup-content">
            <h2>Event Update</h2>
            <p>
              The Treasure Hunt event has concluded. Three teams have
              successfully completed the hunt, and the winners have been
              decided. Thank you for participating!
              <br />
              Please Collect your bags from AS if you have left them there.
            </p>
            <button onClick={handleDismissPopup} className="popup-button">
              Dismiss
            </button>
          </div>
        </div>
      )}
      {/* --- Your Existing Routes --- */}
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Private Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/gameManager" element={<GameManager2 />} />
          {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        </Route>
        {/* Admin Routes */}
        <Route element={<PrivateAdminRoute />}>
          <Route path="/admin" element={<Admin />} />
        </Route>

        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </>
  );
};

export default App;
