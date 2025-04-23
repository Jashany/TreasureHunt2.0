import { useState, useEffect } from "react"; // Import useEffect
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux"; // Import useSelector
import { selectIsAuthenticated } from "../features/auth/authSlice";
import styles from "./Signup.module.css"; // Import CSS Module (uses Login styles by default)

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [teamName, setTeamName] = useState(""); // New state for team name
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Use useEffect for redirection
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Make sure your backend is running and accessible
      // The URL might need adjustment based on your setup (e.g., proxy in vite.config.js)
      const response = await fetch(
        "https://treasure-api.jsondev.in/api/users/register",
        {
          // Use the correct backend URL
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, password, phoneNumber,teamName }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Throw an error with the message from the backend if available
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      // Handle successful registration
      console.log("Registration successful:", data);
      // Optionally redirect to login page or dashboard
      navigate("/login"); // Redirect to login after successful signup
    } catch (err) {
      console.error("Registration failed:", err);
      setError(err.message || "Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Prevent rendering the form if already authenticated and navigating
  if (isAuthenticated) {
    return null; // Or a loading indicator
  }

  return (
    <div className={styles.container}>
      {" "}
      {/* Use styles from imported module */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={styles.title}>Sign Up</h2>

        <div className={styles.inputGroup}>
          <label htmlFor="name" className={styles.label}>
            Name:
          </label>
          <input
            type="text"
            id="name"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="email" className={styles.label}>
            Email:
          </label>
          <input
            type="email"
            id="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="password" className={styles.label}>
            Password:
          </label>
          <input
            type="password"
            id="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="teamName" className={styles.label}>
            Team Name:
          </label>
          <input
            type="text"
            id="teamName"
            className={styles.input}
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
            />

          </div>

        <div className={styles.inputGroup}>
          <label htmlFor="phoneNumber" className={styles.label}>
            Phone Number:
          </label>
          <input
            type="tel" // Use type="tel" for phone numbers
            id="phoneNumber"
            className={styles.input}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "Signing Up..." : "Sign Up"}
        </button>

        <p className={styles.linkText}>
          Already have an account?{" "}
          <Link to="/login" className={styles.link}>
            Login here
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;
