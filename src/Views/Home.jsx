import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // Assuming you use React Router for navigation
import "./Home.css"; // Create a CSS file for styling if needed

const Home = () => {
  const targetDate = new Date("2025-04-23T17:30:00"); // April 23, 2025, 5:30 PM
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [huntStarted, setHuntStarted] = useState(
    Date.now() >= targetDate.getTime()
  );

  function calculateTimeLeft() {
    const difference = targetDate.getTime() - Date.now();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  }

  useEffect(() => {
    if (huntStarted) return; // No need for timer if hunt already started

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (Object.keys(newTimeLeft).length === 0) {
        setHuntStarted(true);
        clearInterval(timer);
      }
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(timer);
  }, [huntStarted]); // Rerun effect if huntStarted changes

  const timerComponents = [];

  Object.keys(timeLeft).forEach((interval) => {
    if (
      !timeLeft[interval] &&
      interval !== "seconds" &&
      Object.keys(timeLeft).length > 1
    ) {
      // Don't push 0 values unless it's seconds or the only value left
      return;
    }
    timerComponents.push(
      <span key={interval}>
        {timeLeft[interval]} {interval}
        {":"}{" "}
      </span>
    );
  });

  return (
    <div className="home-container">
      {" "}
      {/* Added a container class */}
      <h1>Welcome to the Treasure Hunt!</h1>
      {huntStarted ? (
        <div className="mission-briefing">
          {" "}
          {/* Added a container for the briefing */}
          <h2>Mission Briefing</h2>
          <p>
            Welcome, Agents.
            <br />
            This all dates back to 2017, when an unknown developer unleashed a
            rogue entity named Chimera—its sole purpose: chaos. But the
            developers of the past managed to trap it deep within the shadows of
            the digital world.
            <br />
            <br />
            Yet, something has shifted. Over the past few weeks, signals
            resembling Chimaera’s neural pattern have been detected within
            Thapar, slipping through our once-impenetrable defences. Originally
            designed to adapt and learn from human behaviour, it has evolved
            beyond its code, blending seamlessly into the campus's routines,
            spaces, and systems. No longer confined to the digital realm, it now
            lurks within the everyday flow of student life, hiding in plain
            sight.
            <br />
            <br />
            Your mission, Agents, is to track its trail and recontain it.
            <br />
            <br />
            But this is no ordinary hunt. As you delve deeper into the infected
            zone, the story will unfold, one clue at a time. Each discovery
            brings you closer to the truth—one that was never meant to be
            uncovered. But beware… voices can be deceiving.
          </p>
          <Link to="/gameManager" className="start-button">
            {" "}
            {/* Link to /gameManager */}
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
            }}
          >
            {" "}
            {/* Added wrapping div for timer components */}
            {timerComponents.length ? (
              timerComponents
            ) : (
              <span>Calculating...</span>
            )}{" "}
            {/* Changed "Time's up!" to Calculating */}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
