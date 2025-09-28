// TeamLeadDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";


const API_BASE = "https://nexografix-srv.onrender.com/api/attendance";
const API_BASE_TASK = "https://nexografix-srv.onrender.com/api/tasksShown";
// helpers
function formatTime(date) {
  if (!date) return "--:--:--";
  const d = new Date(date);
  return d.toLocaleTimeString();
}
function secondsToHHMMSS(sec) {
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Return styles object depending on theme (isDark boolean)
 */
function getStyles(isDark) {
  return {
    wrapper: {
      padding: "1.25rem",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      minHeight: "100vh",
      background: isDark
        ? "linear-gradient(180deg,#0f1724 0%, #071129 100%)"
        : "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
      color: isDark ? "#fff" : "#111",
      boxSizing: "border-box",
    },

    /* NAVBAR */
    navbar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      padding: "10px 14px",
      borderRadius: 10,
      background: isDark
        ? "linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))"
        : "#ffffffee",
      boxShadow: isDark ? "0 8px 30px rgba(2,6,23,0.6)" : "0 6px 18px rgba(16,24,40,0.06)",
      marginBottom: 18,
    },
    navLeft: { display: "flex", alignItems: "center", gap: 12 },
    logoWrap: { display: "flex", alignItems: "center", gap: 10 },
    companyName: { fontWeight: 700, fontSize: 18, marginLeft: 6, color: isDark ? "#fff" : "#111" },
    navCenter: { display: "flex", gap: 12, alignItems: "center" },
    navLink: {
      padding: "8px 14px",
      borderRadius: 8,
      background: "transparent",
      color: isDark ? "#cbd5e1" : "#374151",
      border: "none",
      cursor: "pointer",
      fontWeight: 600,
    },
    navLinkActive: {
      padding: "8px 14px",
      borderRadius: 8,
      background: "linear-gradient(90deg,#6a11cb,#2575fc)",
      color: "#fff",
      border: "none",
      cursor: "pointer",
      fontWeight: 700,
      boxShadow: "0 6px 20px rgba(37, 117, 252, 0.3)",
    },
    navRight: { display: "flex", alignItems: "center", gap: 12 },
    profileBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      borderRadius: 10,
      background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)",
      border: "1px solid rgba(255,255,255,0.03)",
      color: isDark ? "#e6eef8" : "#0f1724",
      cursor: "pointer",
    },
    profileDropdown: {
      position: "absolute",
      right: 0,
      top: "calc(100% + 8px)",
      width: 170,
      backgroundColor: "#ffffff",
      color: "#222",
      borderRadius: 10,
      boxShadow: "0 8px 30px rgba(2,6,23,0.4)",
      padding: 12,
      zIndex: 9999,
    },

    /* MAIN */
    main: { marginTop: 12 },

    /* HOME LAYOUT */
    homeGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 320px",
      gap: 20,
    },
    attendancePanel: {
      background: isDark
        ? "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))"
        : "linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.01))",
      padding: 20,
      borderRadius: 12,
      boxShadow: isDark ? "0 10px 40px rgba(2,6,23,0.6)" : "0 10px 30px rgba(2,6,23,0.06)",
    },
    attendanceCard: {
      background: isDark ? "#0b1220" : "#f7f9fc",
      padding: 16,
      borderRadius: 10,
      border: isDark ? "1px solid rgba(255,255,255,0.03)" : "1px solid rgba(0,0,0,0.04)",
      color: isDark ? "#e6eef8" : "#444",
    },
    row: { display: "flex", gap: 14 },
    col: { flex: 1 },
    smallLabel: { color: isDark ? "#9aa7bf" : "#6b7280", fontSize: 12, marginBottom: 6 },
    largeValue: { fontSize: 18, fontWeight: 700, color: isDark ? "#fff" : "#111" },
    statusPill: {
      display: "inline-block",
      padding: "6px 12px",
      borderRadius: 999,
      color: "#fff",
      fontWeight: 700,
      fontSize: 13,
    },

    /* actions */
    actionPrimary: {
      background: "linear-gradient(90deg,#6a11cb,#2575fc)",
      color: "#fff",
      padding: "10px 18px",
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
      fontWeight: 700,
    },
    actionSecondary: {
      background: isDark ? "#1f2937" : "#374151",
      color: "#fff",
      padding: "10px 14px",
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
      fontWeight: 600,
    },
    actionDanger: {
      background: "#b91c1c",
      color: "#fff",
      padding: "10px 14px",
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
      fontWeight: 600,
    },
    actionGhost: {
      background: "cadetblue",
      color: isDark ? "#cbd5e1" : "#374151",
      padding: "10px 14px",
      borderRadius: 8,
      border: "1px solid rgba(255,255,255,0.03)",
      cursor: "pointer",
    },

    /* RIGHT PANEL */
    utilityPanel: { display: "flex", flexDirection: "column", gap: 12 },
    utilityCard: {
      background: isDark
        ? "linear-gradient(135deg, rgba(106,17,203,0.12) 0%, rgba(37,117,252,0.12) 100%)"
        : "linear-gradient(135deg, rgba(106,17,203,0.06) 0%, rgba(37,117,252,0.06) 100%)",
      border: isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(0,0,0,0.04)",
      padding: 16,
      borderRadius: 12,
      cursor: "pointer",
      color: isDark ? "#e6eef8" : "#111",
    },
    utilityTitle: { fontWeight: 800, fontSize: 16 },
    utilitySub: { color: isDark ? "#a8b6cf" : "#4b5563", marginTop: 6, fontSize: 13 },

    /* ACTIVITY */
    activitySection: {
      display: "flex",
      gap: 16,
      background: isDark
        ? "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))"
        : "linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.01))",
      borderRadius: 12,
      padding: 12,
    },
    activitySidebar: {
      flexBasis: 200,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      padding: 12,
      borderRight: isDark ? "1px solid rgba(255,255,255,0.03)" : "1px solid rgba(0,0,0,0.04)",
    },
    activeSidebarTab: {
      padding: 12,
      background: "linear-gradient(90deg,#6a11cb,#2575fc)",
      color: "#fff",
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
      fontWeight: 700,
    },
    inactiveSidebarTab: {
      padding: 12,
      background: "transparent",
      color: isDark ? "#cbd5e1" : "#374151",
      borderRadius: 8,
      border: isDark ? "1px solid rgba(255,255,255,0.03)" : "1px solid rgba(0,0,0,0.04)",
      cursor: "pointer",
      fontWeight: 700,
    },
    activityContent: {
      flexGrow: 1,
      padding: 18,
      color: isDark ? "#e6eef8" : "#111",
    },

    /* POPUP */
    overlay: {
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(2,6,23,0.6)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    },
    popup: {
      width: 420,
      background: "#fff",
      color: "#111",
      borderRadius: 12,
      padding: 18,
      boxShadow: "0 12px 40px rgba(2,6,23,0.6)",
    },
    startBtn: {
      padding: "10px 20px",
      backgroundColor: "#16a34a",
      color: "#fff",
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
    },
    actionBtn: {
      padding: "8px 14px",
      backgroundColor: "#f59e0b",
      border: "none",
      borderRadius: 8,
      cursor: "pointer",
    },
    logoutBtn: {
      padding: "8px 14px",
      backgroundColor: "#ef4444",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      cursor: "pointer",
    },

  };
}

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = user?.token;
  const username = user?.username || "Team Lead";

  const [attendance, setAttendance] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [breakStartTime, setBreakStartTime] = useState(null);
  const [breakEndTime, setBreakEndTime] = useState(null);
  const [breakDurationMinutes, setBreakDurationMinutes] = useState(null);

  const [loginElapsedSec, setLoginElapsedSec] = useState(0);
  const [breakElapsedSec, setBreakElapsedSec] = useState(0);

  const [showTimerPopup, setShowTimerPopup] = useState(false);

  const [activeMainTab, setActiveMainTab] = useState("home"); // 'home' or 'activity'
  const [activeActivityTab, setActiveActivityTab] = useState("inprogress"); // 'inprogress' | 'completed'

  const profileRef = useRef(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("inprogress");
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 5;
  const [selectedTask, setSelectedTask] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupAction, setPopupAction] = useState(null);
  const [popupType, setPopupType] = useState(""); // "start" or "complete"
  const [counts, setCounts] = useState({
    inprogress: 0,
    started: 0,
    completed: 0
  });
  // theme: read from localStorage or system preference
  const preferDark =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialTheme =
    localStorage.getItem("theme") || (preferDark ? "dark" : "light");
  const [theme, setTheme] = useState(initialTheme);
  const isDark = theme === "dark";
  const styles = getStyles(isDark);

  // persist theme changes (also optionally set class on document)
  useEffect(() => {
    localStorage.setItem("theme", theme);
    // optional: set a data attr or class for global css hooks if needed
    if (typeof document !== "undefined") {
      if (isDark) document.documentElement.classList.add("app-dark-mode");
      else document.documentElement.classList.remove("app-dark-mode");
    }
  }, [theme, isDark]);

  // fetch today's attendance on mount
  useEffect(() => {
    fetchTodayAttendance();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchTasks();
  }, []);


  // profile dropdown click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // refresh when popup opens
  useEffect(() => {
    if (!showTimerPopup) return;
    fetchTodayAttendance();
  }, [showTimerPopup]);

  // login timer
  useEffect(() => {
    if (!attendance?.loginTime || attendance.status === "completed") {
      setLoginElapsedSec(0);
      return;
    }
    const interval = setInterval(() => {
      const now = new Date();
      const loginTime = new Date(attendance.loginTime);
      const diffSec = Math.floor((now - loginTime) / 1000);
      setLoginElapsedSec(diffSec);
    }, 1000);
    return () => clearInterval(interval);
  }, [attendance]);

  // break timer
  useEffect(() => {
    if (!breakStartTime || breakEndTime) {
      setBreakElapsedSec(0);
      return;
    }
    const interval = setInterval(() => {
      const now = new Date();
      const breakStart = new Date(breakStartTime);
      const diffSec = Math.floor((now - breakStart) / 1000);
      setBreakElapsedSec(diffSec);
    }, 1000);
    return () => clearInterval(interval);
  }, [breakStartTime, breakEndTime]);

  async function fetchTodayAttendance() {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/today`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const att = res.data.attendance || null;
      setAttendance(att);

      const openBreak = att?.breaks?.find((b) => !b.end);
      if (openBreak) {
        setBreakStartTime(openBreak.start);
        setBreakEndTime(null);
        setBreakDurationMinutes(null);
      } else {
        setBreakStartTime(null);
        setBreakEndTime(null);
        setBreakDurationMinutes(null);
      }
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch attendance");
      setAttendance(null);
      setBreakStartTime(null);
      setBreakEndTime(null);
      setBreakDurationMinutes(null);
    } finally {
      setLoading(false);
    }
  }

  async function startAttendance() {
    try {
      setLoading(true);
      const res = await axios.post(
        `${API_BASE}/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAttendance(res.data.attendance);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to start attendance");
    } finally {
      setLoading(false);
    }
  }

  const fetchTasks = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;
      const res = await axios.get("https://nexografix-srv.onrender.com/api/tasksShown/my-tasks", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTasks(res.data.tasks || []);
      // setInProgressList(res.data.tasks.filter(t => t.status === "inprogress"));
      // setCompletedList(res.data.tasks.filter(t => t.status === "completed"));
    } catch (err) {
      console.error("Error fetching tasks", err);
    }
  };

  const startTask = async (id) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      await axios.post(`${API_BASE_TASK}/${id}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update frontend state immediately
      setTasks((prev) =>
        prev.map((t) =>
          t._id === id ? { ...t, status: "started", startedDate: new Date() } : t
        )
      );

      // Update counts
      setCounts(prev => ({
        ...prev,
        inprogress: prev.inprogress - 1,
        started: prev.started + 1
      }));
      alert("Task started successfully!");
      // Close popup and show success
      setShowPopup(false);

    } catch (err) {
      if (err.response && err.response.status === 200) {
        alert("Task started successfully!"); // simple message// treat as success
      } else {
        console.error(err);
        alert("Error Starting task");
      }
    }
  };

  const completeTask = async (id) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;

      await axios.post(`${API_BASE_TASK}/${id}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update frontend state immediately
      setTasks((prev) =>
        prev.map((t) =>
          t._id === id ? { ...t, status: "completed", submissionDate: new Date() } : t
        )
      );

      // Update counts
      setCounts(prev => ({
        ...prev,
        started: prev.started - 1,
        completed: prev.completed + 1
      }));

      // Close popup and show success
      alert("Task completed successfully!");
      setShowPopup(false);

    } catch (err) {
      if (err.response && err.response.status === 200) {
        alert("Task completed successfully!");// simple message// treat as success
      } else {
        console.error("Error completing task", err);
        alert("Error completing task");
      }

    }
  };






  // Pagination Logic

  // count tasks by status
  useEffect(() => {
    // After fetching tasks
    const newCounts = {
      inprogress: tasks.filter(t => t.status === "inprogress").length,
      started: tasks.filter(t => t.status === "started").length,
      completed: tasks.filter(t => t.status === "completed").length,
    };
    setCounts(newCounts);
  }, [tasks]);
  // filter tasks based on active tab
  const filteredTasks = tasks.filter(
    (t) => t.status?.toLowerCase() === activeActivityTab.toLowerCase()
  );

  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handlePopupConfirm = () => {
    if (popupAction === "start") {
      startTask(selectedTask._id);
    } else if (popupAction === "complete") {
      completeTask(selectedTask._id);
    }
    setShowPopup(false);
    setSelectedTask(null);
    setPopupAction(null);
  };


  async function handleBreakIn() {
    try {
      setLoading(true);
      const res = await axios.post(
        `${API_BASE}/break-in`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAttendance(res.data.attendance);

      const openBreak = res.data.attendance.breaks.find((b) => !b.end);
      setBreakStartTime(openBreak?.start);
      setBreakEndTime(null);
      setBreakDurationMinutes(null);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to start break");
    } finally {
      setLoading(false);
    }
  }

  async function handleBreakOut() {
    try {
      setLoading(true);
      const res = await axios.post(
        `${API_BASE}/break-out`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAttendance(res.data.attendance);

      const lastBreak = res.data.attendance.breaks.slice(-1)[0];
      setBreakStartTime(lastBreak.start);
      setBreakEndTime(lastBreak.end);
      setBreakDurationMinutes(res.data.breakDurationMinutes ?? null);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to end break");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      setLoading(true);
      await axios.post(
        `${API_BASE}/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.clear();
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Logout failed");
    } finally {
      setLoading(false);
    }
  }

  // simple activity placeholder lists (empty for now)
  const inProgressList = []; // replace with real data later
  const completedList = []; // replace with real data later

  // computed status color
  const statusColor =
    attendance?.status === "completed"
      ? "#dc3545"
      : attendance?.status === "on_break"
        ? "#d39e00"
        : "#28a745";

  return (
    <div style={styles.wrapper}>
      {/* NAVBAR */}
      <header style={styles.navbar}>
        <div style={styles.navLeft}>
          {/* company logo (inline SVG) */}
          <div style={styles.logoWrap}>
            <svg
              width="36"
              height="36"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <rect width="48" height="48" rx="10" fill="url(#g)" />
              <path d="M14 30c4-6 10-10 20-12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                  <stop stopColor="#6a11cb" offset="0" />
                  <stop stopColor="#2575fc" offset="1" />
                </linearGradient>
              </defs>
            </svg>
            <span style={styles.companyName}>NexoGrafix</span>
          </div>
        </div>

        <nav style={styles.navCenter}>
          <button
            onClick={() => setActiveMainTab("home")}
            style={activeMainTab === "home" ? styles.navLinkActive : styles.navLink}
          >
            Home
          </button>
          <button
            onClick={() => setActiveMainTab("activity")}
            style={activeMainTab === "activity" ? styles.navLinkActive : styles.navLink}
          >
            Activity
          </button>
          <button
  onClick={() => navigate("/employeeTeamLead-details")}
  style={{
   padding: "8px 14px",
      borderRadius: 8,
      background: "linear-gradient(90deg,#6a11cb,#2575fc)",
      color: "#fff",
      border: "none",
      cursor: "pointer",
      fontWeight: 700,
      boxShadow: "0 6px 20px rgba(37, 117, 252, 0.3)",
  }}
>
  Employee Details
</button>

        </nav>

        <div style={styles.navRight}>
          <div ref={profileRef} style={{ position: "relative" }}>
            <button
              onClick={() => setShowProfileMenu((s) => !s)}
              style={styles.profileBtn}
              aria-haspopup="menu"
              aria-expanded={showProfileMenu}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5z" fill="#4a90e2" />
                <path d="M12 14c-4 0-9 1.8-9 5v1h18v-1c0-3.2-5-5-9-5z" fill="#4a90e2" />
              </svg>
              <span style={{ marginLeft: 8 }}>{username}</span>
            </button>

            {showProfileMenu && (
              <div style={styles.profileDropdown}>
                <div style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
                  <strong>{username}</strong>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    marginTop: 10,
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "none",
                    backgroundColor: "#dc3545",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            title="Toggle theme"
            style={{
              padding: 8,
              borderRadius: 8,
              marginLeft: 8,
              background: isDark ? "rgba(255,255,255,0.03)" : "#efefef",
              border: "none",
              cursor: "pointer",
            }}
          >
            {isDark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.8L6.76 4.84zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zM17.24 19.16l1.79 1.79 1.79-1.79-1.79-1.8-1.79 1.8zM20.99 11h3v2h-3v-2zM12 4a8 8 0 100 16 8 8 0 000-16z" fill={isDark ? "#ffd166" : "#333"} />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M21.64 13a9 9 0 11-9.9-9.9C12.07 3.1 14.9 5.9 21.64 13z" fill={isDark ? "#fff" : "#111"} />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main style={styles.main}>
        {activeMainTab === "home" && (
          <div style={styles.homeGrid}>
            {/* Left column - Attendance card */}
            <section style={styles.attendancePanel}>
              <h2 style={{ margin: 0, marginBottom: 10 }}>👋 Welcome, {username}</h2>
              <p style={{ marginTop: 0, color: isDark ? "#a0aec0" : "#666", marginBottom: 16 }}>
                Today's attendance
              </p>

              <div style={styles.attendanceCard}>
                {loading ? (
                  <div style={{ textAlign: "center", padding: 20 }}>Loading…</div>
                ) : error ? (
                  <div style={{ color: "#b00020" }}>{error}</div>
                ) : attendance ? (
                  <div>
                    <div style={styles.row}>
                      <div style={styles.col}>
                        <div style={styles.smallLabel}>Login</div>
                        <div style={styles.largeValue}>{formatTime(attendance.loginTime)}</div>
                      </div>
                      <div style={styles.col}>
                        <div style={styles.smallLabel}>Logout</div>
                        <div style={styles.largeValue}>
                          {attendance.logoutTime ? formatTime(attendance.logoutTime) : "--:--:--"}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                      <div style={styles.smallLabel}>Status</div>
                      <div style={{ marginTop: 6 }}>
                        <span style={{ ...styles.statusPill, backgroundColor: statusColor }}>
                          {attendance.status ?? "Not logged in"}
                        </span>
                      </div>
                    </div>

                    <div style={{ marginTop: 14 }}>
                      <div style={styles.smallLabel}>Time elapsed</div>
                      <div style={{ marginTop: 6 }}>
                        {attendance?.loginTime ? secondsToHHMMSS(loginElapsedSec) : "--:--:--"}
                      </div>
                    </div>

                    {attendance?.status === "on_break" && (
                      <div style={{ marginTop: 14 }}>
                        <div style={styles.smallLabel}>Break timer</div>
                        <div style={{ marginTop: 6 }}>{secondsToHHMMSS(breakElapsedSec)}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: 20 }}>
                    No attendance recorded for today.
                  </div>
                )}
              </div>

              {/* Action buttons (also accessible without opening popup) */}
              <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
                {!attendance?.loginTime && (
                  <button
                    onClick={startAttendance}
                    disabled={loading}
                    style={{ ...styles.actionPrimary }}
                  >
                    {loading ? "Starting…" : "Start Work"}
                  </button>
                )}

                {attendance?.loginTime && attendance?.status !== "completed" && (
                  <>
                    <button
                      onClick={handleBreakIn}
                      disabled={
                        loading ||
                        attendance?.status === "on_break" ||
                        attendance?.status === "completed"
                      }
                      style={{ ...styles.actionSecondary }}
                    >
                      Break In
                    </button>
                    <button
                      onClick={handleBreakOut}
                      disabled={loading || attendance?.status !== "on_break"}
                      style={{ ...styles.actionSecondary }}
                    >
                      Break Out
                    </button>
                    <button
                      onClick={handleLogout}
                      disabled={loading}
                      style={{ ...styles.actionDanger }}
                    >
                      Logout
                    </button>
                  </>
                )}

                {/* Prohance popup trigger */}
                <button
                  onClick={() => setShowTimerPopup(true)}
                  style={{ ...styles.actionGhost }}
                >
                  Prohance
                </button>
              </div>
            </section>

            {/* Right column - small utility cards */}
            <aside style={styles.utilityPanel}>
              <div style={styles.utilityCard} onClick={() => window.open("/ileave", "_blank")}>
                <div style={styles.utilityTitle}>📅 iLeave</div>
                <div style={styles.utilitySub}>Apply & check status</div>
              </div>

              <div
                style={styles.utilityCard}
                onClick={() => window.open("/weekly-timesheet", "_blank")}
              >
                <div style={styles.utilityTitle}>🗓 Weekly Timesheet</div>
                <div style={styles.utilitySub}>Fill weekly hours</div>
              </div>

              <div style={{ height: 12 }} />

              <div style={{ ...styles.utilityCard, cursor: "default" }}>
                <div style={styles.utilityTitle}>🔍 Quick Info</div>
                <div style={styles.utilitySub}>
                  {attendance ? (
                    <>
                      <div>Work minutes: {attendance.totalWorkMinutes ?? "—"}</div>
                      <div>Break mins: {attendance.totalBreakMinutes ?? "—"}</div>
                    </>
                  ) : (
                    <div>No data</div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}

        {activeMainTab === "activity" && (
          <div style={{ padding: "24px", minHeight: "80vh", backgroundColor: "#f9fafb" }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
              {["inprogress", "started", "completed"].map((tab) => {
                const isActive = activeActivityTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveActivityTab(tab)}
                    style={{
                      padding: "8px 20px",
                      borderRadius: "8px",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: "none",
                      backgroundColor: isActive ? "#2563eb" : "#f3f4f6",
                      color: isActive ? "white" : "#374151",
                      boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.15)" : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab]})
                  </button>
                );
              })}
            </div>

            {/* Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              {filteredTasks.length === 0 ? (
                <p style={{ color: "#6b7280" }}>No tasks in this category.</p>
              ) : (
                filteredTasks
                  .slice((currentPage - 1) * tasksPerPage, currentPage * tasksPerPage)
                  .map((task) => {
                    const statusClass = task.status?.toLowerCase() || "";
                    let borderColor = "#f3f4f6";
                    let statusColor = "#374151";
                    if (statusClass === "inprogress") {
                      borderColor = "#facc15";
                      statusColor = "#b45309";
                    } else if (statusClass === "started") {
                      borderColor = "#3b82f6";
                      statusColor = "#1d4ed8";
                    } else if (statusClass === "completed") {
                      borderColor = "#22c55e";
                      statusColor = "#166534";
                    }

                    return (
                      <div
                        key={task._id}
                        style={{
                          borderRadius: "12px",
                          padding: "16px",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                          backgroundColor: "white",
                          borderLeft: `6px solid ${borderColor}`,
                          transition: "transform 0.2s, box-shadow 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow = "0 5px 15px rgba(0,0,0,0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
                        }}
                      >
                        
                        <p style={{ margin: "4px 0", fontSize: "14px", color: "#374151" }}>
                            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 600 }}>
                          {task.taskName || task.title}
                        </h3>
                        
                        <p style={{ margin: "4px 0", fontSize: "14px" }}>
                          <strong>Status:</strong> <span style={{ color: statusColor }}>{task.status}</span>
                        </p>
                        <p style={{ margin: "4px 0", fontSize: "14px", color: "#374151" }}>
                          <strong>Assigned:</strong> {task.assignedDate} {task.assignedTime}
                        </p>
                        <p style={{ margin: "4px 0", fontSize: "14px", color: "#374151" }}>
                          <strong>Submission:</strong>{" "}
                          {task.submissionDate ? new Date(task.submissionDate).toLocaleString() : "-"}
                        </p>
                          <strong>File:</strong>{" "}
                          {task.fileRows && task.fileRows.length > 0 ? (
                            <span>
                              {task.fileRows.map((file, idx) => (

                                 
                                
                                <span key={idx} style={{ marginRight: "12px" }}>
                                  
                                  {file.pdfUrl && (
                                    <a
                                      href={file.pdfUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{ color: "#2563eb", textDecoration: "underline", marginRight: "8px" }}
                                    >
                                      PDF
                                    </a>
                                  )}
                                
                                  {file.excelUrl && (
                                    <a
                                      href={file.excelUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{ color: "#16a34a", textDecoration: "underline" }}
                                    >
                                      Excel
                                    </a>
                                  )}
                                  <p style={{ margin: "4px 0", fontSize: "14px", color: "#374151" }}>
                          <strong>Description:</strong> {file.description}
                        </p>
                                </span>
                              ))}
                            </span>
                          ) : (
                            "-"
                          )}
                        </p>


                        {/* Action buttons */}
                        <div style={{ marginTop: "12px", display: "flex", gap: "10px" }}>
                          {statusClass === "inprogress" && (
                            <button
                              style={{
                                padding: "6px 14px",
                                borderRadius: "6px",
                                fontWeight: 500,
                                cursor: "pointer",
                                border: "none",
                                backgroundColor: "#facc15",
                                color: "white",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#eab308")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#facc15")}
                              onClick={() => {
                                setPopupType("start");
                                setSelectedTask(task);
                                setShowPopup(true);
                              }}
                            >
                              Start
                            </button>
                          )}
                          {statusClass === "started" && (
                            <button
                              style={{
                                padding: "6px 14px",
                                borderRadius: "6px",
                                fontWeight: 500,
                                cursor: "pointer",
                                border: "none",
                                backgroundColor: "#22c55e",
                                color: "white",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#16a34a")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#22c55e")}
                              onClick={() => {
                                setPopupType("complete");
                                setSelectedTask(task);
                                setShowPopup(true);
                              }}
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Confirmation Popup */}
            {showPopup && selectedTask && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 50,
                }}
              >
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "24px",
                    borderRadius: "12px",
                    maxWidth: "400px",
                    width: "90%",
                    boxShadow: "0 5px 20px rgba(0,0,0,0.2)",
                  }}
                >
                  <p style={{ marginBottom: "16px", color: "#111827" }}>
                    {popupType === "start"
                      ? `Do you want to start the task "${selectedTask.taskName || selectedTask.title}"?`
                      : `Do you want to complete the task "${selectedTask.taskName || selectedTask.title}"?`}
                  </p>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                    <button
                      onClick={async () => {
                        setLoading(true); // start loading

                        try {
                          if (popupType === "start") await startTask(selectedTask._id);
                          else if (popupType === "complete") await completeTask(selectedTask._id);

                          setShowPopup(false); // close popup after success
                        } catch (err) {
                          console.error(err);
                          alert("Something went wrong");
                        } finally {
                          setLoading(false); // stop loading
                        }
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#1D4ED8",
                        color: "white",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        minWidth: "80px",
                        position: "relative"
                      }}
                    >
                      {loading ? (
                        <div style={{
                          width: "16px",
                          height: "16px",
                          border: "2px solid white",
                          borderTop: "2px solid transparent",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite"
                        }} />
                      ) : (
                        "Yes"
                      )}

                      {/* Inline keyframes */}
                      <style>{`
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `}</style>
                    </button>

                    <button
                      style={{
                        padding: "6px 14px",
                        borderRadius: "6px",
                        fontWeight: 500,
                        cursor: "pointer",
                        border: "none",
                        backgroundColor: "#6b7280",
                        color: "white",
                        transition: "all 0.2s",
                      }}
                      onClick={() => setShowPopup(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}


      </main>

      {/* Timer popup */}
      {showTimerPopup && (
        <div style={styles.overlay}>
          <div style={styles.popup}>
            <h3>Attendance Timer</h3>
            {loading && <p>Loading...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {attendance?.loginTime ? (
              <>
                <p>
                  <strong>Login Time:</strong> {formatTime(attendance.loginTime)}
                </p>
                <p>
                  <strong>Time Elapsed:</strong> {secondsToHHMMSS(loginElapsedSec)}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span style={{ color: statusColor }}>{attendance.status}</span>
                </p>
              </>
            ) : (
              <button onClick={startAttendance} disabled={loading} style={styles.startBtn}>
                Start Work Timer (Login)
              </button>
            )}

            <hr style={{ margin: "20px 0" }} />

            <div>
              <button
                onClick={handleBreakIn}
                disabled={
                  loading ||
                  attendance?.status === "on_break" ||
                  !attendance?.loginTime ||
                  attendance?.status === "completed"
                }
                style={{ ...styles.actionBtn, marginRight: 12 }}
              >
                Break In
              </button>

              <button
                onClick={handleBreakOut}
                disabled={loading || attendance?.status !== "on_break"}
                style={styles.actionBtn}
              >
                Break Out
              </button>
            </div>

            {(breakStartTime || breakEndTime) && (
              <div style={{ marginTop: 18, textAlign: "left" }}>
                <p>
                  <strong>Break Start:</strong> {formatTime(breakStartTime)}
                </p>
                <p>
                  <strong>Break End:</strong> {formatTime(breakEndTime)}
                </p>
                {breakDurationMinutes !== null && (
                  <p>
                    <strong>Total Break Duration:</strong> {breakDurationMinutes} minutes
                  </p>
                )}
                {attendance.status === "on_break" && (
                  <p>
                    <strong>Break Timer:</strong> {secondsToHHMMSS(breakElapsedSec)}
                  </p>
                )}
              </div>
            )}

            <hr style={{ margin: "20px 0" }} />

            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={handleLogout} disabled={loading} style={styles.logoutBtn}>
                Logout
              </button>
              <button
                onClick={() => setShowTimerPopup(false)}
                disabled={loading}
                style={{
                  backgroundColor: isDark ? "#374151" : "#6c757d",
                  color: "white",
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
