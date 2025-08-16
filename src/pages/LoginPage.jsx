import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("https://nexografix-srv.onrender.com/api/auth/login", {
        username,
        password,
      });

      const user = {
        username: res.data.username,
        role: res.data.role,
        token: res.data.token,
        forceChangePassword: res.data.forceChangePassword,
        manager: res.data.manager,
        lastLogin: res.data.lastLogin
      };

      localStorage.setItem("user", JSON.stringify(user));

      // Notify App component about the new user
      if (onLogin) onLogin(user);

      if (user.forceChangePassword) {
        navigate("/change-password");
      } else {
        navigate(`/${user.role}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <img
            src="https://tse2.mm.bing.net/th/id/OIP.EF4l7Q-Vsp_THD5S89s1KQAAAA?pid=Api&P=0&h=180"
            alt="Company Logo"
            style={{ width: "120px" }}
          />
        </div>

        <h2 style={styles.title}>Welcome To NexoGrafix!!</h2>
        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

        <form onSubmit={handleLogin} autoComplete="off">
          <div style={styles.inputGroup}>
            <label>
              Username <span style={styles.asterisk}>*</span>
            </label>
            <input
              type="text"
              name="login_user"
              autoComplete="off"
              value={username}
              required
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label>
              Password <span style={styles.asterisk}>*</span>
            </label>
            <input
              type="password"
              name="login_pass"
              autoComplete="new-password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    height: "100vh",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f6fa",
  },
  card: {
    background: "#fff",
    padding: "2rem 2.5rem",
    borderRadius: "10px",
    boxShadow: "0 2px 15px rgba(0,0,0,0.1)",
    maxWidth: "400px",
    width: "100%",
  },
  title: { textAlign: "center", marginBottom: "1.5rem", color: "#333" },
  inputGroup: { marginBottom: "1.2rem", display: "flex", flexDirection: "column" },
  input: {
    padding: "10px",
    fontSize: "1rem",
    border: "1px solid #ccc",
    borderRadius: "5px",
    outline: "none",
    marginTop: "5px",
  },
  button: {
    width: "100%",
    padding: "12px",
    fontSize: "1rem",
    borderRadius: "5px",
    backgroundColor: "#4a90e2",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
  asterisk: { color: "red" },
};
