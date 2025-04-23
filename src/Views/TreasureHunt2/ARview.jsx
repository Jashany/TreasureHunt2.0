// src/components/ARView.js
import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
// Optional: OrbitControls for debugging
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import styles from "./ARView.module.css";

// --- Constants ---
const OBJECT_DISTANCE_FROM_CAMERA = -10; // How "far" the object appears

function ARView({ treasure, onObjectClick }) {
  const mountRef = useRef(null);
  const videoRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const requestRef = useRef(null); // For animation frame
  const treasureObjectRef = useRef(null); // Reference to the clickable mesh
  const streamRef = useRef(null); // To store the MediaStream
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const isMountedRef = useRef(false); // Ref to track mount status

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- Click/Tap Handler ---
  const handleInteraction = useCallback(
    (event) => {
      if (
        !rendererRef.current ||
        !cameraRef.current ||
        !treasureObjectRef.current
      )
        return;

      // Calculate mouse position in normalized device coordinates (-1 to +1)
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      let clickX, clickY;

      if (event.changedTouches) {
        // Check for touch event
        clickX = event.changedTouches[0].clientX;
        clickY = event.changedTouches[0].clientY;
      } else {
        // Mouse event
        clickX = event.clientX;
        clickY = event.clientY;
      }

      mouse.current.x = ((clickX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((clickY - rect.top) / rect.height) * 2 + 1;

      // Update the picking ray with the camera and mouse position
      raycaster.current.setFromCamera(mouse.current, cameraRef.current);

      // Calculate objects intersecting the picking ray
      const intersects = raycaster.current.intersectObjects([
        treasureObjectRef.current,
      ]);

      if (intersects.length > 0) {
        console.log("Treasure object clicked!");
        onObjectClick(treasure); // Notify parent component
      }
    },
    [onObjectClick, treasure]
  );

  // --- Three.js Initialization and Animation Loop ---
  useEffect(() => {
    isMountedRef.current = true; // Component mounted
    const currentMount = mountRef.current;
    let width = currentMount.clientWidth;
    let height = currentMount.clientHeight;

    // --- Basic Scene Setup ---
    sceneRef.current = new THREE.Scene();
    cameraRef.current = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    cameraRef.current.position.z = 0; // Camera at origin initially

    rendererRef.current = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    }); // Alpha for transparency
    rendererRef.current.setSize(width, height);
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(rendererRef.current.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    sceneRef.current.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    sceneRef.current.add(directionalLight);

    // --- Treasure Object ---
    // Replace with your desired object/model
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    // const geometry = new THREE.IcosahedronGeometry(0.8);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4caf50, // Greenish
      metalness: 0.3,
      roughness: 0.6,
    });
    treasureObjectRef.current = new THREE.Mesh(geometry, material);
    treasureObjectRef.current.position.set(0, 0, OBJECT_DISTANCE_FROM_CAMERA); // Place it in front
    sceneRef.current.add(treasureObjectRef.current);

    // Optional: Controls for debugging camera position
    // const controls = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    // controls.target.set(0, 0, OBJECT_DISTANCE_FROM_CAMERA); // Point controls at the object
    // controls.update();

    // --- Animation Loop ---
    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);

      // Optional: Add animation (e.g., rotation)
      if (treasureObjectRef.current) {
        treasureObjectRef.current.rotation.y += 0.005;
        treasureObjectRef.current.rotation.x += 0.003;
      }

      // controls.update(); // Update controls if used
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    // --- Start Camera ---
    const startCamera = async () => {
      setError(null);
      try {
        if (streamRef.current) {
          // Stop previous stream if any
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }, // Prefer back camera
        });

        // --- Check if component is still mounted after async operation ---
        if (!isMountedRef.current) {
          console.log(
            "ARView unmounted before camera stream could be attached."
          );
          // Stop the stream we just acquired if component unmounted
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
          return; // Exit if unmounted
        }
        // --- End Check ---

        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.onloadedmetadata = () => {
            // Check again before playing, just in case
            if (isMountedRef.current) {
              videoRef.current.play();
              setIsLoading(false); // Video ready
              animate(); // Start rendering *after* video is playing
            }
          };
        } else {
          // Only throw error if component is still mounted
          if (isMountedRef.current) {
            console.error(
              "Video element ref (videoRef.current) is null when trying to attach stream."
            );
            throw new Error("Video element not found");
          }
        }
      } catch (err) {
        // Only set error if component is still mounted
        if (isMountedRef.current) {
          console.error("Camera Error:", err);
          let message = `Camera Error: ${err.name} - ${err.message}`;
          if (err.name === "NotAllowedError") {
            message = "Camera permission denied. Please enable camera access.";
          } else if (
            err.name === "NotFoundError" ||
            err.name === "DevicesNotFoundError"
          ) {
            message =
              "No suitable camera found (environment facing preferred).";
          } else if (err.name === "NotReadableError") {
            message = "Camera might be already in use by another application.";
          } else if (err.message === "Video element not found") {
            message =
              "Internal error: Could not find the video display element.";
          }
          setError(message);
          setIsLoading(false);
        }
      }
    };

    startCamera();

    // --- Handle Resize ---
    const handleResize = () => {
      if (currentMount && rendererRef.current && cameraRef.current) {
        width = currentMount.clientWidth;
        height = currentMount.clientHeight;
        rendererRef.current.setSize(width, height);
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }
    };
    window.addEventListener("resize", handleResize);

    // --- Setup Interaction Listeners ---
    const rendererElement = rendererRef.current.domElement;
    rendererElement.addEventListener("click", handleInteraction);
    rendererElement.addEventListener("touchstart", handleInteraction); // Add touch support

    // --- Cleanup ---
    return () => {
      isMountedRef.current = false; // Component unmounting
      cancelAnimationFrame(requestRef.current);

      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        console.log("Camera stream stopped.");
      }

      // Remove listeners
      window.removeEventListener("resize", handleResize);
      if (rendererElement) {
        rendererElement.removeEventListener("click", handleInteraction);
        rendererElement.removeEventListener("touchstart", handleInteraction);
      }

      // Dispose Three.js objects
      if (treasureObjectRef.current) {
        treasureObjectRef.current.geometry?.dispose();
        treasureObjectRef.current.material?.dispose();
      }
      if (sceneRef.current) {
        // You might need to traverse the scene to dispose all geometries/materials
        sceneRef.current = null;
      }
      if (rendererRef.current) {
        rendererRef.current.dispose(); // Important for GPU memory
        // Remove canvas from DOM
        if (
          rendererRef.current.domElement &&
          currentMount?.contains(rendererRef.current.domElement)
        ) {
          currentMount.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current = null;
        console.log("Three.js renderer disposed.");
      }
    };
  }, [handleInteraction]); // Rerun effect slightly if handleInteraction changes

  return (
    <div className={styles.arContainer}>
      <video
        ref={videoRef}
        className={styles.videoFeed}
        autoPlay
        playsInline // Crucial for iOS
        muted // Often required for autoplay
      />
      <div ref={mountRef} className={styles.threeCanvas}>
        {/* Three.js canvas will be appended here */}
      </div>
      {isLoading && (
        <div className={styles.loadingOverlay}>Starting Camera...</div>
      )}
      {error && (
        <div className={`${styles.loadingOverlay} ${styles.errorOverlay}`}>
          {error}
        </div>
      )}
    </div>
  );
}

export default ARView;
