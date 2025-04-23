// controllers/auth.controller.js

import asyncHandler from 'express-async-handler';
import generateToken from '../utils/generateToken.js'; // Your token generation utility
import UserModel from '../models/user.model.js';
import QuestionModel from '../models/Questions.model.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, phoneNumber, role } = req.body; // Allow role override if needed, otherwise default works

    // Basic validation
    if (!name || !email || !password || !phoneNumber) {
        res.status(400); // Bad Request
        throw new Error('Please provide name, email, password, and phone number');
    }

    // Check if user already exists
    const userExists = await UserModel.findOne({ email });

    if (userExists) {
        res.status(400); // Bad Request
        throw new Error('User already exists with this email');
    }

    const FirstQuestion = await QuestionModel.findOne({ sequenceNumber: 1 }); // Get the first question for the user

    console.log(FirstQuestion); // Debugging line to check if the first question is fetched correctly

    // Create new user (password hashing handled by pre-save hook in model)
    const user = await UserModel.create({
        name,
        email,
        password, // Send plain password, hashing happens before save
        phoneNumber,
        currentQuestion: FirstQuestion._id, // Set the first question as the current question
        currentSequenceNumber: 1, // Start at sequence 1
        role: role && ['admin', 'user'].includes(role) ? role : 'user' // Use provided role if valid, else default
    });

    if (user) {
        // Generate token and set cookie
        generateToken(res, { _id: user._id, role: user.role }); // Pass user details needed for token payload

        // Send back user info (excluding password)
        res.status(201).json({ // 201 Created
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phoneNumber: user.phoneNumber,
            message: "Registration successful"
        });
    } else {
        res.status(400); // Bad Request
        throw new Error('Invalid user data'); // Should ideally not happen if validation passes
    }
});

/**
 * @desc    Authenticate user & get token (Login)
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        res.status(400);
        throw new Error('Please provide email and password');
    }

    // Find user by email - IMPORTANT: select password explicitly as it's excluded by default
    const user = await UserModel.findOne({ email }).select('+password');

    // Check if user exists AND password matches
    if (user && (await user.matchPassword(password))) {
        // Generate token and set cookie
        generateToken(res, { _id: user._id, role: user.role });

        // Send back user info (excluding password)
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phoneNumber: user.phoneNumber,
            message: "Login successful"
        });
    } else {
        res.status(401); // Unauthorized
        throw new Error('Invalid email or password');
    }
});

/**
 * @desc    Logout user / clear cookie
 * @route   POST /api/auth/logout
 * @access  Private (requires user to be logged in)
 */
const logoutUser = asyncHandler(async (req, res) => {
    // Clear the JWT cookie
    res.cookie('jwt', '', {
        httpOnly: true,
        secure: true, // Match the secure setting in generateToken
        sameSite: 'None', // Match the sameSite setting in generateToken
        expires: new Date(0), // Set expiry date to the past
    });

    res.status(200).json({ success: true, message: 'Logged out successfully' });
});

/**
 * @desc    Get user profile
 * @route   GET /api/auth/profile
 * @access  Private (requires user to be logged in via 'verify' middleware)
 */
const getUserProfile = asyncHandler(async (req, res) => {
    // req.user is attached by the 'verify' middleware
    const user = await UserModel.findById(req.user._id).select('-password'); // Exclude password

    if (user) {
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phoneNumber: user.phoneNumber,
            questionsDone: user.questionsDone, // Include progress if needed
            currentQuestion: user.currentQuestion,
            isHuntCompleted: user.isHuntCompleted,
        });
    } else {
        // This case should technically be handled by 'verify' middleware already
        res.status(404);
        throw new Error('User not found');
    }
});

// Optional: Update user profile (add later if needed)
// const updateUserProfile = asyncHandler(async (req, res) => { ... });


export {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
};