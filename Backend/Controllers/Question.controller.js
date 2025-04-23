// controllers/game.controller.js

import asyncHandler from 'express-async-handler';
import QuestionModel from '../models/Questions.model.js';
import UserModel from '../models/user.model.js';
import mongoose from 'mongoose';
/**
 * @desc    Start the treasure hunt for the logged-in user
 * @route   POST /api/game/start
 * @access  Private (User must be logged in)
 */
const startHunt = asyncHandler(async (req, res) => {
    const userId = req.user.id; // Assuming auth middleware adds user object to req

    const user = await UserModel.findById(userId);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Optional: Check if hunt is already completed or in progress
    if (user.isHuntCompleted) {
        return res.status(400).json({ message: 'Hunt already completed. Reset if needed.' });
    }
    // Decide if starting again should reset progress or just return current state
     if (user.currentQuestion) {
         // If already started, maybe just return the current question info?
         // Or allow reset: Uncomment below to reset progress on /start
         /*
         user.questionsDone = [];
         user.isHuntCompleted = false;
         */
         // For now, let's prevent restarting if already in progress without explicit reset logic
          const currentQuestionData = await QuestionModel.findById(user.currentQuestion);
          if (currentQuestionData) {
             return res.status(200).json({
                 message: 'Hunt already in progress.',
                 nextQuestionData: {
                     _id: currentQuestionData._id,
                     question: currentQuestionData.question, // Send only necessary fields
                     geolocation: currentQuestionData.geolocation,
                     // title: currentQuestionData.title // Optional
                 },
                 isHuntCompleted: false,
             });
          } else {
             // Data inconsistency: user has a currentQuestion ID that doesn't exist
             user.currentQuestion = null; // Clear the invalid reference
             // continue to find the first question...
          }
     }


    // Find the first question (sequenceNumber 1)
    const firstQuestion = await QuestionModel.findOne({ sequenceNumber: 1 });

    if (!firstQuestion) {
        res.status(404);
        throw new Error('Treasure hunt setup incomplete: First question not found.');
    }

    // Update user's state
    user.currentQuestion = firstQuestion._id;
    user.questionsDone = []; // Ensure progress is reset if starting fresh
    user.isHuntCompleted = false;
    await user.save();

    res.status(200).json({
        message: 'Hunt started!',
        // Send relevant data for the first question
        nextQuestionData: {
            _id: firstQuestion._id,
            question: firstQuestion.question, // Send only necessary fields
            geolocation: firstQuestion.geolocation,
            // title: firstQuestion.title // Optional
        },
        isHuntCompleted: false,
    });
});


/**
 * @desc    Check the user's answer for their current question
 * @route   POST /api/game/check-answer
 * @access  Private (User must be logged in)
 */
const checkAnswer = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { userAnswer } = req.body;

    if (!userAnswer || typeof userAnswer !== 'string' || userAnswer.trim() === '') {
        res.status(400);
        throw new Error('Please provide an answer.');
    }

    const user = await UserModel.findById(userId);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.isHuntCompleted) {
        return res.status(400).json({ success: false, message: 'You have already completed the hunt!' });
    }

    if (!user.currentQuestion) {
        res.status(400);
        throw new Error('Hunt not started or current question unknown. Please start the hunt first.');
    }

    // Fetch the details of the user's current question
    const currentQuestionDoc = await QuestionModel.findById(user.currentQuestion);

    if (!currentQuestionDoc) {
        // Data integrity issue, the user's current question doesn't exist
        user.currentQuestion = null; // Attempt to fix state
        await user.save();
        res.status(500); // Internal server error reflects data issue
        throw new Error('Current question data not found. Please try starting the hunt again.');
    }

    // --- Compare the submitted answer with the correct answer ---
    const correctAnswer = currentQuestionDoc.answer;
    const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

    if (isCorrect) {
        // --- Answer is Correct ---

        // Add the just-completed question to the user's done list
        user.questionsDone.push({ question: user.currentQuestion });

        // Determine the next question ID
        const nextQuestionId = currentQuestionDoc.nextQuestion; // This can be null

        let nextQuestionData = null;
        if (nextQuestionId) {
            // Fetch the details of the *next* question to send back
            const nextQuestionDoc = await QuestionModel.findById(nextQuestionId);
            if (nextQuestionDoc) {
                 nextQuestionData = {
                    _id: nextQuestionDoc._id,
                    question: nextQuestionDoc.question,
                    geolocation: nextQuestionDoc.geolocation,
                    // title: nextQuestionDoc.title // Optional
                };
                user.currentQuestion = nextQuestionId; // Update user's current question
            } else {
                // Data integrity issue: nextQuestion points to non-existent question
                console.error(`Data Integrity Error: Question ${currentQuestionDoc._id} nextQuestion points to non-existent ID ${nextQuestionId}`);
                user.currentQuestion = null; // Halt progress
                user.isHuntCompleted = true; // Or handle as an error state
                // Decide how to handle this - maybe mark hunt as "stuck" or complete prematurely?
                // For now, we'll treat it like the end of the hunt.
            }
        } else {
            // This was the last question
            user.currentQuestion = null;
            user.isHuntCompleted = true;
        }

        // Save the updated user state
        await user.save();

        // Send success response
        res.status(200).json({
            success: true,
            message: 'Correct!',
            isHuntCompleted: user.isHuntCompleted,
            nextQuestionData: nextQuestionData // This will be null if the hunt is completed
        });

    } else {
        // --- Answer is Incorrect ---
        res.status(400).json({ // Use 400 Bad Request to indicate incorrect input/answer
            success: false,
            message: 'Incorrect answer. Please try again.',
        });
    }
});

