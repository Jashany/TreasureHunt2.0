// src/ARScene.js
import React from 'react';
import MODEL_URL from './assets/table.glb'; // Import the model URL

// IMPORTANT: Make sure your model path is correct relative to the 'public' folder
const MODEL_URL = './assets/table.glb'; // Or use a simpler <a-box color="red"></a-box> for testing

function ARScene({ targetLatitude, targetLongitude }) {
  // Construct the gps-entity-place attribute string
  const gpsPlace = `latitude: ${targetLatitude}; longitude: ${targetLongitude};`;

  console.log("Rendering AR Scene for:", gpsPlace);

  return (
    // Ensure this container doesn't conflict with other styles
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
      <a-scene
        vr-mode-ui="enabled: false"
        arjs="sourceType: webcam; videoTexture: true; debugUIEnabled: false;"
        renderer="antialias: true; alpha: true"
        // This embedded style is crucial for positioning
        // It ensures the scene covers the whole screen
        style={{position: 'absolute', top: '0', left: '0', width: '100%', height: '100%'}}
      >
        {/* GPS Camera */}
        <a-camera gps-camera rotation-reader> </a-camera>

        {/* 3D Model Entity */}
        <a-entity
          // Use a-box for simple testing if model loading fails
          // <a-box material="color: red" scale="10 10 10" gps-entity-place={gpsPlace}></a-box>
          gltf-model={`url(${MODEL_URL})`} // Reference the model
          scale="5 5 5"                  // Adjust scale as needed
          gps-entity-place={gpsPlace}      // Set the GPS position
        ></a-entity>
      </a-scene>
    </div>
  );
}

export default ARScene;