import React, { useState, useEffect } from "react";
import "./Admin.css"; // Create or use an existing CSS file for styling

// Define the base URL for the API
const API_BASE_URL = "https://treasure-api.jsondev.in//api/questions"; // Adjust if your backend runs elsewhere

const Admin = () => {
  // --- Component State ---
  const [questions, setQuestions] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Combined loading state for create/update
  const [submitError, setSubmitError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState(null);

  const initialFormState = {
    title: "",
    question: "",
    answer: "",
    longitude: "",
    latitude: "",
    sequenceNumber: "",
    hint: "",
    link: "", // Optional link field
  };
  const [formData, setFormData] = useState(initialFormState);
  const [editingQuestion, setEditingQuestion] = useState(null); // Holds the question object being edited
  const [linkData, setLinkData] = useState({ currentId: "", nextId: "" });

  // --- Fetch Function ---
  const fetchQuestions = async () => {
    setIsLoadingQuestions(true);
    setQuestionsError(null);
    try {
      const response = await fetch(API_BASE_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Send cookies
      });
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: response.statusText }));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
      setQuestionsError(error.message);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // --- Effects ---
  // Fetch questions on component mount
  useEffect(() => {
    fetchQuestions();
  }, []);

  // Populate edit form when editingQuestion changes
  useEffect(() => {
    if (editingQuestion) {
      setFormData({
        title: editingQuestion.title || "",
        question: editingQuestion.question || "",
        answer: editingQuestion.answer || "",
        longitude:
          editingQuestion.geolocation?.coordinates[0]?.toString() || "",
        latitude: editingQuestion.geolocation?.coordinates[1]?.toString() || "",
        sequenceNumber: editingQuestion.sequenceNumber?.toString() || "",
        hint: editingQuestion.hint || "",
        link: editingQuestion.link || "",
      });
    } else {
      setFormData(initialFormState); // Reset form when not editing
    }
  }, [editingQuestion]);

  // --- Event Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLinkChange = (e) => {
    const { name, value } = e.target;
    setLinkData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    const payload = {
      ...formData,
      longitude: parseFloat(formData.longitude),
      latitude: parseFloat(formData.latitude),
      sequenceNumber: parseInt(formData.sequenceNumber, 10),
    };

    if (
      isNaN(payload.longitude) ||
      isNaN(payload.latitude) ||
      isNaN(payload.sequenceNumber)
    ) {
      alert("Longitude, Latitude, and Sequence Number must be valid numbers.");
      setIsSubmitting(false);
      return;
    }

    const url = editingQuestion
      ? `${API_BASE_URL}/${editingQuestion._id}`
      : API_BASE_URL;
    const method = editingQuestion ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Send cookies
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: response.statusText }));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      // Success
      setFormData(initialFormState); // Reset form
      setEditingQuestion(null); // Exit edit mode
      fetchQuestions(); // Refresh the questions list
    } catch (err) {
      console.error("Failed to save question:", err);
      setSubmitError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    window.scrollTo(0, 0); // Scroll to top to see the form
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
    setFormData(initialFormState);
    setSubmitError(null); // Clear any previous submit errors
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this question? This might break the sequence."
      )
    ) {
      setIsDeleting(true);
      setDeleteError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Send cookies
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: response.statusText }));
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }
        fetchQuestions(); // Refresh list
      } catch (err) {
        console.error("Failed to delete question:", err);
        setDeleteError(err.message);
        alert(`Error: ${err.message}`);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    if (!linkData.currentId || !linkData.nextId) {
      alert(
        "Please select both the current question and the next question to link."
      );
      return;
    }
    if (linkData.currentId === linkData.nextId) {
      alert("Cannot link a question to itself.");
      return;
    }

    setIsLinking(true);
    setLinkError(null);
    const url = `${API_BASE_URL}/addNext/${linkData.currentId}`; // Use the correct endpoint

    try {
      const response = await fetch(url, {
        method: "POST", // Or PUT, depending on your backend route definition
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Send cookies
        body: JSON.stringify({ nextQuestionId: linkData.nextId }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: response.statusText }));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      setLinkData({ currentId: "", nextId: "" }); // Reset form
      fetchQuestions(); // Refresh list to show updated links (if displayed)
      alert("Questions linked successfully!");
    } catch (err) {
      console.error("Failed to link questions:", err);
      setLinkError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setIsLinking(false);
    }
  };

  // --- Render Logic ---
  return (
    <div className="admin-panel">
      <h1>Admin - Manage Treasure Hunt Questions</h1>

      {/* --- Create/Edit Form --- */}
      <form onSubmit={handleSubmit} className="question-form">
        <h2>{editingQuestion ? "Edit Question" : "Create New Question"}</h2>
        {submitError && <p className="error">Error: {submitError}</p>}

        <div className="form-grid">
          <input
            type="text"
            name="title"
            placeholder="Title (Optional)"
            value={formData.title}
            onChange={handleInputChange}
          />
          <input
            type="number"
            name="sequenceNumber"
            placeholder="Sequence Number*"
            value={formData.sequenceNumber}
            onChange={handleInputChange}
            required
          />
          <textarea
            name="question"
            placeholder="Question Text*"
            value={formData.question}
            onChange={handleInputChange}
            required
            rows={3}
          ></textarea>
          <input
            type="text"
            name="answer"
            placeholder="Answer*"
            value={formData.answer}
            onChange={handleInputChange}
            required
          />
          <input
            type="number"
            step="any"
            name="longitude"
            placeholder="Longitude*"
            value={formData.longitude}
            onChange={handleInputChange}
            required
          />
          <input
            type="number"
            step="any"
            name="latitude"
            placeholder="Latitude*"
            value={formData.latitude}
            onChange={handleInputChange}
            required
          />
          <textarea
            name="hint"
            placeholder="Hint (Optional)"
            value={formData.hint}
            onChange={handleInputChange}
            rows={2}
          ></textarea>
          <input
            type="text"
            name="link"
            placeholder="AR Link (Optional)"
            value={formData.link}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={isSubmitting}>
            {editingQuestion
              ? isSubmitting
                ? "Saving..."
                : "Save Changes"
              : isSubmitting
              ? "Creating..."
              : "Create Question"}
          </button>
          {editingQuestion && (
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {/* --- Link Questions Form --- */}
      <form onSubmit={handleLinkSubmit} className="link-form">
        <h2>Link Questions</h2>
        {linkError && <p className="error">Error: {linkError}</p>}
        <div className="form-grid">
          <label>
            Current Question:
            <select
              name="currentId"
              value={linkData.currentId}
              onChange={handleLinkChange}
              required
              disabled={isLoadingQuestions}
            >
              <option value="">-- Select Current --</option>
              {questions.map((q) => (
                <option key={q._id} value={q._id}>
                  {q.sequenceNumber}: {q.title || q.question.substring(0, 30)}
                  ...
                </option>
              ))}
            </select>
          </label>
          <label>
            Next Question:
            <select
              name="nextId"
              value={linkData.nextId}
              onChange={handleLinkChange}
              required
              disabled={isLoadingQuestions}
            >
              <option value="">-- Select Next --</option>
              {questions.map((q) => (
                <option key={q._id} value={q._id}>
                  {q.sequenceNumber}: {q.title || q.question.substring(0, 30)}
                  ...
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" disabled={isLinking || isLoadingQuestions}>
          {isLinking ? "Linking..." : "Set Next Question Link"}
        </button>
      </form>

      {/* --- Questions List --- */}
      <div className="questions-list">
        <h2>Existing Questions</h2>
        {isLoadingQuestions && <p>Loading questions...</p>}
        {questionsError && (
          <p className="error">Error loading questions: {questionsError}</p>
        )}
        {deleteError && <p className="error">Delete Error: {deleteError}</p>}

        {questions.length === 0 && !isLoadingQuestions && (
          <p>No questions found. Create one above!</p>
        )}

        <table>
          <thead>
            <tr>
              <th>Seq#</th>
              <th>Title/Question</th>
              <th>Answer</th>
              <th>Coords (Lng, Lat)</th>
              <th>Next Q ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q._id}>
                <td>{q.sequenceNumber}</td>
                <td>{q.title || q.question}</td>
                <td>{q.answer}</td>
                <td>{q.geolocation?.coordinates?.join(", ")}</td>
                <td>
                  {q.nextQuestion ? `...${q.nextQuestion.slice(-6)}` : "None"}
                </td>
                <td>
                  <button onClick={() => handleEdit(q)} disabled={isSubmitting}>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(q._id)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Admin;
