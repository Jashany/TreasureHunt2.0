import React, { useState, useRef, useEffect, Suspense } from "react"; // Import Suspense
import { Canvas, useFrame } from "@react-three/fiber";
// Import useGLTF, useAnimations and remove OrbitControls if not used
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import styles from "./CameraPrompt.module.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// Keep the model import - REMOVE the old one if no longer needed

// Simple Popup Component (Remains the same)
const QuestionPopup = ({ question, isLoading, error, onSubmit, onClose }) => {
  const [answer, setAnswer] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(answer);
    setAnswer(""); // Clear input after submit
  };
  console.log("QuestionPopup rendered with question:", question);

  return (
    <div className={styles.popupOverlay}>
      <div className={styles.popupContent}>
        <button className={styles.popupCloseButton} onClick={onClose}>
          &times;
        </button>
        {isLoading && <p>Loading question...</p>}
        {error && <p className={styles.error}>Error: {error}</p>}
        {question && !isLoading && !error && (
          <form onSubmit={handleSubmit}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontFamily: "Anton SC",
                marginBottom: "0.5rem",
                fontWeight: "300",
              }}
            >
              {question?.currentQuestion?.title}
            </h2>
            <p
              style={{
                fontSize: "1.1rem",
                fontFamily: "Antonio",
                fontWeight: "300",
              }}
            >
              {question?.currentQuestion?.question}
            </p>
            <p>
              Link :{" "}
              <a
                href={question?.currentQuestion?.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "blue", textDecoration: "underline" }}
              >Click Here</a>
            </p>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter your answer"
              required
              className={styles.popupInput}
            />
            <button
              type="submit"
              className={styles.popupButton}
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Submit Answer"}
            </button>
          </form>
        )}
        {!question && !isLoading && !error && <p>Could not load question.</p>}
      </div>
    </div>
  );
};

// Component to load and display the GLTF model with animation
const MagnemiteModel = ({ onClick }) => {
  const group = useRef();
  // Use the imported magnemite model variable
  const { scene, animations } = useGLTF('/assets/magnemite/scene.gltf');
  const { actions } = useAnimations(animations, group); // Use useAnimations hook


  // Play the animation
  useEffect(() => {
    // Log available animation names
    console.log("Available animations:", Object.keys(actions));
    // Play the first animation found (adjust name if needed, e.g., actions['Take 001'])
    const animationName = Object.keys(actions)[0];
    if (animationName) {
      actions[animationName]?.play();
    }
    // Cleanup function to stop animation on unmount
    return () => {
      if (animationName) {
        actions[animationName]?.stop();
      }
    };
  }, [actions]);

  return (
    // Use a group to apply transformations and attach the ref for animations
    <group ref={group} dispose={null}>
      <primitive
        object={scene} // Use the original scene directly
        onClick={(event) => {
          console.log("Magnemite Model clicked!"); // Debug log
          event.stopPropagation(); // Prevent potential event bubbling issues
          onClick(); // Call the passed handler
        }}
        // Adjust position and scale for Magnemite
        position={[0, -1, -5]} // Brought closer on Z-axis
        scale={0.5} // Adjust scale if needed
      />
    </group>
  );
};