/**
 * @desc    Get the current game state for the logged-in user
 * @route   GET /api/game/state
 * @access  Private (User must be logged in)
 */
const getCurrentState = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Fetch user and populate the currentQuestion field in one go
    const user = await UserModel.findById(userId).populate({
        path: 'currentQuestion',
        select: 'question geolocation title _id hint' // Select only needed fields from Question
    });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    let responseData = {
        isHuntStarted: !!user.currentQuestion || user.isHuntCompleted,
        isHuntCompleted: user.isHuntCompleted,
        currentQuestionData: null,
        questionsDoneCount: user.questionsDone?.length || 0 // Safely access length
    };

    if (user.isHuntCompleted) {
        responseData.message = "Hunt completed!";
    } else if (user.currentQuestion) {
        // user.currentQuestion is now the populated Question object
        responseData.message = "Hunt in progress.";
        responseData.currentQuestionData = user.currentQuestion; // Contains _id, question, geolocation, title
    } else {
        responseData.message = "Hunt not started yet.";
    }

    res.status(200).json(responseData);
});


// controllers/question.controller.jsmodels are exported from index.js

// --- Helper Function (Optional but Recommended) ---
const  findPreviousQuestion = async (sequenceNumber) => {
    if (sequenceNumber <= 1) {
        return null; // No previous question for sequence 1
    }
    return await QuestionModel.findOne({ sequenceNumber: sequenceNumber - 1 });
};

// --- Controller Functions ---

/**
 * @desc    Create a new question
 * @route   POST /api/questions
 * @access  Private/Admin
 */
const createQuestion = asyncHandler(async (req, res) => {
    const {
        title,
        question,
        answer,
        longitude, // Expecting longitude and latitude separately for ease of use
        latitude,
        link,
        sequenceNumber,
        hint
    } = req.body;

    // Basic Validation
    if (!question || !answer || longitude === undefined || latitude === undefined || sequenceNumber === undefined) {
        res.status(400);
        throw new Error('Missing required fields: question, answer, longitude, latitude, sequenceNumber');
    }

    if (isNaN(parseFloat(longitude)) || isNaN(parseFloat(latitude)) || isNaN(parseInt(sequenceNumber))) {
         res.status(400);
         throw new Error('Longitude, latitude, and sequenceNumber must be valid numbers.');
    }

    // Check if sequence number already exists
    const sequenceExists = await QuestionModel.findOne({ sequenceNumber });
    if (sequenceExists) {
        res.status(400);
        throw new Error(`Question with sequence number ${sequenceNumber} already exists.`);
    }

    // --- Handle Linking ---
    // Find the question that *should* come before this new one
    const prevQuestion = await findPreviousQuestion(sequenceNumber);
    let nextQuestionIdForPrev = null; // This will be the ID of the *new* question

    const newQuestion = new QuestionModel({
        title,
        question,
        answer,
        geolocation: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)], // Ensure correct order [lng, lat]
        },
        sequenceNumber: parseInt(sequenceNumber),
        // New question initially points to whatever the previous question *used* to point to
        nextQuestion: prevQuestion ? prevQuestion.nextQuestion : null,
        link, // Optional: Add link if provided
        hint, // Optional: Add hint if provided
    });

    const createdQuestion = await newQuestion.save();
    nextQuestionIdForPrev = createdQuestion._id;

    // Now, update the 'nextQuestion' of the previous question, if it exists
    if (prevQuestion) {
        prevQuestion.nextQuestion = nextQuestionIdForPrev;
        await prevQuestion.save();
    }
    // --- Linking Handled ---


    res.status(201).json(createdQuestion);
});


