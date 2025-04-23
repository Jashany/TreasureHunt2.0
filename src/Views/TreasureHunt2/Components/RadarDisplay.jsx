// src/components/RadarDisplay.js
import React, { useMemo } from 'react';
import { getDistance,getBearing } from '../../utils/geo';
import styles from './RadarDisplay.module.css';

const RADAR_DISPLAY_RADIUS_PX = 75; // Smaller radar display
const MAX_RADAR_RANGE_M = 120;

function RadarDisplay({ userLocation, targetLocation }) {
    const targetData = useMemo(() => {
        if (!userLocation || !targetLocation) return null;

        const distance = getDistance(
            userLocation.latitude, userLocation.longitude,
            targetLocation.latitude, targetLocation.longitude
        );

        // Only show if within range
        if (distance > MAX_RADAR_RANGE_M) return null;

        const bearing = getBearing(
            userLocation.latitude, userLocation.longitude,
            targetLocation.latitude, targetLocation.longitude
        );

        // --- Calculate Position on Radar ---
        const angleRad = bearing * Math.PI / 180;
        // Scale distance: 0m = center, MAX_RADAR_RANGE_M = edge
        const displayDistance = Math.min(distance / MAX_RADAR_RANGE_M, 1) * RADAR_DISPLAY_RADIUS_PX;
        const x = displayDistance * Math.sin(angleRad);
        const y = -displayDistance * Math.cos(angleRad);

        const style = {
            left: `calc(50% + ${x}px)`,
            top: `calc(50% + ${y}px)`,
        };

        return { style, distance };

    }, [userLocation, targetLocation]);

    if (!targetData) {
        // Optionally return a 'searching' state or null if out of range
        return null;
        // Or: return <div className={styles.radarContainer}><div className={styles.radarDisplay}><span className={styles.radarStatus}>Scanning...</span></div></div>;
    }
    console.log("Target Data:", targetData); // Debugging line
    return (
        <div className={styles.radarContainer}>
            <div
                className={styles.radarDisplay}
                style={{
                    width: `${RADAR_DISPLAY_RADIUS_PX * 2}px`,
                    height: `${RADAR_DISPLAY_RADIUS_PX * 2}px`,
                }}
            >
                {/* Optional: Add rings back if desired */}
                 <div className={`${styles.ring} ${styles.ringOuter}`}></div>
                 <div className={`${styles.ring} ${styles.ringMiddle}`}></div>

                <div className={styles.userDot}></div>
                <div className={styles.targetDot} style={targetData.style} title={`~${targetData.distance.toFixed(0)}m`}></div>
            </div>
        </div>
    );
}

export default RadarDisplay;