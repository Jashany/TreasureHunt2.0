// routes/question.routes.js

import express from 'express';
import {
    createQuestion,
    getAllQuestions,
    getFirstQuestion,
    getQuestionById,
    startHunt,
    getCurrentState,
    checkAnswer,
    updateQuestion,
    deleteQuestion,
    getCurrentSequenceQuestion,
    checkAnswerCurrent,
    addNextQuestion
} from '../Controllers/Question.controller.js'; // Adjust path as needed
import { verify,roleAuthorization } from '../middlewares/authentication.js';
const router = express.Router();

// --- Public or User Routes ---

router.post(
    '/checkCurrent',
    verify, // User must be logged in
    checkAnswerCurrent // Check the answer for the current question (for AR view)
);

router.get(
    '/currentSequence',
    verify, // User must be logged in
    getCurrentSequenceQuestion // Get the current sequence question for the user
);

// Get the very first question (sequence 1) - Needs login to participate
// NOTE: getFirstQuestion was originally designed for admin/setup,
// but the game logic controller (game.controller.js -> startHunt) now handles finding the first question for the user.
// This route could be kept for admin purposes or removed if redundant.
// Let's keep it for admin view for now.
router.get(
    '/first',
    verify, // User must be logged in
    roleAuthorization(['admin']), // Only admin can use this specific endpoint now
    getFirstQuestion
);


// --- Admin Only Routes ---

// POST /api/questions - Create a new question
router.post(
    '/',
    // verify,                 // Must be logged in
    // roleAuthorization(['admin']), // Must be an admin
    createQuestion
);

// GET /api/questions - Get all questions (Admin view)
router.get(
    '/',
    verify,
    roleAuthorization(['admin']), // Only Admins can get the full list
    getAllQuestions
);


// GET /api/questions/:id - Get a single question by ID (Admin view)
// IMPORTANT: Place specific routes like '/first' BEFORE parameterized routes like '/:id'
router.get(
    '/:id',
    verify,
    roleAuthorization(['admin']), // Only Admins can get any question by ID
    getQuestionById
);

// PUT /api/questions/:id - Update a question
router.put(
    '/:id',
    verify,
    roleAuthorization(['admin']),
    updateQuestion
);

// DELETE /api/questions/:id - Delete a question
router.delete(
    '/:id',
    verify,
    roleAuthorization(['admin']),
    deleteQuestion
);

// --- User Routes ---

// POST /api/questions/start - Start the hunt (get the first question for the user)

router.post(
    '/start',
    verify, // User must be logged in
    startHunt // Start the hunt for the user
);

// GET /api/questions/current - Get the current question for the user

router.get(
    '/current',
    verify, // User must be logged in
    getCurrentState // Get the current question for the user
);

// POST /api/questions/check - Check the answer for the current question

router.post(
    '/check',
    verify, // User must be logged in
    checkAnswer // Check the answer for the current question
);

// POST /api/questions/checkCurrent - Check the answer for the current question (for AR view)


// GET /api/questions/currentSequence - Get the current sequence question for the user



// POST /api/questions/addNext - Add the next question in the sequence

router.post(
'/addNext/:id',
    // verify, // User must be logged in
    addNextQuestion // Add the next question in the sequence
);


export default router;