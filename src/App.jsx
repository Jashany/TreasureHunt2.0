import React, { useState, useEffect } from "react";
import "./App.css";
import model from './assets/Lorry.glb'
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

  // --- Geofence Configuration ---
  // FIXME: Replace with your target latitude/longitude for the geofence center
  const targetLat = 30.356016; // Example: New York City Hall Latitude
  const targetLon = 76.371482; // Example: New York City Hall Longitude
  const fenceRadius = 100; // meters - Adjust as needed

  // --- AR Object Configuration ---
  // FIXME: Replace with the exact GPS coordinates where the AR object should appear
  const objectLat = 30.356016; // Example: Same as fence center
  const objectLon = 76.371482; // Example: Same as fence center

  useEffect(() => {
    // Check if A-Frame and AR.js components are loaded
    // We need to wait for the scripts in index.html to load and register components
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
    }, 500); // Check every 500ms

    let watchId;

    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setCurrentPosition({ latitude, longitude });
          setError(null); // Clear previous errors
          console.log(
            `Current location: Lat ${latitude}, Lon ${longitude}, Accuracy: ${accuracy}m`
          );

          const distance = getDistance(
            latitude,
            longitude,
            targetLat,
            targetLon
          );
          setDistanceToTarget(distance); // Update distance state
          console.log(`Distance to target: ${distance.toFixed(2)}m`);
          setIsWithinFence(distance <= fenceRadius);
        },
        (err) => {
          console.error("Error getting location:", err);
          // Provide more specific error messages
          let message = `Error getting location: ${err.message} (Code: ${err.code})`;
          if (err.code === 1)
            message =
              "Location permission denied. Please enable location access.";
          if (err.code === 2)
            message = "Location position unavailable. Check GPS signal.";
          if (err.code === 3) message = "Location request timed out.";
          setError(message);
          setIsWithinFence(false); // Assume outside fence on error
          setDistanceToTarget(null); // Reset distance on error
          setCurrentPosition(null);
        },
        {
          enableHighAccuracy: true, // Request high accuracy
          timeout: 15000, // Increased timeout (15 seconds)
          maximumAge: 0, // Force fresh reading
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
      setIsWithinFence(false);
    }

    // Cleanup function
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      clearInterval(checkARComponents); // Clear the interval checker
    };
  }, [targetLat, targetLon, fenceRadius]); // Re-run effect if fence changes

  // Effect for adding click listener to AR entity
  useEffect(() => {
    let entity = null;
    let clickHandler = null;

    // Only try to add listener if AR is ready and user is inside the fence
    if (arReady && isWithinFence) {
      // Use a small timeout to allow A-Frame to potentially render the entity
      const timeoutId = setTimeout(() => {
        entity = document.querySelector("#target-object"); // Select entity by ID
        if (entity) {
          clickHandler = () => {
            console.log("Entity clicked!");
            setIsModalOpen(true); // Open the modal on click
          };
          // Use 'click' event which is triggered by the cursor component
          entity.addEventListener("click", clickHandler);
          console.log("Click listener added to #target-object.");
        } else {
          console.warn(
            "Could not find #target-object to attach listener after timeout."
          );
        }
      }, 500); // Wait 500ms

      // Cleanup function for this effect
      return () => {
        clearTimeout(timeoutId);
        if (entity && clickHandler) {
          entity.removeEventListener("click", clickHandler);
          console.log("Click listener removed from #target-object.");
        }
      };
    }
    // If not ready or not within fence, the effect doesn't run,
    // or the cleanup from the previous run (if any) handles removal.
    return undefined;
  }, [arReady, isWithinFence]); // Re-run when AR readiness or fence status changes

  // --- A-Frame Scene ---
  const renderARScene = () => {
    if (!arReady) {
      return <div>Loading AR components...</div>;
    }

    return (
      <a-scene
        vr-mode-ui="enabled: false"
        arjs="sourceType: webcam; videoTexture: true; debugUIEnabled: true;"
        renderer="logarithmicDepthBuffer: true;"
        // Add cursor component for interaction detection
        cursor="rayOrigin: mouse; fuse: false;"
      >
        {/* Add raycaster to camera for cursor interaction */}
        <a-camera gps-new-camera="gpsMinDistance: 1; gpsTimeInterval: 500">
          {/* Optional: Add a visual indicator for the cursor */}
          {/* <a-entity cursor="fuse: false;" position="0 0 -1" geometry="primitive: ring; radiusInner: 0.02; radiusOuter: 0.03" material="color: white; shader: flat"></a-entity> */}
        </a-camera>

        {/* --- Your AR Object --- */}
        {/* <a-entity
          id="target-object" // Add ID for selection
          material="color: dodgerblue"
          geometry="primitive: box"
          scale="0.8 0.8 0.8"
          gps-new-entity-place={`latitude: ${objectLat}; longitude: ${objectLon}`}
          look-at="[gps-new-camera]"
        /> */}

        {/* Example: Load a GLTF model */}
        
        <a-entity
          gltf-model="url(./assets/Lorry.glb)" // Replace with your model path (place in public folder)
          scale="5 5 5" // Adjust scale
          gps-new-entity-place={`latitude: ${objectLat}; longitude: ${objectLon}`}
          look-at="[gps-new-camera]"
        />
       
      </a-scene>
    );
  };

  // --- Basic Modal Styles --- (Consider moving to App.css)
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
    zIndex: 1000, // Ensure it's above the A-Frame scene
  };

  const modalContentStyle = {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "8px",
    color: "black",
    textAlign: "center",
  };

  return (
    <div className="App">
      <h1>Geofenced Web AR</h1>
      <p>Status: {arReady ? "AR Ready" : "Initializing AR..."}</p>
      {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}

      {currentPosition ? (
        <div>
          <p>
            Your Location: Lat: {currentPosition.latitude.toFixed(6)}, Lon:{" "}
            {currentPosition.longitude.toFixed(6)}
          </p>
          <p>
            Target Area Center: Lat: {targetLat.toFixed(6)}, Lon:{" "}
            {targetLon.toFixed(6)} (Radius: {fenceRadius}m)
          </p>
          {/* Display the distance */}
          {distanceToTarget !== null && (
            <p>Distance to Target: {distanceToTarget.toFixed(2)}m</p>
          )}
          <p style={{ fontWeight: "bold" }}>
            Geofence Status:{" "}
            {isWithinFence ? "Inside Target Area" : "Outside Target Area"}
          </p>
        </div>
      ) : (
        !error && <p>Attempting to get your location...</p>
      )}

      {/* AR Scene Container */}
      {arReady && isWithinFence ? (
        <div
          style={{
            margin: "20px 0",
            width: "100%",
            height: "70vh",
            position: "relative", // Needed for potential absolute positioning inside
            border: "1px solid black",
          }}
        >
          {renderARScene()}
        </div>
      ) : isWithinFence && !arReady ? (
        <p>Loading AR View...</p>
      ) : null}
      {!isWithinFence && currentPosition && (
        <p>
          Move into the designated area (within {fenceRadius}m of the target) to
          see the AR object.
        </p>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div style={modalOverlayStyle} onClick={() => setIsModalOpen(false)}>
          {/* Close on overlay click */}
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h2>Object Interaction</h2>
            <p>You clicked the AR object!</p>
            <button
              onClick={() => setIsModalOpen(false)}
              style={{ marginTop: "15px", padding: "8px 15px" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
