import mongoose from "mongoose";
import bcrypt from "bcryptjs";


// --- Completed Question Subdocument Schema (for User) ---
// Simplified: Tracks which question was done and when.
const completedQuestionSchema = new mongoose.Schema(
    {
      question: { // Reference to the Question document
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: true,
      },
      // No need for 'user' field - it's part of the parent User doc.
      // No need for 'answer' field here if we only track correct completions.
    },
    {
      timestamps: { createdAt: 'completedAt', updatedAt: false }, // Record when it was completed
      _id: false // Often not needed for simple embedded arrays unless explicitly required
    }
  );
  
  
  // --- User Schema ---
  const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/.+\@.+\..+/, 'Please fill a valid email address'] // Basic email format validation
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false // Exclude password from query results by default
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    phoneNumber: { // Consider validation based on expected format
      type: String,
      // required: [true, 'Phone number is required'], // Make optional if desired
      trim: true,
    },
    questionsDone: [completedQuestionSchema], // Array of completed questions
  
    currentQuestion: { // The *next* question the user needs to find/answer
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      default: null // Starts as null, set to the first question on hunt start
    },
  
    isHuntCompleted: { // Flag to easily check if the user finished the entire hunt
        type: Boolean,
        default: false,
    }
  
  }, { timestamps: true }); // Adds createdAt, updatedAt for the user
  
  // --- User Middleware & Methods ---
  
  // Hash password before saving
  userSchema.pre("save", async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified("password")) return next();
  
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error); // Pass error to the next middleware/handler
    }
  });
  
  // Method to compare entered password with hashed password
  userSchema.methods.matchPassword = async function (enteredPassword) {
    // Ensure the password field was selected if needed (e.g., during login)
    if (!this.password) {
        // Fetch the user again including the password field if it was excluded
        const userWithPassword = await this.constructor.findById(this._id).select('+password').exec();
        if (!userWithPassword) return false; // Should not happen if 'this' exists, but safety check
        this.password = userWithPassword.password; // Temporarily assign for comparison
    }
     if (!this.password) return false; // If still no password (e.g., new unsaved user), cannot compare
    return await bcrypt.compare(enteredPassword, this.password);
  };
  
  const UserModel = mongoose.model("User", userSchema);
  export default UserModel;