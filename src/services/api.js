// src/services/api.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { useSelector } from "react-redux";

// Replace with your actual backend URL
const API_BASE_URL = '/api';

// --- Dummy Data for sequential clues ---
// In a real backend, this would query based on sequence or previous clue ID
const clues = [
    { id: 'clue1', latitude: 30.3517, longitude: 76.3598, hint: "Seek the lions guarding knowledge.", question: "How many lions stand sentinel?", nextClueId: 'clue2' },
    { id: 'clue2', latitude: 40.7614, longitude: -73.9776, hint: "Where world stages meet glittering cascades.", question: "What famous plaza features a golden statue?", nextClueId: 'clue3' },
    { id: 'clue3', latitude: 40.7484, longitude: -73.9857, hint: "A towering spire that once ruled the sky.", question: "What animal 'climbed' this building in a famous movie?", nextClueId: null } // Last clue
];
let currentClueIndex = 0; // Simple state for dummy backend


export const fetchClue = async (clueId = null) => {
    console.log(`API: Fetching clue (requested ID: ${clueId})`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // --- Dummy Backend Logic ---
    let clueData;
    if (clueId === null) { // Fetch the first clue
        currentClueIndex = 0;
        clueData = clues[currentClueIndex];
    } else {
        const currentIndex = clues.findIndex(c => c.id === clueId);
        const nextId = clues[currentIndex]?.nextClueId;
        if (nextId) {
            const nextIndex = clues.findIndex(c => c.id === nextId);
            if (nextIndex !== -1) {
                currentClueIndex = nextIndex;
                clueData = clues[currentClueIndex];
            } else {
                 console.error(`API Error: Next clue ID '${nextId}' not found.`);
                 throw new Error(`Invalid next clue ID specified.`);
            }
        } else {
             // This was the last clue, signal game over by returning null data or specific flag
             console.log("API: No next clue found, likely end of game.");
             return null; // Signal end of clues
        }
    }

    if (!clueData) {
        throw new Error("Clue not found.");
    }

    console.log("API: Returning clue:", clueData);
    return clueData;


    // --- Real Backend Logic (Example) ---
    /*
    try {
        let url = `${API_BASE_URL}/clues/`;
        url += clueId ? `next/${clueId}` : 'start'; // Endpoint determines start or next

        const response = await fetch(url);
        if (!response.ok) {
             if (response.status === 404) { // Handle end of game or not found
                 return null; // Or throw specific error
             }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!data || !data.id) { // Check if valid clue data returned
            return null; // Handle case where backend signals end-of-game with empty/null response
        }
        return data;
    } catch (error) {
        console.error("API Fetch Error:", error);
        throw error; // Re-throw to be caught by GameManager
    }
    */
};

const QUESTIONS_URL = `http://localhost:5000/api/questions`;

export const apiSlice = createApi({
  // ...existing baseQuery and tagTypes...
  endpoints: (builder) => ({
    // --- Auth Endpoints (Keep existing ones) ---
    login: builder.mutation({
      // ... existing login definition
    }),
    logout: builder.mutation({
      // ... existing logout definition
    }),
    register: builder.mutation({
      // ... existing register definition
    }),
    getProfile: builder.query({
     // ... existing getProfile definition
    }),

    // --- Question Admin CRUD Endpoints ---
    createQuestion: builder.mutation({
      query: (data) => ({
        url: `${QUESTIONS_URL}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Question'], // Invalidate cache after creating
    }),
    getAllQuestions: builder.query({
      query: () => `${QUESTIONS_URL}`,
      providesTags: (result = [], error, arg) => [
        'Question',
        ...result.map(({ _id }) => ({ type: 'Question', id: _id })),
      ],
      keepUnusedDataFor: 5, // Keep data for 5 seconds after last subscriber
    }),
    getQuestionById: builder.query({
      query: (id) => `${QUESTIONS_URL}/${id}`,
      providesTags: (result, error, id) => [{ type: 'Question', id }],
    }),
    updateQuestion: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${QUESTIONS_URL}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Question', id }, 'Question'],
    }),
    deleteQuestion: builder.mutation({
      query: (id) => ({
        url: `${QUESTIONS_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Question'],
    }),
    addNextQuestionLink: builder.mutation({
        query: ({ id, nextQuestionId }) => ({
            url: `${QUESTIONS_URL}/addNext/${id}`,
            method: 'POST',
            body: { nextQuestionId }, // Send the next ID in the body
        }),
        invalidatesTags: (result, error, { id }) => [{ type: 'Question', id }, 'Question'],
    }),
    getFirstQuestionAdmin: builder.query({ // Specific admin endpoint if needed
        query: () => `${QUESTIONS_URL}/first`,
        providesTags: (result, error, arg) => result ? [{ type: 'Question', id: result._id }] : [],
    }),

    // --- User Gameplay Endpoints ---
    startHunt: builder.mutation({
      query: () => ({
        url: `${QUESTIONS_URL}/start`,
        method: 'POST',
      }),
      // Potentially invalidate user state or game state tags if you have them
      // invalidatesTags: ['GameState'],
    }),
    getCurrentGameState: builder.query({
      query: () => `${QUESTIONS_URL}/current`,
      // providesTags: ['GameState'], // Tag for caching game state
    }),
    checkAnswer: builder.mutation({
      query: (data) => ({
        url: `${QUESTIONS_URL}/check`,
        method: 'POST',
        body: data, // Expects { userAnswer: "..." }
      }),
      // invalidatesTags: ['GameState'], // Update game state after checking
    }),
    getCurrentSequenceQuestion: builder.query({
        query: () => `${QUESTIONS_URL}/currentSequence`,
        // providesTags: ['GameState'], // Tag for caching current AR question state
    }),
    checkAnswerCurrentSequence: builder.mutation({
        query: (data) => ({
            url: `${QUESTIONS_URL}/checkCurrent`,
            method: 'POST',
            body: data, // Expects { userAnswer: "..." }
        }),
        // invalidatesTags: ['GameState'], // Update game state after checking AR answer
    }),

  }),
});

// Export hooks for usage in components
export const {
  // --- Existing Auth Hooks ---
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
  useGetProfileQuery,

  // --- Question Admin Hooks ---
  useCreateQuestionMutation,
  useGetAllQuestionsQuery,
  useGetQuestionByIdQuery,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useAddNextQuestionLinkMutation,
  useGetFirstQuestionAdminQuery,

  // --- User Gameplay Hooks ---
  useStartHuntMutation,
  useGetCurrentGameStateQuery,
  useCheckAnswerMutation,
  useGetCurrentSequenceQuestionQuery,
  useCheckAnswerCurrentSequenceMutation,

} = apiSlice;