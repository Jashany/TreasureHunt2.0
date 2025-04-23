import { useState, useEffect } from "react"; // Import useEffect
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  loginSuccess,
  selectIsAuthenticated,
} from "../features/auth/authSlice";
import styles from "./Login.module.css"; // Import CSS Module

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Use useEffect for redirection to avoid rendering issues
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
      // Ensure the backend URL is correct
      const response = await fetch(
        "https://treasure-api.jsondev.in/api/users/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          // Include credentials to send/receive cookies
          credentials: "include",
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      // Handle successful login
      console.log("Login successful:", data);

      // Dispatch loginSuccess action with user data from backend
      dispatch(loginSuccess(data));

      // Backend sets the cookie, navigate will happen via useEffect
    } catch (err) {
      console.error("Login failed:", err);
      setError(
        err.message || "Failed to log in. Please check your credentials."
      );
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
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={styles.title}>Login</h2>

        <div className={styles.inputGroup}>
          <label htmlFor="email" className={styles.label}>
            Email:
          </label>
          <input
            type="email"
            id="email"
            className={styles.input} // Apply style
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
            className={styles.input} // Apply style
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "Logging In..." : "Login"}
        </button>

        <p className={styles.linkText}>
          Don't have an account?{" "}
          <Link to="/signup" className={styles.link}>
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
