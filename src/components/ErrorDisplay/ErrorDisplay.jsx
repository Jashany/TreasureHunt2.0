import React from 'react';
import styles from './ErrorDisplay.module.css'; // Using CSS Modules

function ErrorDisplay({ message, onDismiss }) {
    // Don't render anything if there's no message
    if (!message) {
        return null;
    }

    return (
        <div className={styles.errorOverlay}>
            <div className={styles.errorBox}>
                <h3 className={styles.errorTitle}>Error</h3>
                <p className={styles.errorMessage}>{message}</p>
                
            </div>
        </div>
    );
}

export default ErrorDisplay;