/**
 * @desc    Get all questions, sorted by sequence number
 * @route   GET /api/questions
 * @access  Public or Private/Admin (adjust middleware accordingly)
 */
const getAllQuestions = asyncHandler(async (req, res) => {
    // Sort by sequence number by default
    const questions = await QuestionModel.find({}).sort({ sequenceNumber: 'asc' });
    res.status(200).json(questions);
});

/**
 * @desc    Get the first question of the hunt
 * @route   GET /api/questions/first
 * @access  Public or Private/User
 */
const getFirstQuestion = asyncHandler(async (req, res) => {
    const firstQuestion = await QuestionModel.findOne({ sequenceNumber: 1 });

    if (firstQuestion) {
        res.status(200).json(firstQuestion);
    } else {
        res.status(404);
        throw new Error('First question (sequence number 1) not found.');
    }
});

/**
 * @desc    Get a single question by ID
 * @route   GET /api/questions/:id
 * @access  Public or Private/Admin
 */
const getQuestionById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error('Invalid question ID format');
    }

    const question = await QuestionModel.findById(id);

    if (question) {
        res.status(200).json(question);
    } else {
        res.status(404);
        throw new Error('Question not found');
    }
});

/**
 * @desc    Update a question by ID
 * @route   PUT /api/questions/:id
 * @access  Private/Admin
 */
const updateQuestion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, question, answer, longitude, latitude, nextQuestion } = req.body; // Avoid updating sequenceNumber directly here easily

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error('Invalid question ID format');
    }

    const existingQuestion = await QuestionModel.findById(id);

    if (!existingQuestion) {
        res.status(404);
        throw new Error('Question not found');
    }

    // Update fields if provided
    existingQuestion.title = title ?? existingQuestion.title;
    existingQuestion.question = question ?? existingQuestion.question;
    existingQuestion.answer = answer ?? existingQuestion.answer;

    // Update geolocation if both coordinates are provided
    if (longitude !== undefined && latitude !== undefined) {
       if (isNaN(parseFloat(longitude)) || isNaN(parseFloat(latitude))) {
            res.status(400);
            throw new Error('Invalid longitude or latitude for update.');
       }
        existingQuestion.geolocation.coordinates = [parseFloat(longitude), parseFloat(latitude)];
    }

    // Allow manual update of nextQuestion link if provided (use with caution)
     if (nextQuestion !== undefined) {
        if (nextQuestion === null || mongoose.Types.ObjectId.isValid(nextQuestion)) {
             existingQuestion.nextQuestion = nextQuestion; // Can be null or valid ObjectId
        } else if (nextQuestion) { // if it's not null and not valid ObjectId
             res.status(400);
             throw new Error('Invalid nextQuestion ID format provided for update.');
        }
     }

    // Note: Updating sequenceNumber here is complex as it requires potentially
    // re-linking multiple questions. It's often better handled by deleting
    // and recreating or having a dedicated "reorder" endpoint/logic.

    const updatedQuestion = await existingQuestion.save();
    res.status(200).json(updatedQuestion);
});

/**
 * @desc    Delete a question by ID
 * @route   DELETE /api/questions/:id
 * @access  Private/Admin
 */
const deleteQuestion = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400);
        throw new Error('Invalid question ID format');
    }

    const questionToDelete = await QuestionModel.findById(id);

    if (!questionToDelete) {
        res.status(404);
        throw new Error('Question not found');
    }

    // --- Re-link the chain before deleting ---
    const prevQuestion = await findPreviousQuestion(questionToDelete.sequenceNumber);

    if (prevQuestion) {
        // Make the previous question point to whatever the deleted question was pointing to
        prevQuestion.nextQuestion = questionToDelete.nextQuestion;
        await prevQuestion.save();
    }
    // --- Chain re-linked ---

    await QuestionModel.deleteOne({ _id: id }); // Or questionToDelete.deleteOne()

    res.status(200).json({ message: `Question ${id} deleted successfully.` });
    // NOTE: Deleting a question *invalidates* its original sequence number.
    // You might need a subsequent process to re-number sequences if gaps are not allowed.
});


