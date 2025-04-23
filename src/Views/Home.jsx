import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Home.css"; // Assuming you have or will create Home.css for styles

// Key for localStorage to track if the popup has been shown
const POPUP_SHOWN_KEY = "huntOverPopupShown";

const Home = () => {
  const [timeLeft, setTimeLeft] = useState({});
  const [huntStarted, setHuntStarted] = useState(false); // Or determine based on date/API
  const [showInfoPopup, setShowInfoPopup] = useState(false); // State for the new popup

  useEffect(() => {
    // Check localStorage to see if the info popup should be shown
    const hasSeenPopup = localStorage.getItem(POPUP_SHOWN_KEY);
    if (!hasSeenPopup) {
      setShowInfoPopup(true); // Show popup if not seen before
    }

    // --- Existing Timer Logic ---
    const targetDate = new Date("2024-04-23T19:05:00"); // Set your target date/time

    const calculateTimeLeft = () => {
      const difference = +targetDate - +new Date();
      let timeLeftData = {};

      if (difference > 0) {
        timeLeftData = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
        setHuntStarted(false);
      } else {
        setHuntStarted(true); // Hunt starts when time is up
      }
      return timeLeftData;
    };

    setTimeLeft(calculateTimeLeft()); // Initial calculation

    const timer = setInterval(() => {
      const updatedTimeLeft = calculateTimeLeft();
      setTimeLeft(updatedTimeLeft);
      if (Object.keys(updatedTimeLeft).length === 0) {
        clearInterval(timer); // Stop timer when time is up
      }
    }, 1000);

    return () => clearInterval(timer); // Cleanup timer on unmount
  }, []); // Run effects only on mount

  const handleDismissPopup = () => {
    localStorage.setItem(POPUP_SHOWN_KEY, "true"); // Mark as seen in localStorage
    setShowInfoPopup(false); // Hide the popup
  };

  const timerComponents = [];
  Object.keys(timeLeft).forEach((interval) => {
    if (
      !timeLeft[interval] &&
      interval !== "seconds" &&
      Object.keys(timeLeft).length > 1
    ) {
      return;
    }
    // Ensure proper spacing, maybe add ':' only between units
    timerComponents.push(
      <span key={interval} style={{ margin: "0 5px" }}>
        {timeLeft[interval]} {interval}
      </span>
    );
  });

  return (
    <div className="home-container">
      {/* One-Time Info Popup */}
      {showInfoPopup && (
        <div className="popup-overlay">
          {" "}
          {/* Use a generic overlay style */}
          <div className="popup-content">
            {" "}
            {/* Use a generic content style */}
            <h2>Event Update</h2>
            <p>
              The Treasure Hunt event has concluded. Three teams have
              successfully completed the hunt, and the winners have been
              decided. Thank you for participating!
            </p>
            <button onClick={handleDismissPopup} className="popup-button">
              Dismiss
            </button>
          </div>
        </div>
      )}

      <h1>Welcome to the Treasure Hunt!</h1>
      {huntStarted ? (
        <div className="mission-briefing">
          <h2>Mission Briefing</h2>
          <p>
            Welcome, Agents.
            <br />
            This all dates back to 2017, when an unknown developer unleashed a
            rogue AI, codenamed 'Echo', into the digital wild. Echo wasn't just
            code; it learned, adapted, and fragmented itself across the network,
            leaving behind encrypted data caches - the 'treasures'.
            <br />
            <br />
            Your mission: Track Echo's digital footprints across physical
            locations using geo-location data embedded in the clues. Each cache
            you secure gets us closer to the core fragment. The first team to
            reassemble the data contains Echo and wins. Time is critical. Echo
            is evolving. The digital and real worlds blur. Trust the clues,
            verify your location, and may the fastest team prevail. Good luck,
            Agents. The hunt is on.
            <br />
            <br />
            Listen closely to the whispers in the code; they might guide you or
            lead you astray. Sometimes, the greatest treasures are truths left
            uncovered. But beware… voices can be deceiving.
          </p>
          <Link to="/gameManager" className="start-button">
            Begin Containment
          </Link>
        </div>
      ) : (
        <div className="countdown-timer">
          <h2>Hunt Begins In</h2>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginTop: "1rem",
              fontSize: "1.5rem",
              fontFamily: "Antonio",
              flexWrap: "wrap", // Allow wrapping on small screens
            }}
          >
            {timerComponents.length ? (
              timerComponents
            ) : (
              <span>Calculating...</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
