import { useState, useEffect } from 'react';
import ARScene from './ARScene'; // Import the new component
import './App.css'; // Optional: For styling

// --- Configuration ---
const TARGET_LATITUDE = 30.356376; // Example: Los Angeles City Hall
const TARGET_LONGITUDE = 76.371312;
const TARGET_RADIUS_METERS = 20; // Radius in meters
// --- End Configuration ---

// --- Haversine Formula Function ---
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = lat1 * Math.PI / 180; // φ, λ in radians
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // in meters
  return distance;
}
// --- End Haversine ---


function App() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWithinRadius, setIsWithinRadius] = useState(false); // State for proximity
  const [distance, setDistance] = useState(null); // State to show distance

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    // Check for HTTPS - crucial for Geolocation and Camera
    if (window.location.protocol !== 'https:') {
       setError('Geolocation and Camera require HTTPS. Please serve your app over HTTPS.');
       setLoading(false);
       // Optional: Redirect or provide instructions
       // window.location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
       return;
    }


    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // Increased timeout
      maximumAge: 0
    };

    console.log("Setting up geolocation watch...");

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        console.log("Position update:", position.coords);
        const currentLat = position.coords.latitude;
        const currentLon = position.coords.longitude;

        setLocation({
          latitude: currentLat,
          longitude: currentLon,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed
        });

        // Calculate distance from target
        const dist = calculateDistance(currentLat, currentLon, TARGET_LATITUDE, TARGET_LONGITUDE);
        setDistance(dist); // Update distance state

        // Check if within radius
        const within = dist <= TARGET_RADIUS_METERS;
        if (within !== isWithinRadius) { // Only update state if it changes
           console.log(`Distance: ${dist.toFixed(2)}m. Within radius: ${within}`);
           setIsWithinRadius(within);
        }


        // Only set loading to false on the first *successful* fix
        if (loading) {
            setLoading(false);
        }
         // Clear previous errors on success
        if (error) {
            setError(null);
        }
      },
      (err) => {
        console.error("Geolocation Error:", err);
        setError(`ERROR(${err.code}): ${err.message}`);
        // Don't immediately stop loading on error, maybe the next update works
        // setLoading(false); // Consider if you want loading=false on error
        setIsWithinRadius(false); // Assume outside radius on error
        setDistance(null);
      },
      options
    );

    // Clean up watcher on component unmount
    return () => {
      console.log("Clearing geolocation watch (ID:", watchId, ")");
      navigator.geolocation.clearWatch(watchId);
    };
    // Rerun effect if isWithinRadius state changes (to ensure console log reflects latest state)
    // Though the core logic doesn't depend on it here. Add dependencies if needed.
  }, [loading, error, isWithinRadius]); // Added isWithinRadius to dependencies for logging consistency

  return (
    <div className="geolocation-container">
      <h1>Geolocation AR Test</h1>
      <p>Target: {TARGET_LATITUDE.toFixed(6)}°, {TARGET_LONGITUDE.toFixed(6)}°</p>
      <p>Radius: {TARGET_RADIUS_METERS} meters</p>

      {loading && <p>Loading location data... Waiting for GPS fix...</p>}

      {error && <p className="error">Error: {error}</p>}

      {location && !loading && (
        <div className="location-data">
          <h2>Your Current Location</h2>
          <table>
            <tbody>
              <tr><td>Latitude:</td><td>{location.latitude.toFixed(6)}°</td></tr>
              <tr><td>Longitude:</td><td>{location.longitude.toFixed(6)}°</td></tr>
              <tr><td>Accuracy:</td><td>{location.accuracy?.toFixed(2)} meters</td></tr>
              {/* Add other location details if needed */}
              {distance !== null && (
                <tr><td>Distance to Target:</td><td>{distance.toFixed(2)} meters</td></tr>
              )}
               <tr><td>Within Target Radius:</td><td>{isWithinRadius ? 'Yes' : 'No'}</td></tr>
            </tbody>
          </table>

          {!isWithinRadius && (
             <p className="status-message">Move closer to the target location to see the AR object.</p>
          )}
        </div>
      )}

      {/* Conditionally render the AR Scene */}
      {isWithinRadius && !loading && !error && (
        <>
          <p className="status-message success">You are within the target radius! Look around for the AR object.</p>
          <ARScene
            targetLatitude={TARGET_LATITUDE}
            targetLongitude={TARGET_LONGITUDE}
          />
        </>
      )}
    </div>
  );
}

export default App;