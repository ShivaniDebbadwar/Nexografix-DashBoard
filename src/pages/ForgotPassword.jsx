import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ForgotPassword() {
  const [username, setUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const navigate = useNavigate()

  const handleReset = (e) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match")
      return
    }

    const userKey = `user_${username}`
    const user = JSON.parse(localStorage.getItem(userKey))

    if (user) {
      user.password = newPassword
      user.forceChangePassword = false

      localStorage.setItem(userKey, JSON.stringify(user))
      alert("✅ Password reset successfully. Please login.")
      navigate("/")
    } else {
      alert("❌ User not found")
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>Forgot Password</h2>
        <form onSubmit={handleReset} autoComplete="off">
          <div style={styles.inputGroup}>
            <label>Username <span style={styles.asterisk}>*</span></label>
            <input
              type="text"
              value={username}
              required
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label>New Password <span style={styles.asterisk}>*</span></label>
            <input
              type="password"
              value={newPassword}
              required
              onChange={(e) => setNewPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label>Confirm Password <span style={styles.asterisk}>*</span></label>
            <input
              type="password"
              value={confirmPassword}
              required
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.button}>Reset Password</button>
          <p style={{ marginTop: "1rem", textAlign: "center" }}>
            <a href="/" style={{ color: '#007bff' }}>Back to Login</a>
          </p>
        </form>
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f6fa'
  },
  card: {
    background: '#fff', padding: '2rem 2.5rem', borderRadius: '10px', boxShadow: '0 2px 15px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%'
  },
  title: { textAlign: 'center', marginBottom: '1.5rem', color: '#333' },
  inputGroup: { marginBottom: '1.2rem', display: 'flex', flexDirection: 'column' },
  input: {
    padding: '10px', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '5px', outline: 'none', marginTop: '5px'
  },
  button: {
    width: '100%', padding: '12px', fontSize: '1rem', borderRadius: '5px', backgroundColor: '#4a90e2', color: 'white', border: 'none', cursor: 'pointer'
  },
  asterisk: { color: 'red' }
}
