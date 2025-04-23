import React from 'react';
import styles from './LoadingIndicator.module.css'; // Using CSS Modules

function LoadingIndicator({ message = "Loading..." }) { // Default message
    return (
        // Added role="status" for accessibility - screen readers can announce loading state
        <div className={styles.loadingOverlay} role="status" aria-live="polite">
            <div className={styles.loadingBox}>
                <div className={styles.spinner}></div>
                {message && <p className={styles.loadingMessage}>{message}</p>}
            </div>
        </div>
    );
}

export default LoadingIndicator;