import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showModal, setShowModal] = useState(null); // "terms" or "privacy"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
const [modalContent, setModalContent] = useState(null);
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

  const termsContent = `
Terms of Service – Nexografix HR Portal
Effective Date: August 17, 2025

1. Purpose
This portal is developed and maintained by Nexografix for internal employee use. It provides features such as attendance tracking, payroll management, login/logout, and HR-related services.

2. User Responsibility
Employees must use their official login credentials and keep them confidential. Any unauthorized access, sharing of credentials, or misuse of the system is strictly prohibited. Employees are responsible for ensuring accurate entry of their attendance and other work-related data.

3. Company Rights
Nexografix reserves the right to monitor, audit, and review usage of the portal to maintain system integrity. The company may suspend or revoke access in cases of misuse or violation of these terms. Updates or changes to the portal may be implemented without prior notice.

4. Data Accuracy
Payroll and attendance records are based on the information entered into the system. Employees must promptly report discrepancies to HR for correction.

5. Limitation of Liability
The portal is provided for official use only. Nexografix is not liable for data entry errors caused by users or for technical downtime beyond its control.
`;

  const privacyContent = `
Privacy Policy – Nexografix HR Portal
Effective Date: August 17, 2025

1. Information Collected
The system collects personal and employment-related information, including: Name, employee ID, email, and contact details; Attendance, login/logout times, and work hours; Payroll-related data such as salary, deductions, and bank details.

2. Purpose of Data Use
Collected data is used solely for: Attendance management; Payroll processing; HR administration and compliance reporting.

3. Data Sharing
Employee data will not be shared with third parties without consent, except as required by law or regulatory authorities. Internal HR staff and authorized administrators may access data for official purposes only.

4. Data Security
All data is stored securely with restricted access. Encryption and authentication mechanisms are applied to protect sensitive information.

5. Employee Rights
Employees have the right to: Request correction of inaccurate information; Access their own attendance and payroll records; Raise concerns about misuse of their data.

6. Retention
Data will be retained only as long as required by company policy and applicable laws.
`;

    return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(to right, #e8eff4, #f2f7fa)",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      {/* Logo Section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "white",
          padding: "8px 18px",
          borderRadius: "50px",
          boxShadow: "0 3px 8px rgba(0, 0, 0, 0.1)",
          marginBottom: "25px",
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "#5063f0",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            marginRight: "8px",
          }}
        >
          N
        </div>
        <span style={{ fontWeight: 600, fontSize: "16px" }}>Nexografix</span>
      </div>

      {/* Heading */}
      <h2
        style={{
          fontSize: "26px",
          fontWeight: 700,
          textAlign: "center",
          marginBottom: "25px",
          lineHeight: "1.4",
        }}
      >
        Manage your
        <br />
        work smartly
      </h2>

      {/* Form */}
      <div
        style={{
          width: "320px",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#f6f9ff",
            borderRadius: "25px",
            padding: "8px 12px",
          }}
        >
          <span style={{ fontSize: "16px", marginRight: "10px" }}>👤</span>
          <input
            type="text"
            placeholder="Username"
              name="login_user"
              autoComplete="off"
              value={username}
              required
              onChange={(e) => setUsername(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              flex: 1,
              padding: "8px",
              fontSize: "14px",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#f6f9ff",
            borderRadius: "25px",
            padding: "8px 12px",
          }}
        >
          <span style={{ fontSize: "16px", marginRight: "10px" }}>🔒</span>
          <input
            type="password"
            placeholder="Password"
              name="login_pass"
              autoComplete="new-password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              flex: 1,
              padding: "8px",
              fontSize: "14px",
            }}
          />
        </div>
              <button type="submit" 
              onClick={handleLogin}
              style={{
            background: "#5063f0",
            border: "none",
            borderRadius: "25px",
            padding: "12px",
            fontSize: "16px",
            fontWeight: 600,
            color: "white",
            cursor: "pointer",
            transition: "0.3s",
            width: "220px",
            alignSelf: "center",
          }} disabled={loading}>
           {loading ? "Logging in..." : "Login"}
        </button>

      </div>

      {/* Footer */}
     <div
        style={{
          marginTop: "40px",
          textAlign: "center",
          fontSize: "13px",
          color: "#444",
          width: "100%",
        }}
      >
        <hr
          style={{
            border: "none",
            borderTop: "1px solid #ccc",
            margin: "15px auto",
            width: "80%",
          }}
        />
        <p>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setModalContent(termsContent);
            }}
            style={{ color: "#444", textDecoration: "none" }}
          >
            Terms of Service
          </a>{" "}
          |{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setModalContent(privacyContent);
            }}
            style={{ color: "#444", textDecoration: "none" }}
          >
            Privacy policy
          </a>
        </p>
        <p style={{ marginTop: "5px", fontSize: "12px", color: "#777" }}>
          © 2024 Nexografix
        </p>
      </div>

      {/* Modal */}
      {modalContent && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              maxWidth: "600px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
              textAlign: "left",
              fontSize: "14px",
              lineHeight: "1.6",
            }}
          >
            <button
              onClick={() => setModalContent(null)}
              style={{
                float: "right",
                background: "red",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "5px 10px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                marginTop: "40px",
              }}
            >
              {modalContent}
            </pre>
          </div>
        </div>
      )}
 </div>
);

  // return (
  //   <div style={styles.wrapper}>
  //     <div style={styles.card}>
  //       <div style={{ textAlign: "center", marginBottom: "1rem" }}>
  //         <img
  //           src="https://tse2.mm.bing.net/th/id/OIP.EF4l7Q-Vsp_THD5S89s1KQAAAA?pid=Api&P=0&h=180"
  //           alt="Company Logo"
  //           style={{ width: "120px" }}
  //         />
  //       </div>

  //       <h2 style={styles.title}>Welcome To NexoGrafix!!</h2>
  //       {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

  //       <form onSubmit={handleLogin} autoComplete="off">
  //         <div style={styles.inputGroup}>
  //           <label>
  //             Username <span style={styles.asterisk}>*</span>
  //           </label>
  //           <input
  //             type="text"
  //             name="login_user"
  //             autoComplete="off"
  //             value={username}
  //             required
  //             onChange={(e) => setUsername(e.target.value)}
  //             style={styles.input}
  //           />
  //         </div>

  //         <div style={styles.inputGroup}>
  //           <label>
  //             Password <span style={styles.asterisk}>*</span>
  //           </label>
  //           <input
  //             type="password"
  //             name="login_pass"
  //             autoComplete="new-password"
  //             value={password}
  //             required
  //             onChange={(e) => setPassword(e.target.value)}
  //             style={styles.input}
  //           />
  //         </div>

  //         <button type="submit" style={styles.button} disabled={loading}>
  //           {loading ? "Logging in..." : "Login"}
  //         </button>
  //       </form>
  //     </div>
  //   </div>
  // );
}



