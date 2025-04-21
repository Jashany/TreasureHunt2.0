// filepath: src/Map.jsx
import React, { useState, useEffect } from "react";
import TinyQueue from 'tinyqueue';
import "./Map.css";

// --- Helper: Shuffle Array (Fisher-Yates) ---
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// --- A* Pathfinding Logic with Randomized Neighbor Order ---

// Heuristic function (Manhattan distance)
const heuristic = (r, c, end) => {
  return Math.abs(r - end[0]) + Math.abs(c - end[1]);
};

// State representation: [r, c, straightMoves, lastDirName]
const getStateKey = (state) => `${state[0]}-${state[1]}-${state[2]}-${state[3] || 'null'}`;

const findPathAStarWithRandomness = (rows, cols, start, end) => {
  const directions = [
    { dr: 0, dc: 1, name: "right" },
    { dr: 1, dc: 0, name: "down" },
    { dr: 0, dc: -1, name: "left" },
    { dr: -1, dc: 0, name: "up" },
  ];

  const startState = [start[0], start[1], 0, null];
  const startKey = getStateKey(startState);

  const openSet = new TinyQueue([], (a, b) => a[0] - b[0]); // Priority Queue by f_cost
  const cameFrom = new Map();
  const gScore = new Map();
  gScore.set(startKey, 0);

  const initialFCost = heuristic(start[0], start[1], end);
  openSet.push([initialFCost, startState]);

  let visitedNodes = 0;

  while (openSet.length > 0) {
    const [currentFCost, currentState] = openSet.pop();
    const [r, c, straightMoves, lastDirName] = currentState;
    const currentKey = getStateKey(currentState);
    visitedNodes++;

     // Optimization check (optional but can help)
    // if ((gScore.get(currentKey) ?? Infinity) < currentFCost - heuristic(r,c, end)) {
    //      continue;
    // }

    // --- Goal Check ---
    if (r === end[0] && c === end[1]) {
      console.log(`A* (Randomized) found path after visiting ${visitedNodes} states.`);
      // Reconstruct path
      const path = [];
      let tempState = currentState;
      while (tempState) {
        path.push([tempState[0], tempState[1]]);
        const key = getStateKey(tempState);
        tempState = cameFrom.get(key);
        if (path.length > rows * cols * 4) {
            console.error("Path reconstruction failed - potential loop");
            return null;
        }
      }
      return path.reverse();
    }

    // --- Explore Neighbors ---
    const currentGCost = gScore.get(currentKey);

    // *** Introduce Randomness: Shuffle direction order ***
    const shuffledDirections = shuffleArray([...directions]); // Create and shuffle a copy

    // Iterate through the SHUFFLED directions
    for (const dir of shuffledDirections) {
      // Constraint: Check for 3 straight moves rule
      if (dir.name === lastDirName && straightMoves >= 3) {
        continue;
      }

      const nr = r + dir.dr;
      const nc = c + dir.dc;

      // Check boundaries
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
        continue;
      }

      const nextStraightMoves = (dir.name === lastDirName) ? straightMoves + 1 : 1;
      const neighborState = [nr, nc, nextStraightMoves, dir.name];
      const neighborKey = getStateKey(neighborState);
      const tentativeGCost = currentGCost + 1;

      if (tentativeGCost < (gScore.get(neighborKey) ?? Infinity)) {
        cameFrom.set(neighborKey, currentState);
        gScore.set(neighborKey, tentativeGCost);
        const neighborFCost = tentativeGCost + heuristic(nr, nc, end);
        openSet.push([neighborFCost, neighborState]);
      }
    } // End neighbor loop
  } // End while loop

  console.log(`A* (Randomized) finished after visiting ${visitedNodes} states without finding a path.`);
  return null;
};
// --- End A* Pathfinding Logic ---


// --- React Component (Uses the new function) ---
const MapVieww = () => {
  const rows = 15;
  const cols = 30;
  const [path, setPath] = useState(null);

  useEffect(() => {
    const startNode = [0, 0];
    const endNode = [rows - 1, cols - 1];

    console.time("A* Randomized Pathfinding");
    // *** Use the new randomized function ***
    const foundPath = findPathAStarWithRandomness(rows, cols, startNode, endNode);
    console.timeEnd("A* Randomized Pathfinding");

    if (foundPath) {
      const pathSet = new Set(foundPath.map(([r, c]) => `${r}-${c}`));
      setPath(pathSet);
      console.log("A* (Randomized) Path found, length:", foundPath.length);
    } else {
      console.log("No path found using A* (Randomized)!");
      setPath(new Set());
    }
  }, [rows, cols]);

  const gridCells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellKey = `${r}-${c}`;
      const isPath = path?.has(cellKey);
      gridCells.push(
        <div
          key={cellKey}
          className={`grid-cell ${isPath ? "path-cell" : ""}`}
        ></div>
      );
    }
  }

  return (
    <div className="map-container">
      <div
        className="grid-layout"
        style={{
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
        }}
      >
        {gridCells}
      </div>
    </div>
  );
};

export default MapVieww;