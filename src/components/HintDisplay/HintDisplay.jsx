// src/components/HintDisplay.js
import React from 'react';
import styles from './HintDisplay.module.css';

function HintDisplay({ hint }) {
    if (!hint) return null;
    return (
        <div className={styles.hintContainer}>
            <h3>Current Hint:</h3>
            <p>{hint}</p>
        </div>
    );
}

export default HintDisplay;