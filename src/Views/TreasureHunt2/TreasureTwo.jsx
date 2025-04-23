// src/App.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ARView from './ARview';
import QuestionPopover from './Components/QuestionPopover';
import ProximityPrompt from './Components/ProximityPrompt';
import { useGeolocation } from '../../hooks/useGeolocation';
import { getDistance } from '../utils/geo';

import './TreasureTwo.css'; // For basic app layout

// --- Constants ---
const NEAR_THRESHOLD_M = 100;
const AR_THRESHOLD_M = 90;

function TreasureTwo() {
    const [treasure, setTreasure] = useState(null); // Single treasure object
    const [fetchError, setFetchError] = useState(null);
    const [isLoadingTreasure, setIsLoadingTreasure] = useState(true);
    const [gameState, setGameState] = useState('loading'); // 'loading', 'outOfRange', 'promptNear', 'viewingAR', 'showingQuestion'
    const [distance, setDistance] = useState(null);

    const { location: userLocation, error: geoError } = useGeolocation();

    // --- Fetch Treasure Data ---
    useEffect(() => {
        const fetchTreasureData = async () => {
            setIsLoadingTreasure(true);
            setFetchError(null);
            try {
                // Replace with your actual backend endpoint
                // This example fetches a single, predefined treasure
                // In a real app, you might pass an ID or get it dynamically
                // const response = await fetch('/api/treasure/clueXYZ');
                // if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                // const data = await response.json();

                 // --- Dummy Treasure Data ---
                const dummyTreasure = {
                    id: 'statueClue',
                    latitude: 30.351100, // Approx. Statue of Liberty
                    longitude:  76.359865,
                    question: 'In which hand does Lady Liberty hold her torch?'
                };
                 await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate fetch delay
                 const data = dummyTreasure;
                 // --- End Dummy Data ---

                setTreasure(data);
            } catch (error) {
                console.error("Failed to fetch treasure:", error);
                setFetchError(`Failed to load treasure: ${error.message}. Please try again later.`);
            } finally {
                setIsLoadingTreasure(false);
            }
        };

        fetchTreasureData();
    }, []); // Fetch only once on mount

    // --- Calculate Distance and Update Game State ---
    useEffect(() => {
        if (!userLocation || !treasure || isLoadingTreasure || gameState === 'showingQuestion') {
            // Don't calculate distance or change proximity state if:
            // - We don't have user location OR treasure data
            // - Treasure is still loading
            // - The question popover is already showing
            return;
        }

        const dist = getDistance(
            userLocation.latitude, userLocation.longitude,
            treasure.latitude, treasure.longitude
        );
        setDistance(dist); // Store distance for display

        // Determine game state based on distance, avoiding unnecessary transitions
        if (dist <= AR_THRESHOLD_M) {
            if (gameState !== 'viewingAR') {
                 console.log(`State Change: Entered AR Zone (${dist.toFixed(1)}m)`);
                setGameState('viewingAR');
            }
        } else if (dist <= NEAR_THRESHOLD_M) {
             // Only prompt if not already viewing AR (e.g., user moved slightly out of 20m but still < 50m)
             if (gameState !== 'viewingAR' && gameState !== 'promptNear') {
                 console.log(`State Change: Entered Near Zone (${dist.toFixed(1)}m)`);
                 setGameState('promptNear');
             } else if (gameState === 'viewingAR') {
                 // If they were viewing AR and moved out, just go back to near prompt
                  console.log(`State Change: Moved out of AR Zone to Near Zone (${dist.toFixed(1)}m)`);
                  setGameState('promptNear');
             }
        } else {
            if (gameState !== 'outOfRange') {
                 console.log(`State Change: Out of Range (${dist.toFixed(1)}m)`);
                setGameState('outOfRange');
            }
        }

    }, [userLocation, treasure, isLoadingTreasure, gameState]); // Re-run when location, treasure, or loading state changes


    // --- Event Handlers ---
    const handleOpenCamera = useCallback(() => {
        console.log("User requested camera open");
        setGameState('viewingAR'); // Transition to AR view state
    }, []);

    const handleObjectClick = useCallback((clickedTreasure) => {
        console.log(`AR Object clicked: ${clickedTreasure.id}`);
        setGameState('showingQuestion'); // Show the question popover
    }, []);

    const handleCloseQuestion = useCallback(() => {
        console.log("Question popover closed");
        // Decide what happens next: maybe mark as solved, or just go back to AR view
        // For now, just go back to AR view if still in range, otherwise outOfRange
        if (distance !== null && distance <= AR_THRESHOLD_M) {
            setGameState('viewingAR');
        } else {
             setGameState('outOfRange'); // Or 'promptNear' if distance is appropriate
        }
    }, [distance]);


    // --- Render Logic ---
    const renderContent = () => {
        if (isLoadingTreasure || (!userLocation && !geoError && gameState === 'loading')) {
            return <div className="status-overlay">Loading Treasure Hunt...</div>;
        }
        if (fetchError) {
            return <div className="status-overlay error">{fetchError}</div>;
        }
        if (geoError) {
             // Show geo error prominently unless AR is already active
             if (gameState !== 'viewingAR' && gameState !== 'showingQuestion') {
                return <div className="status-overlay error">{geoError}</div>;
             }
             // If AR is active, we might allow it to continue temporarily, maybe show error subtly
        }
         if (!userLocation && gameState !== 'loading') {
            // We have treasure, but no location yet (and no error reported)
             return <div className="status-overlay">Acquiring your location... Ensure location services are enabled.</div>;
         }


        // Main game states
        switch (gameState) {
            case 'promptNear':
                return <ProximityPrompt onOpenCamera={handleOpenCamera} />;
            case 'viewingAR':
                return <ARView treasure={treasure} onObjectClick={handleObjectClick} />;
            case 'showingQuestion':
                // Render ARView in background *and* QuestionPopover on top
                return (
                    <>
                        <ARView treasure={treasure} onObjectClick={() => {}} /> {/* Prevent clicking obj when question open */}
                        <QuestionPopover treasure={treasure} onClose={handleCloseQuestion} />
                    </>
                );
            case 'outOfRange':
            default: // Including 'loading' after initial checks pass but before state settles
                return (
                     <div className="status-overlay info">
                        <p>Find the treasure clue!</p>
                        {distance !== null && <p>Distance: {distance.toFixed(0)} meters</p>}
                        {geoError && <p className="error-inline">{geoError}</p>}
                    </div>
                );
        }
    };

    return (
        <div className="App">
            {renderContent()}
            {/* Optional: A small status bar always visible */}
             <div className="debug-status">
                State: {gameState} | Dist: {distance?.toFixed(1)}m | Loc: {userLocation?.latitude.toFixed(4)}, {userLocation?.longitude.toFixed(4)} | GeoAcc: {userLocation?.accuracy?.toFixed(0)}m
            </div>
        </div>
    );
}

export default TreasureTwo;