// Main CameraPrompt component - Manages state and renders Popup outside Canvas
const CameraPrompt = ({ showAr, onCorrectAnswer }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState("");
  const videoRef = useRef(null);

  // State lifted from Cube component
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [questionData, setQuestionData] = useState(null);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false); // Separate loading for answer submission
  const [fetchError, setFetchError] = useState(null);

  const openCamera = async () => {
    console.log("Opening camera...");
    setError("");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Prefer back camera
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(
        `Error accessing camera: ${err.message}. Please ensure permission is granted.`
      );
      setIsCameraOpen(false);
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setIsCameraOpen(false);
    setError(""); // Clear error on close
    setIsPopupOpen(false); // Close popup if camera closes
    setQuestionData(null);
    setFetchError(null);
  };

  useEffect(() => {
    if (isCameraOpen && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current
        .play()
        .catch((err) => console.error("Video play error:", err)); // Ensure video plays
    }
    // Cleanup function moved inside the effect that sets the stream
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        // Check if srcObject is a MediaStream before trying to get tracks
        if (videoRef.current.srcObject instanceof MediaStream) {
          videoRef.current.srcObject
            .getTracks()
            .forEach((track) => track.stop());
        }
        videoRef.current.srcObject = null; // Clear srcObject
      }
    };
  }, [isCameraOpen, stream]); // Depend only on isCameraOpen and stream

  const fetchQuestion = async () => {
    setIsLoadingQuestion(true);
    setFetchError(null);
    setQuestionData(null);
    try {
      const response = await fetch(
        "https://treasure-api.jsondev.in/api/questions/currentSequence",
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
        const errorData = await response.json().catch(() => ({})); // Try parsing JSON, default to empty
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
      const data = await response.json();
      setQuestionData(data);
    } catch (error) {
      console.error("Failed to fetch question:", error);
      setFetchError(error.message);
      toast.error(`Failed to load question: ${error.message}`);
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  // Renamed handler for clarity
  const handleModelClick = () => {
    setIsPopupOpen(true);
    fetchQuestion();
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setQuestionData(null);
    setFetchError(null);
  };

  const handleSubmitAnswer = async (userAnswer) => {
    setIsLoadingAnswer(true); // Use separate loading state
    try {
      const response = await fetch(
        `https://treasure-api.jsondev.in/api/questions/checkCurrent`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            userAnswer: userAnswer,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.message || `HTTP error! status: ${response.status}`
        );
      }
      if (result.success) {
        //show the toast message for 2 seconds
        toast.success("Correct Answer! Moving to the next clue.", {
          autoClose: 2000,
        });
        handleClosePopup();
        if (onCorrectAnswer) {
          // Check if the callback exists
          onCorrectAnswer(); // Call the callback passed from GameManager
        }
      } else {
        toast.error(result.message || "Incorrect Answer. Try again!");
      }
    } catch (error) {
      if (
        error.success === false ||
        error.message === "Incorrect answer. Please try again."
      ) {
        toast.error("Incorrect Answer. Try again!");
      } else {
        console.error("Failed to submit answer:", error);
        toast.error(`Failed to submit answer: ${error.message}`);
      }
    } finally {
      setIsLoadingAnswer(false); // Use separate loading state
    }
  };

  return (
    <div className={styles.cameraPromptContainer}>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      {!isCameraOpen ? (
        <div className={styles.CameraDiv}>
          <h2>Camera Prompt</h2>
          <p>You are close! Open your camera to find the clue.</p>
          <button onClick={openCamera} className={styles.button}>
            Open Camera
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </div>
      ) : (
        <div className={styles.cameraView}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={showAr ? styles.videoBackground : styles.video}
          ></video>

          {showAr && (
            <div className={styles.arView}>
              <Canvas
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  zIndex: 1,
                }}
              >
                <ambientLight intensity={1.0} /> {/* Increased intensity slightly */}
                <directionalLight position={[5, 10, 7.5]} intensity={1.5} /> {/* Increased intensity */}
                <Suspense fallback={null}>
                  {/* Use the new MagnemiteModel component */}
                  <MagnemiteModel onClick={handleModelClick} />
                </Suspense>
              </Canvas>
            </div>
          )}

          <button onClick={closeCamera} className={styles.closeButton}>
            Close Camera
          </button>

          {isPopupOpen && (
            <QuestionPopup
              question={questionData}
              isLoading={isLoadingQuestion || isLoadingAnswer} // Combine loading states for popup
              error={fetchError}
              onSubmit={handleSubmitAnswer}
              onClose={handleClosePopup}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default CameraPrompt;
