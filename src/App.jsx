import { useState, useEffect } from 'react';

function App() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    const options = {
      enableHighAccuracy: true, // Request high accuracy
      timeout: 10000,           // Time to wait for a position
      maximumAge: 0             // Don't use a cached position
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy, // in meters
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed
        });
        setLoading(false);
      },
      (err) => {
        setError(`ERROR(${err.code}): ${err.message}`);
        setLoading(false);
      },
      options
    );

    // Clean up by removing the watcher
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div className="geolocation-container">
      <h1>Your Current Location</h1>
      
      {loading && <p>Loading location data...</p>}
      
      {error && <p className="error">Error: {error}</p>}
      
      {location && (
        <div className="location-data">
          <h2>Coordinates</h2>
          <table>
            <tbody>
              <tr>
                <td>Latitude:</td>
                <td>{location.latitude.toFixed(6)}°</td>
              </tr>
              <tr>
                <td>Longitude:</td>
                <td>{location.longitude.toFixed(6)}°</td>
              </tr>
              <tr>
                <td>Accuracy:</td>
                <td>{location.accuracy.toFixed(2)} meters</td>
              </tr>
              {location.altitude !== null && (
                <tr>
                  <td>Altitude:</td>
                  <td>{location.altitude.toFixed(2)} meters</td>
                </tr>
              )}
              {location.altitudeAccuracy !== null && (
                <tr>
                  <td>Altitude Accuracy:</td>
                  <td>{location.altitudeAccuracy.toFixed(2)} meters</td>
                </tr>
              )}
              {location.heading !== null && (
                <tr>
                  <td>Heading:</td>
                  <td>{location.heading.toFixed(2)}°</td>
                </tr>
              )}
              {location.speed !== null && (
                <tr>
                  <td>Speed:</td>
                  <td>{location.speed.toFixed(2)} m/s</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;