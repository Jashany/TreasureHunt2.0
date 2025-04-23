// src/components/RadarDisplay.js
import React, { useMemo } from "react";
import { getDistance, getBearing } from "../../Views/utils/geo";
import styles from "./RadarDisplay.module.css";

const RADAR_DISPLAY_RADIUS_PX = 100; // Smaller radar display
const MAX_RADAR_RANGE_M = 120;

function RadarDisplay({ userLocation, targetLocation }) {
  const targetData = useMemo(() => {
    if (!userLocation || !targetLocation) return null;

    const distance = getDistance(
      userLocation.latitude,
      userLocation.longitude,
      targetLocation.latitude,
      targetLocation.longitude
    );

    if (distance > MAX_RADAR_RANGE_M) return null;

    const bearing = getBearing(
      userLocation.latitude,
      userLocation.longitude,
      targetLocation.latitude,
      targetLocation.longitude
    );

    const angleRad = (bearing * Math.PI) / 180;

    // Calculate normalized distance
    const normalizedDistance = distance / MAX_RADAR_RANGE_M;

    // Apply bias factor
    const biasFactor = 1.1; // Keep the bias
    let biasedNormalizedDistance = normalizedDistance * biasFactor;

    // Clamp the biased distance to a maximum of 1 (edge of the radar)
    biasedNormalizedDistance = Math.min(biasedNormalizedDistance, 1);

    // Ensure a minimum visual separation from the center if distance > 0
    const MIN_VISUAL_SEPARATION_NORMALIZED = 0.1; // 10% of radius
    if (
      distance > 0 &&
      biasedNormalizedDistance < MIN_VISUAL_SEPARATION_NORMALIZED
    ) {
      biasedNormalizedDistance = MIN_VISUAL_SEPARATION_NORMALIZED;
    }

    const displayDistance = biasedNormalizedDistance * RADAR_DISPLAY_RADIUS_PX;
    const x = displayDistance * Math.sin(angleRad);
    const y = -displayDistance * Math.cos(angleRad);

    // Calculate style relative to the center (50%, 50%)
    // Use translate to center the dot itself on the calculated point
    const style = {
      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
      left: `70%`, // Start from center
      top: `60%`, // Start from center
    };

    return { style, distance };
  }, [userLocation, targetLocation]);

  return (
    <div className={styles.radarContainer}>
      <div
        className={styles.radarDisplay}
        style={{
          width: `${RADAR_DISPLAY_RADIUS_PX * 2}px`,
          height: `${RADAR_DISPLAY_RADIUS_PX * 2}px`,
        }}
      >
        {/* This div will contain the rotating elements */}
        <div className={styles.radarBackground}>
          {/* Add the sweep element here */}
          <div className={styles.radarSweep}></div>
          <div className={`${styles.ring} ${styles.ringOuter}`}></div>
          <div className={`${styles.ring} ${styles.ringMiddle}`}></div>
          <div className={`${styles.ring} ${styles.ringInner}`}></div>{" "}
          {/* Added inner ring for consistency */}
          {!targetData && (
            <span className={styles.radarStatus}>Scanning...</span>
          )}
        </div>

        {/* Static elements */}
        <div className={styles.userDot}></div>
        {targetData && (
          <div
            className={styles.targetDot}
            style={targetData.style}
            title={`~${targetData.distance.toFixed(0)}m`}
          ></div>
        )}
      </div>
      <p style={{
        textAlign: "center",
        fontSize: "0.8rem",
        marginTop: "0.5rem",
        color: "#888",
      }}>
        {/* **Note:** The radar is a visual aid and does not represent real-time data. It just makes sure that a object is in the radar range but doesnt tell anything about the distance or the direction of the object. 
        write in proper english and make it more readable.
        */}
        **Note:** The radar is a visual aid and does not represent real-time data. It indicates whether an object is within range but does not provide specific distance or direction information.**{" "}
        <br />
        <br />
        You are in 120m range of the clue
      </p>
    </div>
  );
}

export default RadarDisplay;
