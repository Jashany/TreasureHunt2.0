import mongoose from "mongoose";

// --- Question Schema ---
const questionSchema = new mongoose.Schema({
    title: { // Optional: A short title for admin UI or context
        type: String,
        trim: true,
    },
    question: { // The actual question text
        type: String,
        required: [true, 'Question text is required'],
        trim: true,
    },
    answer: { // The correct answer (case-insensitive comparison might be needed in logic)
        type: String,
        required: [true, 'Answer is required'],
        trim: true,
    },
    geolocation: { // GeoJSON point for the question's location
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: { // [longitude, latitude]
            type: [Number],
            required: [true, 'Coordinates are required'],
            index: '2dsphere' // Crucial for geospatial queries (finding nearby questions)
        }
    },
    sequenceNumber: { // Defines the order of questions in the hunt
        type: Number,
        required: [true, 'Sequence number is required for ordering'],
        unique: true, // Ensures each question has a unique position
        index: true,  // Good practice to index fields used for lookups/sorting
    },
    nextQuestion: { // Reference to the *next* question in the sequence
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        default: null // The last question will have null here
    },
    // Optional: Add fields for AR model hints if needed later
    // arModelHint: String,
    // arModelScale: Number,
}, { timestamps: true }); // Adds createdAt, updatedAt

// Create the geospatial index explicitly (alternative to defining in schema)
// questionSchema.index({ geolocation: '2dsphere' }); // Already defined inline above

const QuestionModel = mongoose.model("Question", questionSchema);
export default QuestionModel;