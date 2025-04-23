// src/components/ProximityPrompt.js
import React from 'react';
import styles from './ProximityPrompt.module.css';

function ProximityPrompt({ onOpenCamera }) {
    return (
        <div className={styles.promptOverlay}>
            <div className={styles.promptBox}>
                <h2>You're Getting Close!</h2>
                <p>A clue seems to be nearby. Open your camera to investigate.</p>
                <button onClick={onOpenCamera} className={styles.cameraButton}>
                    Open Camera
                </button>
            </div>
        </div>
    );
}

export default ProximityPrompt;