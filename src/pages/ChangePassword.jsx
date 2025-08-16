import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
       const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = user?.token;
      if (!token) {
        alert("Session expired. Please log in again.");
        navigate("/");
        return;
      }

      // Send password update request to backend
      const res = await axios.post(
        "https://nexografix-srv.onrender.com/api/user/change-password",
        { newPassword },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert(res.data.message || "Password updated successfully.");

    if (user) {
      user.forceChangePassword = false;
      localStorage.setItem("user", JSON.stringify(user));
    }
      // Clear session so user re-logs in with new password
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("lastLogin");

      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update password.");
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
      <h2>Change Your Password</h2>
      <form onSubmit={handleSubmit}>
        <label>New Password:</label>
        <input
          type="password"
          value={newPassword}
          required
          onChange={(e) => setNewPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "8px",
            marginBottom: "12px"
          }}
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#4a90e2",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Update Password
        </button>
      </form>
    </div>
  );
}
