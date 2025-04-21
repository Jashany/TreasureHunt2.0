import React, { useState, useEffect } from "react";
import "./App.css";
import model from "./assets/Lorry.glb";

// Haversine formula to calculate distance between two points on Earth
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // in metres
  return d;
}

const App = () => {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isWithinFence, setIsWithinFence] = useState(false);
  const [error, setError] = useState(null);
  const [arReady, setArReady] = useState(false);
  const [distanceToTarget, setDistanceToTarget] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility
  const [answer, setAnswer] = useState(""); // State for user's answer
  const [question, setQuestion] = useState(null); // State for current question
  const [feedback, setFeedback] = useState(""); // State for feedback on answer

  // --- Geofence Configuration ---
  const targetLat = 30.353955; // Example: New York City Hall Latitude
  const targetLon = 76.362377; // Example: New York City Hall Longitude
  const fenceRadius = 100; // meters - Adjust as needed

  // --- AR Object Configuration ---
  const objectLat = 30.353955; // Example: Same as fence center
  const objectLon = 76.362377; // Example: Same as fence center

  useEffect(() => {
    const checkARComponents = setInterval(() => {
      if (
        window.AFRAME &&
        window.AFRAME.components["gps-camera"] &&
        window.AFRAME.components["gps-entity-place"]
      ) {
        setArReady(true);
        clearInterval(checkARComponents);
        console.log("AR Components Ready.");
      } else {
        console.log("Waiting for AR components...");
      }
    }, 500);

    let watchId;

    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setCurrentPosition({ latitude, longitude });
          setError(null);
          console.log(
            `Current location: Lat ${latitude}, Lon ${longitude}, Accuracy: ${accuracy}m`
          );

          const distance = getDistance(
            latitude,
            longitude,
            targetLat,
            targetLon
          );
          setDistanceToTarget(distance);
          console.log(`Distance to target: ${distance.toFixed(2)}m`);
          setIsWithinFence(distance <= fenceRadius);
        },
        (err) => {
          console.error("Error getting location:", err);
          let message = `Error getting location: ${err.message} (Code: ${err.code})`;
          if (err.code === 1)
            message =
              "Location permission denied. Please enable location access.";
          if (err.code === 2)
            message = "Location position unavailable. Check GPS signal.";
          if (err.code === 3) message = "Location request timed out.";
          setError(message);
          setIsWithinFence(false);
          setDistanceToTarget(null);
          setCurrentPosition(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
      setIsWithinFence(false);
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      clearInterval(checkARComponents);
    };
  }, [targetLat, targetLon, fenceRadius]);

  useEffect(() => {
    let entity = null;
    let clickHandler = null;

    if (arReady && isWithinFence) {
      const timeoutId = setTimeout(() => {
        entity = document.querySelector("#target-object");
        if (entity) {
          clickHandler = () => {
            console.log("Entity clicked!");
            setIsModalOpen(true);
          };
          entity.addEventListener("click", clickHandler);
          console.log("Click listener added to #target-object.");
        } else {
          console.warn(
            "Could not find #target-object to attach listener after timeout."
          );
        }
      }, 500);

      return () => {
        clearTimeout(timeoutId);
        if (entity && clickHandler) {
          entity.removeEventListener("click", clickHandler);
          console.log("Click listener removed from #target-object.");
        }
      };
    }
    return undefined;
  }, [arReady, isWithinFence]);

  useEffect(() => {
    const fetchInitialQuestion = async () => {
      setQuestion({
        _id: "mock123",
        text: "What is the capital of France?",
        geolocation: { coordinates: [targetLon, targetLat] },
      });
    };

    fetchInitialQuestion();
  }, []);

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    setFeedback("Checking answer...");
    await new Promise((resolve) => setTimeout(resolve, 500));
    const correctAnswer = "Paris";
    const data = {
      success: answer.trim().toLowerCase() === correctAnswer.toLowerCase(),
      message:
        answer.trim().toLowerCase() === correctAnswer.toLowerCase()
          ? "Correct!"
          : "Incorrect answer. Try again.",
      nextQuestionData:
        answer.trim().toLowerCase() === correctAnswer.toLowerCase()
          ? {
              _id: "mock456",
              text: "Next question...",
              geolocation: {
                coordinates: [targetLon + 0.001, targetLat + 0.001],
              },
            }
          : null,
      isHuntCompleted: false,
    };

    setFeedback(data.message);
    if (data.success) {
      setIsModalOpen(false);
      setAnswer("");
      if (data.nextQuestionData) {
        setQuestion(data.nextQuestionData);
      } else if (data.isHuntCompleted) {
        setQuestion(null);
        setFeedback("Congratulations! You completed the hunt!");
      }
    }
  };

  const renderARScene = () => {
    if (!arReady) {
      return <div>Loading AR components...</div>;
    }

    return (
      <a-scene
        vr-mode-ui="enabled: false"
        arjs="sourceType: webcam; videoTexture: true; debugUIEnabled: true;"
        renderer="logarithmicDepthBuffer: true;"
        cursor="rayOrigin: mouse; fuse: false;"
      >
        <a-camera gps-new-camera="gpsMinDistance: 1; gpsTimeInterval: 500"></a-camera>

        {/* show just a cube */}
        <a-box
          id="target-object"
          material="color: red"
          scale="2 2 2"
          gps-new-entity-place={`latitude: ${objectLat}; longitude: ${objectLon}`}
          look-at="[gps-new-camera]"
        />
      
        {/* <a-entity
          id="target-object"
          gltf-model="url(./assets/Lorry.glb)"
          scale="5 5 5"
          gps-new-entity-place={`latitude: ${objectLat}; longitude: ${objectLon}`}
          look-at="[gps-new-camera]"
        /> */}
      </a-scene>
    );
  };

  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  };

  const modalContentStyle = {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "8px",
    color: "black",
    textAlign: "center",
  };

  return (
    <div
      className="App"
      style={{ display: "flex", flexDirection: "column", height: "100vh" }}
    >
      <h1>Geofenced Web AR Treasure Hunt</h1>
      <p>Status: {arReady ? "AR Ready" : "Initializing AR..."}</p>
      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}

      <div style={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
        <div
          style={{
            width: "80%",
            height: "100%",
            position: "relative",
            border: "1px solid black",
            overflow: "hidden",
          }}
        >
          {arReady && isWithinFence ? (
            renderARScene()
          ) : isWithinFence && !arReady ? (
            <p>Loading AR View...</p>
          ) : !isWithinFence && currentPosition ? (
            <p style={{ padding: "20px" }}>
              Move into the designated area (within {fenceRadius}m of the
              target) to see the AR object.
            </p>
          ) : null}
        </div>

        <div
          style={{
            width: "20%",
            padding: "15px",
            borderLeft: "1px solid #ccc",
            overflowY: "auto",
          }}
        >
          <h2>Information</h2>
          {currentPosition ? (
            <div>
              <p>
                <strong>Your Location:</strong>
                <br />
                Lat: {currentPosition.latitude.toFixed(6)}
                <br />
                Lon: {currentPosition.longitude.toFixed(6)}
              </p>
              <p>
                <strong>Target Area Center:</strong>
                <br />
                Lat: {targetLat.toFixed(6)}
                <br />
                Lon: {targetLon.toFixed(6)}
                <br />
                (Radius: {fenceRadius}m)
              </p>
              {distanceToTarget !== null && (
                <p>
                  <strong>Distance to Target:</strong>{" "}
                  {distanceToTarget.toFixed(2)}m
                </p>
              )}
              <p style={{ fontWeight: "bold" }}>
                Geofence Status:{" "}
                {isWithinFence ? "Inside Target Area" : "Outside Target Area"}
              </p>
            </div>
          ) : (
            !error && <p>Attempting to get your location...</p>
          )}
          {!isWithinFence && currentPosition && (
            <p style={{ color: "orange", marginTop: "10px" }}>
              You need to be inside the target area to interact.
            </p>
          )}
        </div>
      </div>

      {isModalOpen && isWithinFence && question && (
        <div style={modalOverlayStyle} onClick={() => setIsModalOpen(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h2>Question Time!</h2>
            <p>{question.text}</p>
            <form onSubmit={handleAnswerSubmit}>
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Your answer"
                required
                style={{
                  padding: "8px",
                  marginRight: "10px",
                  minWidth: "200px",
                }}
              />
              <button type="submit" style={{ padding: "8px 15px" }}>
                Submit
              </button>
            </form>
            {feedback && (
              <p
                style={{
                  marginTop: "10px",
                  color: feedback.startsWith("Correct") ? "green" : "red",
                }}
              >
                {feedback}
              </p>
            )}
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                marginTop: "15px",
                padding: "8px 15px",
                background: "lightgrey",
              }}
            >
              Close Question
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
