// src/components/QuestionPopover.js
import React from 'react';
import styles from './QuestionPopover.module.css'; // Use same CSS as before or customize

function QuestionPopover({ treasure, onClose }) {
    if (!treasure) return null;

    return (
        <div className={styles.overlay}> {/* Use same overlay style */}
            <div className={styles.popover}> {/* Use same popover style */}
                <button className={styles.closeButton} onClick={onClose}>
                    ×
                </button>
                <h2>Clue Found!</h2>
                <p className={styles.questionText}>{treasure.question}</p>
            </div>
        </div>
    );
}
// Use Popover.module.css from the previous example or create a similar one

export default QuestionPopover;