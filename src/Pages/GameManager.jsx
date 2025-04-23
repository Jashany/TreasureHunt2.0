import React, { useState, useEffect, useCallback } from "react"; // Import useCallback
import { useGeolocation } from "../hooks/useGeolocation";
import { getDistance } from "../Views/utils/geo";
import LoadingIndicator from "../components/LoadingIndicator/LoadingIndicator";
import ErrorDisplay from "../components/ErrorDisplay/ErrorDisplay";
import NavigatingState from "./States/NavigatingState";
import "./GameManager.css";

const RADAR_MAX_RANGE_M = 120;
const PROMPT_CAMERA_THRESHOLD_M = 80;
const AR_VIEW_THRESHOLD_M = 65;

const GameManager2 = () => {
  const [currentClue, setCurrentClue] = useState(null);
  const [gameState, setGameState] = useState("LOADING_CLUE");
  const [error, setError] = useState(null);
  const [distance, setDistance] = useState(null);
  const { location: userLocation, error: geoError } = useGeolocation();

  // --- Fetch Clue Logic ---
  const fetchCurrentClue = useCallback(async () => {
    // Use useCallback
    setGameState("LOADING_CLUE"); // Show loading state while fetching
    setError(null); // Clear previous errors
    setDistance(null); // Reset distance
    try {
      const response = await fetch(
        "https://treasure-api.jsondev.in//api/questions/currentSequence",
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Authentication failed. Please log in.");
        }
        const errorData = await response.json().catch(() => ({})); // Try to parse error, default to empty object
        throw new Error(
          errorData.message ||
            `Network response was not ok (${response.status})`
        );
      }
      const data = await response.json();

      if (data.isHuntCompleted === true) {
        setGameState("GAME_OVER");
        setCurrentClue(null);
        return;
      }

      if (data && data.currentQuestion) {
        setCurrentClue(data.currentQuestion);
        console.log("Fetched New Clue:", data.currentQuestion);
        setGameState("NAVIGATING"); // Transition to navigating with the new clue
      } else {
        setGameState("GAME_OVER");
        setCurrentClue(null);
      }
    } catch (error) {
      console.error("Error fetching clue:", error);
      setError(`Failed to load clue: ${error.message}`);
      setGameState("ERROR_FETCH");
    }
  }, []); // Empty dependency array for useCallback, as it doesn't depend on component state/props

  // --- Initial Clue Fetch ---
  useEffect(() => {
    fetchCurrentClue();
  }, [fetchCurrentClue]); // Depend on the memoized fetch function

  // --- Geolocation Error Handling ---
  useEffect(() => {
    if (geoError) {
      if (gameState !== "ERROR_FETCH") {
        setError(`Geolocation error: ${geoError.message}`);
      }
    } else {
      if (
        error &&
        error.startsWith("Geolocation error") &&
        gameState !== "ERROR_FETCH"
      ) {
        setError(null);
      }
    }
  }, [geoError, error, gameState]);

  // --- Calculate Distance & Update Game State ---
  useEffect(() => {
    if (
      !userLocation ||
      !currentClue ||
      !currentClue.geolocation ||
      !currentClue.geolocation.coordinates ||
      currentClue.geolocation.coordinates.length !== 2 ||
      [
        "LOADING_CLUE",
        "SHOWING_QUESTION", // Assuming this state exists if popup is open
        "GAME_OVER",
        "ERROR_FETCH",
        "ERROR_GEO",
      ].includes(gameState)
    ) {
      return;
    }

    const dist = getDistance(
      userLocation.latitude,
      userLocation.longitude,
      currentClue.geolocation.coordinates[0],
      currentClue.geolocation.coordinates[1]
    );
    setDistance(dist);

    let nextState = gameState;
    if (dist <= AR_VIEW_THRESHOLD_M) {
      if (gameState === "NAVIGATING" || gameState === "PROMPT_CAMERA") {
        nextState = "VIEWING_AR";
      }
    } else if (dist <= PROMPT_CAMERA_THRESHOLD_M) {
      if (gameState === "NAVIGATING" || gameState === "VIEWING_AR") {
        nextState = "PROMPT_CAMERA";
      }
    } else {
      if (gameState === "PROMPT_CAMERA" || gameState === "VIEWING_AR") {
        nextState = "NAVIGATING";
      }
    }

    if (nextState !== gameState) {
      console.log(
        `Game State Change (Distance): ${gameState} -> ${nextState} (Dist: ${dist.toFixed(
          1
        )}m)`
      );
      setGameState(nextState);
    }
    // console.log(`Game State: ${gameState} (Distance: ${dist.toFixed(1)}m)`); // Log less frequently maybe
  }, [userLocation, currentClue, gameState]);

  // --- Callback for Correct Answer ---
  const handleCorrectAnswer = () => {
    console.log("Correct answer submitted! Fetching next clue...");
    fetchCurrentClue(); // Trigger the fetch for the next sequence item
  };

  // --- Rendering Logic ---
  return (
    <div className="game-manager-container">
      {/* Debug Info */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 10,
          backgroundColor: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "5px",
          zIndex: 100,
          fontSize: "0.8em",
        }}
      >
        <p>State: {gameState}</p>
        {distance !== null && <p>Dist: {distance.toFixed(1)}m</p>}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}
        {currentClue && (
          <p>
            Clue: {currentClue.sequenceNumber} ({currentClue.title})
          </p>
        )}
        {userLocation && (
          <p>
            Loc: {userLocation.latitude.toFixed(4)},{" "}
            {userLocation.longitude.toFixed(4)}
          </p>
        )}
      </div>

      {/* State-Based Rendering */}
      {gameState === "LOADING_CLUE" && (
        <LoadingIndicator message="Loading next clue..." />
      )}
      {gameState === "ERROR_FETCH" && (
        <ErrorDisplay
          message={error}
          onDismiss={() => fetchCurrentClue()} // Option to retry fetch
        />
      )}
      {gameState === "GAME_OVER" && (
        <div style={{ textAlign: "center", marginTop: "20vh" }}>
          <h1>Congratulations!</h1>
          <p>You have completed the Treasure Hunt!</p>
        </div>
      )}

      {/* Render NavigatingState for multiple states, passing down props */}
      {(gameState === "NAVIGATING" ||
        gameState === "PROMPT_CAMERA" ||
        gameState === "VIEWING_AR") &&
        currentClue && (
          <NavigatingState
            clue={currentClue}
            userLocation={userLocation}
            distance={distance}
            isCameraPrompt={
              gameState === "PROMPT_CAMERA" || gameState === "VIEWING_AR"
            }
            showAR={gameState === "VIEWING_AR"}
            onCorrectAnswer={handleCorrectAnswer} // Pass the callback down
          />
        )}

      {gameState === "GAME_OVER" && (
        <div style={{ textAlign: "left", padding: "2rem", fontSize: "1.5rem" }}>
          <p>
            Last known signal pinged here, then vanished. This wasn’t
            containment. This was an exit. Everything we traced led to this
            node. But it’s not a hub. It’s a hatch. Every clue. Every lead.
            Every agent. We weren’t tracking it.
            <br />
            It was guiding us. . . . .
            <br />
            <br />
            This wasn’t a game, <strong>YOU</strong> were the game.
          </p>
        </div>
      )}
    </div>
  );
};

export default GameManager2;
