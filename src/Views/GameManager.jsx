// src/GameManager.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import HintDisplay from "./TreasureHunt2/Components/HintDisplay";
import RadarDisplay from "./TreasureHunt2/Components/RadarDisplay";
import ProximityPrompt from "./TreasureHunt2/Components/ProximityPrompt";
import ARView from "./TreasureHunt2/ARview";
import QuestionPopover from "./TreasureHunt2/Components/QuestionPopover";
import LoadingIndicator from "./TreasureHunt2/Components/LoadingIndicator";
import ErrorDisplay from "./TreasureHunt2/Components/ErrorDisplay";
import { useGeolocation } from "../hooks/useGeolocation";
import { getDistance } from "./utils/geo";
import { fetchClue } from "../services/api";
import "./GameManager.css";

// --- Constants ---
const RADAR_MAX_RANGE_M = 120;
const PROMPT_CAMERA_THRESHOLD_M = 50;
const AR_VIEW_THRESHOLD_M = 20; // Can be 10 or 20

function GameManager() {
  const [currentClue, setCurrentClue] = useState(null);
  const [gameState, setGameState] = useState("LOADING_CLUE"); // Initial state
  const [error, setError] = useState(null); // Combined error state
  const [distance, setDistance] = useState(null);

  const { location: userLocation, error: geoError } = useGeolocation();

  // --- Fetching Logic ---
  const loadClue = useCallback(async (clueId = null) => {
    setGameState("LOADING_CLUE");
    setError(null); // Clear previous errors
    setDistance(null); // Reset distance
    try {
      const clueData = await fetchClue(clueId);

      if (clueData) {
        setCurrentClue(clueData);
        setGameState("NAVIGATING"); // Set to navigating after loading clue
        // State will transition in the distance calculation effect
      } else {
        // No more clues returned from API
        setGameState("GAME_OVER");
        setCurrentClue(null);
      }
    } catch (err) {
      console.error("Clue Fetch Failed:", err);
      setError(`Failed to load clue: ${err.message}`);
      setGameState("ERROR_FETCH");
    }
  }, []);

  // --- Initial Load ---
  useEffect(() => {
    loadClue(null); // Load the first clue on mount
  }, [loadClue]);

  // --- Handle Geolocation Errors ---
  useEffect(() => {
    if (geoError) {
      // Only set general error if not already in a fetch error state
      if (gameState !== "ERROR_FETCH") {
        setError(geoError); // Show geo error
        // Decide if we should change game state based on geo error
        // Maybe allow navigation to continue with last known good, or halt?
        // setGameState('ERROR_GEO'); // Or keep current state but show error banner
      }
    } else {
      // If a geo error existed but is now resolved, clear it if the main error isn't a fetch error
      if (error === geoError && gameState !== "ERROR_FETCH") {
        setError(null);
      }
    }
  }, [geoError, error, gameState]); // Watch geoError

  // --- Calculate Distance & Update Game State ---
  useEffect(() => {
    // Don't run state logic if loading, game over, showing question, or in error state
    if (
      !userLocation ||
      !currentClue ||
      ["LOADING_CLUE", "SHOWING_QUESTION", "GAME_OVER", "ERROR_FETCH"].includes(
        gameState
      )
    ) {
      return;
    }

    const dist = getDistance(
      userLocation.latitude,
      userLocation.longitude,
      currentClue.latitude,
      currentClue.longitude
    );
    setDistance(dist); // Update distance regardless of state change

    // State Transition Logic (Revised)
    let nextState = gameState; // Start with current state

    if (dist <= AR_VIEW_THRESHOLD_M) {
      // If close enough for AR
      if (gameState === "NAVIGATING" || gameState === "PROMPT_CAMERA") {
        nextState = "VIEWING_AR";
      }
    } else if (dist <= PROMPT_CAMERA_THRESHOLD_M) {
      // If in prompt range (but not AR range)
      if (gameState === "NAVIGATING" || gameState === "VIEWING_AR") {
        // Transition to prompt if navigating or moving out of AR range
        nextState = "PROMPT_CAMERA";
      }
    } else {
      // If outside prompt range
      if (gameState === "PROMPT_CAMERA" || gameState === "VIEWING_AR") {
        // Transition back to navigating if moving far away
        nextState = "NAVIGATING";
      }
    }

    // Only update state if it has actually changed
    if (nextState !== gameState) {
      console.log(
        `Game State Change (Distance): ${gameState} -> ${nextState} (Dist: ${dist.toFixed(
          1
        )}m)`
      );
      setGameState(nextState);
    }
  }, [userLocation, currentClue, gameState]); // Dependencies

  // --- Event Handlers ---
  const handleOpenCamera = useCallback(() => {
    // User explicitly clicks button in PROMPT_CAMERA state
    if (gameState === "PROMPT_CAMERA") {
      console.log("User clicked Open Camera");
      setGameState("VIEWING_AR");
    }
  }, [gameState]);

  const handleObjectClick = useCallback(
    (clickedClue) => {
      // User clicks the AR object in VIEWING_AR state
      if (gameState === "VIEWING_AR" && clickedClue.id === currentClue?.id) {
        console.log("AR Object Clicked:", clickedClue.id);
        setGameState("SHOWING_QUESTION");
      }
    },
    [gameState, currentClue]
  );

  const handleAnswerSubmit = useCallback(
    (isCorrect) => {
      // Assume QuestionPopover gives correctness
      console.log("Answer Submitted. Correct:", isCorrect);
      if (isCorrect && currentClue) {
        // Correct Answer: Load the next clue
        const nextClueId = currentClue.nextClueId; // Get next ID from current clue data
        loadClue(currentClue.id); // Pass *current* ID to API to get the next one
      } else {
        // Incorrect Answer or closed without answering: Go back to AR view
        // (if still in range, otherwise distance effect will handle transition)
        if (distance !== null && distance <= AR_VIEW_THRESHOLD_M) {
          setGameState("VIEWING_AR");
        } else if (distance !== null && distance <= PROMPT_CAMERA_THRESHOLD_M) {
          setGameState("PROMPT_CAMERA");
        } else {
          setGameState("NAVIGATING");
        }
      }
    },
    [currentClue, loadClue, distance]
  );

  // --- Memoize locations to prevent unnecessary re-renders of children ---
  const targetLocation = useMemo(
    () =>
      currentClue
        ? {
            latitude: currentClue.latitude,
            longitude: currentClue.longitude,
          }
        : null,
    [currentClue]
  );

  // --- Render Logic ---
  return (
    <div className="game-container">
      {/* Loading Indicator */}
      {gameState === "LOADING_CLUE" && (
        <LoadingIndicator message="Loading next clue..." />
      )}

      {/* Error Display */}
      {error && <ErrorDisplay message={error} />}

      {/* Hint (Always visible when navigating/prompting/AR if clue exists) */}
      {currentClue &&
        !["LOADING_CLUE", "GAME_OVER", "ERROR_FETCH"].includes(gameState) && (
          <HintDisplay hint={currentClue.hint} />
        )}

      {/* Radar (Visible when navigating/prompting and in range) */}
      {userLocation &&
        targetLocation &&
        ["NAVIGATING", "PROMPT_CAMERA"].includes(gameState) &&
        distance <= RADAR_MAX_RANGE_M && (
          <RadarDisplay
            userLocation={userLocation}
            targetLocation={targetLocation}
          />
        )}

      {/* Camera Prompt */}
      {gameState === "PROMPT_CAMERA" && (
        <ProximityPrompt onOpenCamera={handleOpenCamera} />
      )}

      {/* AR View (Visible in AR state and when showing question) */}
      {(gameState === "VIEWING_AR" || gameState === "SHOWING_QUESTION") &&
        currentClue && (
          <ARView
            treasure={currentClue}
            // Only allow clicking if in AR state, not when question is already shown
            onObjectClick={
              gameState === "VIEWING_AR" ? handleObjectClick : () => {}
            }
          />
        )}

      {/* Question Popover (Visible only when showing question) */}
      {gameState === "SHOWING_QUESTION" && currentClue && (
        <QuestionPopover
          treasure={currentClue} // Pass full clue for question text etc.
          onClose={() => handleAnswerSubmit(false)} // Close maps to incorrect for now
          onSubmit={(answer) => handleAnswerSubmit(true)} // Simplified: Assume any submit is correct
        />
        // TODO: Implement real answer checking in QuestionPopover or GameManager
      )}

      {/* Game Over Screen */}
      {gameState === "GAME_OVER" && (
        <div className="game-over-screen">
          <h2>Congratulations!</h2>
          <p>You've completed the Treasure Hunt!</p>
          {/* Optional: Add restart button */}
          {/* <button onClick={() => loadClue(null)}>Play Again</button> */}
        </div>
      )}

      {/* Debug Info (Optional) */}
      <div className="debug-info">
        State: {gameState} | Dist: {distance?.toFixed(1)}m | Clue:{" "}
        {currentClue?.id || "None"} | Loc:{" "}
        {userLocation
          ? `${userLocation.latitude.toFixed(
              4
            )}, ${userLocation.longitude.toFixed(4)}`
          : "N/A"}{" "}
        | GeoErr: {geoError ? "Yes" : "No"}
      </div>
    </div>
  );
}

export default GameManager;
