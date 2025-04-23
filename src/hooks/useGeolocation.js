// src/hooks/useGeolocation.js
import { useState, useEffect, useRef } from "react";

export function useGeolocation(
  options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    const handleSuccess = (position) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      setError(null); // Clear previous errors
    };
    console.log("Geolocation watch started.");
    const handleError = (err) => {
      console.error("Geolocation Error:", err);
      let message = `Geolocation Error: ${err.message} (Code: ${err.code})`;
      switch (err.code) {
        case err.PERMISSION_DENIED:
          message =
            "Geolocation permission denied. Please enable location access in your browser/OS settings.";
          // Stop watching if permission denied permanently
          if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
          break;
        case err.POSITION_UNAVAILABLE:
          message = "Location information is unavailable.";
          break;
        case err.TIMEOUT:
          message = "Location request timed out.";
          break;
        default: // UNKNOWN_ERROR
          message = "An unknown geolocation error occurred.";
          break;
      }
      setError(message);
    };

    // Clear any previous watch
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    // Start watching
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );

    // Cleanup function
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        console.log("Geolocation watch cleared.");
      }
    };
  }, [options]); // Re-run effect if options change (though usually they don't)

  return { location, error };
}
