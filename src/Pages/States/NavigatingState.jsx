import RadarDisplay from "../../components/RadarDisplay/RadarDisplay";
import CameraPrompt from "../../components/CameraPrompt/CameraPrompt"; // Import the new component

const NavigatingState = ({ clue, userLocation, distance, isCameraPrompt,showAR,onCorrectAnswer }) => {
  const targetLocation = {
    latitude: clue.geolocation.coordinates[0],
    longitude: clue.geolocation.coordinates[1],
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        marginTop: "2rem",
        width: "100%", // Ensure NavigatingState takes full width if needed for percentage widths below
      }}
    >
      <h1
        style={{
          fontFamily: "Anton SC",
          fontSize: "2.5rem",
        }}
      >
        Navigating State
      </h1>
      <p>Clue: {clue.title}</p>
      <p>
        User Location: {userLocation?.latitude.toFixed(6)},{" "}
        {userLocation?.longitude.toFixed(6)}
      </p>
      <div style={{ textAlign: "center", marginBlock: "2rem" }}>
        <h2 style={{ marginBlock: "1rem" }}>Location Hint</h2>
        <p>{clue.hint && <span>{clue?.hint}</span>}</p>
      </div>
      {isCameraPrompt === true ? (
        <CameraPrompt showAr={showAR} onCorrectAnswer={onCorrectAnswer} /> // Use the CameraPrompt component here
      ) : (
        <div>
          <RadarDisplay
            userLocation={userLocation}
            targetLocation={targetLocation}
          />
        </div>
      )}
    </div>
  );
};

export default NavigatingState;