const getCurrentSequenceQuestion = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id; // Assuming auth middleware adds user object to req

    const user = await UserModel.findById(userId);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const sequenceNumber = user.currentSequenceNumber;

    if(user.isHuntCompleted){
        return res.status(200).json({ 
            success: true, 
            message: 'You have already completed the hunt!' ,
            isHuntCompleted: user.isHuntCompleted
        });
    }
    const currentQuestion = await QuestionModel.findOne({ sequenceNumber });

    if (!currentQuestion) {
        res.status(404);
        throw new Error('Current question not found');
    }

    res.status(200).json({
        message: 'Current question retrieved successfully',
        currentQuestion: {
            _id: currentQuestion._id,
            question: currentQuestion.question,
            geolocation: currentQuestion.geolocation,
            title: currentQuestion.title, // Optional
            hint: currentQuestion.hint, // Optional
        },
        isHuntCompleted: user.isHuntCompleted,
    });
  } catch (error) {
    console.error('Error fetching current sequence question:', error);
    res.status(500).json({ message: 'Internal server error' });
    
  }
}
);

const checkAnswerCurrent = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id; // Assuming auth middleware adds user object to req
    const { userAnswer } = req.body;
   

    const user = await UserModel.findById(userId);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.isHuntCompleted) {
        return res.status(400).json({ success: false, message: 'You have already completed the hunt!' });
    }

    if (!user.currentQuestion) {
        res.status(400);
        throw new Error('Hunt not started or current question unknown. Please start the hunt first.');
    }
    // Fetch the details of the user's current question

    const question = await QuestionModel.findById(user.currentQuestion);
    if (!question) {
        // Data integrity issue, the user's current question doesn't exist
        return res.status(404).json({ success: false, message: 'Current question data not found. Please try starting the hunt again.' });
    }

    
    // --- Compare the submitted answer with the correct answer ---
    const correctAnswer = question.answer;

    const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

    if (isCorrect) {
        // --- Answer is Correct ---

        // Add the just-completed question to the user's done list
        user.questionsDone.push({ question: user.currentQuestion });

        // Determine the next question ID
        const nextQuestionId = question.nextQuestion; // This can be null

        let nextQuestionData = null;
        if (nextQuestionId) {
            // Fetch the details of the *next* question to send back
            const nextQuestionDoc = await QuestionModel.findById(nextQuestionId);
            if (nextQuestionDoc) {
                 nextQuestionData = {
                    _id: nextQuestionDoc._id,
                    question: nextQuestionDoc.question,
                    geolocation: nextQuestionDoc.geolocation,
                    title: nextQuestionDoc.title, // Optional
                    hint: nextQuestionDoc.hint, // Optional
                };
                user.currentSequenceNumber = nextQuestionDoc.sequenceNumber; // Update user's current question
                user.currentQuestion = nextQuestionId; // Update user's current question
            } else {
                // Data integrity issue: nextQuestion points to non-existent question
                console.error(`Data Integrity Error: Question ${question._id} nextQuestion points to non-existent ID ${nextQuestionId}`);
                user.currentQuestion = null; // Halt progress
                user.isHuntCompleted = true; // Or handle as an error state
                // Decide how to handle this - maybe mark hunt as "stuck" or complete prematurely?
                // For now, we'll treat it like the end of the hunt.
            }
        } else {
            // This was the last question
            user.currentQuestion = null;
            user.isHuntCompleted = true;
        }

        // Save the updated user state
        await user.save();

        // Send success response
        res.status(200).json({
            success: true,
            message: 'Correct!',
            isHuntCompleted: user.isHuntCompleted,
            nextQuestionData: nextQuestionData // This will be null if the hunt is completed
        });

    }else{
        // --- Answer is Incorrect ---
        res.status(400).json({ // Use 400 Bad Request to indicate incorrect input/answer
            success: false,
            message: 'Incorrect answer. Please try again.',
        });
    }
}catch (error) {
    console.error('Error checking answer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


const addNextQuestion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { nextQuestionId } = req.body; // Expecting the ID of the next question

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(nextQuestionId)) {
        res.status(400);
        throw new Error('Invalid question ID format');
    }

    const question = await QuestionModel.findById(id);
    const nextQuestion = await QuestionModel.findById(nextQuestionId);

    if (!question || !nextQuestion) {
        res.status(404);
        throw new Error('Question or next question not found');
    }

    // Update the nextQuestion field of the current question
    question.nextQuestion = nextQuestionId;
    await question.save();

    return res.status(200).json({
        message: `Next question for ${question._id} updated successfully.`,
        question: {
            _id: question._id,
            question: question.question,
            geolocation: question.geolocation,
            title: question.title, // Optional
            hint: question.hint, // Optional
        },
    });

});




// Export the controller functions
export {
    startHunt,
    checkAnswer,
    getCurrentState,
    createQuestion,
    getAllQuestions,
    getFirstQuestion,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    getCurrentSequenceQuestion,
    checkAnswerCurrent,
    addNextQuestion
};