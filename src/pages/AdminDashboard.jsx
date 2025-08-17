import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import ProfileIcon from "../components/ProfileIcon";
import axios from "axios";
import logo from "../assets/Yourparagraphtext.svg"; // Adjust the path as needed

/* ------------ Modal (isolated + memoized + portal) ------------ */
const CreateEmployeeModal = React.memo(function CreateEmployeeModal({
  open,
  onClose,
  token,
  employees,
  onCreated,
  endpoint
}) {
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState("");
  const [startDate, setStartDate] = useState("");
  const [datePreset, setDatePreset] = useState("last7");
  const [month, setMonth] = useState("");
  const [form, setForm] = useState({
    userName: "",
    password: "",
    email: "",
    totalEarning: "",
    manager: "",
    role: "",
    domain: "",
    startDate: "",

  });

  const onFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!form.userName?.trim()) return "userName is required.";
    if (!form.password?.trim()) return "password is required.";
    if (!form.email?.trim()) return "email is required.";
    if (!/\S+@\S+\.\S+/.test(form.email)) return "email is invalid.";
    if (form.totalEarning === "") return "total Earning is required.";
    if (Number.isNaN(Number(form.totalEarning))) return "total Earning must be a number.";
    if (!form.manager) return "manager is required.";
    if (!form.role?.trim()) return "role is required.";
    return "";
  };

  const submitCreate = async (e) => {
    e?.preventDefault();
    setCreateErr("");
    const err = validateForm();
    if (err) return setCreateErr(err);

    setCreating(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: form.userName.trim(),
          password: form.password,
          email: form.email.trim(),
          totalEarning: Number(form.totalEarning),
          forceChangePassword: true,
          manager: form.manager,
          role: form.role.trim(),
          domain: form.domain.trim(),
          dateofJoining: form.startDate || null, // Optional field
        }),
      });
      if (!res.ok) throw new Error((await res.text()) || `Create failed`);
      onCreated?.();
      onClose();
      alert("Employee created successfully.");
    } catch (err2) {
      setCreateErr(err2.message || "Something went wrong.");
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  const modal = (
    <div style={modalStyles.backdrop} onClick={() => !creating && onClose()}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>Create Employee</div>
        <form onSubmit={submitCreate} style={modalStyles.body} autoComplete="off">
          <label style={modalStyles.field}>
            <span>User Name<span style={{ color: "red" }}>*</span></span>
            <input name="userName" type="text" autoComplete="new-username" value={form.userName} onChange={onFormChange} style={modalStyles.input} required />
          </label>
          <label style={modalStyles.field}>
            <span>Password<span style={{ color: "red" }}>*</span></span>
            <input name="password" type="password" autoComplete="new-password" value={form.password} onChange={onFormChange} style={modalStyles.input} required />
          </label>
          <label style={modalStyles.field}>
            <span>Email ID<span style={{ color: "red" }}>*</span></span>
            <input name="email" type="email" autoComplete="off" value={form.email} onChange={onFormChange} style={modalStyles.input} required />
          </label>
          <label style={modalStyles.field}>
            <span>Total Earning<span style={{ color: "red" }}>*</span></span>
            <input name="totalEarning" autoComplete="off" value={form.totalEarning} onChange={onFormChange} style={modalStyles.input} required />
          </label>
          <label style={modalStyles.field}>
            <span>Manager<span style={{ color: "red" }}>*</span></span>
            {/* If you want a free-text manager, keep input; to bind to existing employees, use select below */}
            {/* <input name="manager" value={form.manager} onChange={onFormChange} style={modalStyles.input} required /> */}
            <input name="manager" autoComplete="off" value={form.manager} onChange={onFormChange} style={modalStyles.input} required />

          </label>
          <label style={modalStyles.field}>
            <span>
              Role<span style={{ color: "red" }}>*</span>
            </span>
            <select
              name="role"
              value={form.role}
              onChange={onFormChange}
              style={modalStyles.input}
              required
            >
              <option value="">-- Select Role --</option>
              <option value="admin">admin</option>
              <option value="employee">employee</option>
            </select>
          </label>

          <label style={modalStyles.field}>
            <span>Domain<span style={{ color: "red" }}>*</span></span>
            {/* If you want a free-text manager, keep input; to bind to existing employees, use select below */}
            {/* <input name="manager" value={form.manager} onChange={onFormChange} style={modalStyles.input} required /> */}
            <input name="domain" autoComplete="off" value={form.domain} onChange={onFormChange} style={modalStyles.input} required />

          </label>

          <label style={modalStyles.field}>
            <span>
              Date of Joining<span style={{ color: "red" }}>*</span>
            </span>
            <input id="startDate"
              type="date"
              name="startDate" // important
              value={form.startDate} // use form.startDate
              onChange={onFormChange} // update form state
              style={modalStyles.input}
              required />
          </label>

          {createErr && <div style={{ color: "#b91c1c", fontSize: 13 }}>{createErr}</div>}
        </form>
        <div style={modalStyles.footer}>
          <button type="button" disabled={creating} onClick={onClose} style={{ ...modalStyles.cancelBtn }}>
            Cancel
          </button>
          <button type="submit" disabled={creating} onClick={submitCreate} style={{ ...modalStyles.createBtn }}>
            {creating ? "Creating..." : "Create Employee"}
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
});
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
      background: "#BDBDBD",
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
/* --------------------------- Main Page --------------------------- */
export default function AttendanceSummary() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = user?.token;
  const username = user?.username || "admin";
  const API_BASE_LOGOUT = "https://nexografix-srv.onrender.com/api/attendance";
  const API_BASE = "https://nexografix-srv.onrender.com";
  const CREATE_EMP_ENDPOINT = `${API_BASE}/api/users/create`;
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState([]);
  const [weekendData, setWeekendData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employee, setEmployee] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [month, setMonth] = useState("");
  const [datePreset, setDatePreset] = useState("last7");
  const [darkMode, setDarkMode] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const profileRef = useRef(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);


  // ---------- helpers ----------
  const pad = (n) => String(n).padStart(2, "0");
  const fmtLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const suffix = (d) => {
    const v = d % 100;
    if (v === 11 || v === 12 || v === 13) return "th";
    const last = d % 10;
    if (last === 1) return "st";
    if (last === 2) return "nd";
    if (last === 3) return "rd";
    return "th";
  };
  const formatPrettyDate = (iso) => {
    if (!iso) return "";
    const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${pad(d)}${suffix(d)} ${months[(m || 1) - 1]} ${y || ""}`;
  };
  const startOfWeekMon = (d = new Date()) => {
    const t = new Date(d);
    const diff = (t.getDay() + 6) % 7;
    t.setDate(t.getDate() - diff);
    t.setHours(0, 0, 0, 0);
    return t;
  };
  const endOfWeekMon = (d = new Date()) => {
    const s = startOfWeekMon(d);
    const e = new Date(s);
    e.setDate(s.getDate() + 6);
    e.setHours(23, 59, 59, 999);
    return e;
  };
  const monthStr = (y, m1) => `${y}-${pad(m1)}`;
  const firstOfMonth = (y, m0) => new Date(y, m0, 1);
  const lastOfMonth = (y, m0) => new Date(y, m0 + 1, 0);

  const hashToIndex = (str, mod) => {
    let h = 0;
    const s = String(str);
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h % mod;
  };
  const palette = useMemo(
    () =>
      darkMode
        ? ["#4cc9f0", "#f72585", "#22c55e", "#eab308", "#a78bfa", "#f97316", "#06b6d4", "#ef4444", "#84cc16", "#e879f9"]
        : ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"],
    [darkMode]
  );
  const colorForEmp = (emp) => palette[hashToIndex(emp._id || emp.name, palette.length)];

  // ---------- presets ----------
  const applyPreset = (preset) => {
    setDatePreset(preset);
    const today = new Date();

    if (preset === "today") {
      setMonth("");
      setStartDate(fmtLocal(today));
      setEndDate(fmtLocal(today));
      return;
    }
    if (preset === "last7") {
      setMonth("");
      const s = new Date(today);
      s.setDate(today.getDate() - 6);
      setStartDate(fmtLocal(s));
      setEndDate(fmtLocal(today));
      return;
    }
    if (preset === "last30") {
      setMonth("");
      const s = new Date(today);
      s.setDate(today.getDate() - 29);
      setStartDate(fmtLocal(s));
      setEndDate(fmtLocal(today));
      return;
    }
    if (preset === "thisWeek") {
      setMonth("");
      setStartDate(fmtLocal(startOfWeekMon(today)));
      setEndDate(fmtLocal(endOfWeekMon(today)));
      return;
    }
    if (preset === "thisMonth") {
      const y = today.getFullYear();
      const m0 = today.getMonth();
      setMonth(monthStr(y, m0 + 1));
      setStartDate(fmtLocal(firstOfMonth(y, m0)));
      setEndDate(fmtLocal(lastOfMonth(y, m0)));
      return;
    }
    if (preset === "prevMonth") {
      const d = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const y = d.getFullYear();
      const m0 = d.getMonth();
      setMonth(monthStr(y, m0 + 1));
      setStartDate(fmtLocal(firstOfMonth(y, m0)));
      setEndDate(fmtLocal(lastOfMonth(y, m0)));
      return;
    }
  };

  useEffect(() => { applyPreset("last7"); }, []);

  // ---- employees list ----
  const fetchEmployees = useCallback(async () => {
    try {
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/userGet`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        console.error(`Employees error ${res.status}:`, await res.text());
        return;
      }
      const users = await res.json();
      const formatted = (users || []).map(u => ({
        _id: u._id,
        name: u.username || u.name || u.email,
      }));
      setEmployees(formatted);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  }, [token]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);


  async function handleLogout() {
    try {
      setLoading(true);
      // await axios.post(
      //   `${API_BASE_LOGOUT}/logout`,
      //   {},
      //   { headers: { Authorization: `Bearer ${token}` } }
      // );
      localStorage.clear();
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Logout failed");
    } finally {
      setLoading(false);
    }
  }

  // ---- attendance ----
  const fetchData = useCallback(async () => {
    try {
      if (!token) return;

      let url = `${API_BASE}/api/attendance/summary?weekly=true&`;
      if (startDate) url += `startDate=${encodeURIComponent(startDate)}&`;
      if (endDate) url += `endDate=${encodeURIComponent(endDate)}&`;
      if (employee) url += `employeeId=${encodeURIComponent(employee)}&`;
      if (month) url += `month=${encodeURIComponent(month)}&`;

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        console.error(`Attendance error ${res.status}:`, await res.text());
        return;
      }
      const result = await res.json();
      setData(result.daily || []);
      setWeekendData(result.weekends || []);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }, [token, API_BASE, startDate, endDate, employee, month]);

  useEffect(() => {
    if ((startDate && endDate) || month) fetchData();
  }, [employee, startDate, endDate, month, fetchData]);

  // Memoize heavy charts (don’t recompute while typing in modal)
  const lineChartEl = useMemo(() => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#444" : "#ccc"} />
        <XAxis dataKey="date" tick={{ fill: darkMode ? "#fff" : "#000" }} tickFormatter={formatPrettyDate} minTickGap={16} />
        <YAxis tick={{ fill: darkMode ? "#fff" : "#000" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: darkMode ? "#1f2937" : "#fff",
            border: `1px solid ${darkMode ? "#374151" : "#ddd"}`,
            color: darkMode ? "#fff" : "#000"
          }}
          labelFormatter={(v) => formatPrettyDate(v)}
        />
        <Legend wrapperStyle={{ color: darkMode ? "#fff" : "#000" }} />
        {employees.map(emp => (
          <Line
            key={emp._id}
            type="monotone"
            dataKey={emp.name}
            stroke={palette[hashToIndex(emp._id || emp.name, palette.length)]}
            dot={{ r: 2 }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  ), [data, employees, darkMode]); // <— only re-renders when these change

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


  const barChartEl = useMemo(() => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={weekendData}>
        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#444" : "#ccc"} />
        <XAxis dataKey="date" tick={{ fill: darkMode ? "#fff" : "#000" }} tickFormatter={formatPrettyDate} minTickGap={16} />
        <YAxis tick={{ fill: darkMode ? "#fff" : "#000" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: darkMode ? "#1f2937" : "#fff",
            border: `1px solid ${darkMode ? "#374151" : "#ddd"}`,
            color: darkMode ? "#fff" : "#000"
          }}
          labelFormatter={(v) => formatPrettyDate(v)}
        />
        <Legend wrapperStyle={{ color: darkMode ? "#fff" : "#000" }} />
        {employees.map(emp => (
          <Bar
            key={emp._id}
            dataKey={emp.name}
            stackId="a"
            fill={palette[hashToIndex(emp._id || emp.name, palette.length)]}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  ), [weekendData, employees, darkMode]);

  return (
    <div style={{
      background: darkMode ? "#1e1e1e" : "#fff",
      color: darkMode ? "#fff" : "#000",
      minHeight: "100vh",
      fontFamily: "Arial"
    }}>
      {/* Navbar */}
      <nav style={{
        display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 20px",
  background: darkMode ? "#2eadf3" : "#2eadf3",
  color: "#fff",
  borderBottom: "1px solid black",   // ✅ Correct
  boxShadow: darkMode ? "0 4px 8px rgba(0,0,0,0.2)" : "none",
  position: "sticky",
  top: 0,
  zIndex: 1000 }}>
        <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
          <img src={logo} style={{
        height: "45px", // bigger logo
        width: "auto",  // keep ratio
        marginRight: "10px",
        objectFit: "contain",
      }} />
        </div>
        {/* <div style={{ fontWeight: "bold", fontSize: "18px", cursor: "pointer" }}>🏢 NexoGrafix</div> */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Link to="/home" style={{ color: "#110e0ed8", textDecoration: "none", fontWeight: "bold"}}>Home</Link>
          <Link to="/employee-details" style={{ color: "#110e0ed8", textDecoration: "none", fontWeight: "bold" }}>Employee Details</Link>
          <Link to="/task-assign" style={{ color: "#110e0ed8", textDecoration: "none", fontWeight: "bold" }}>Assign Task</Link>
          <Link to="/task-tracker" style={{ color: "#110e0ed8", textDecoration: "none", fontWeight: "bold"}}>Task Tracker</Link>
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
          </div>
          {/* <ProfileIcon username={username} /> */}
        </div>

      </nav>


      <div style={{ padding: "20px", backgroundColor: "#2eadf3" }}>
        <h2>👋 Welcome, {username}</h2>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button style={modalStyles.button} onClick={() => setShowCreate(true)}>Create Employee</button>
          <button onClick={() => setDarkMode(!darkMode)} style={modalStyles.button}>
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          marginTop: "20px",
          padding: "10px 20px",
        }}
      >
        {/* iTime Pending Approvals */}
        <div
          style={{
            flex: 1,
            margin: "10px",
            padding: "20px",
            borderRadius: "12px",
            background: "#e3f2fd",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            cursor: "pointer",
            textAlign: "center",
          }}
          onClick={() => navigate("/itime-approvals")}
        >
          <h3 style={{ margin: "10px 0", color: "#1565c0" }}>iTime Approvals</h3>
          <p style={{ fontSize: "22px", fontWeight: "bold", color: "#000" }}>
            12 Pending
          </p>
          <small style={{ color: "#666" }}>Weekly count</small>
        </div>

        {/* Leave Approvals */}
        <div
          style={{
            flex: 1,
            margin: "10px",
            padding: "20px",
            borderRadius: "12px",
            background: "#fce4ec",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            cursor: "pointer",
            textAlign: "center",
          }}
          onClick={() => navigate("/leave-approvals")}
        >
          <h3 style={{ margin: "10px 0", color: "#ad1457" }}>Leave Approvals</h3>
          <p style={{ fontSize: "22px", fontWeight: "bold", color: "#000" }}>
            5 Pending
          </p>
          <small style={{ color: "#666" }}>Weekly count</small>
        </div>

        {/* Task Status */}
        <div
          style={{
            flex: 1,
            margin: "10px",
            padding: "20px",
            borderRadius: "12px",
            background: "#e8f5e9",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            cursor: "pointer",
            textAlign: "center",
          }}
          onClick={() => navigate("/task-status")}
        >
          <h3 style={{ margin: "10px 0", color: "#2e7d32" }}>Task Status</h3>
          <p style={{ fontSize: "18px", fontWeight: "bold", color: "#000" }}>
            ✅ 18 Completed <br /> ⏳ 7 Pending
          </p>
          <small style={{ color: "#666" }}>Weekly summary</small>
        </div>
      </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <select value={employee} onChange={e => setEmployee(e.target.value)} style={modalStyles.select}>
            <option value="">All Employees</option>
            {employees.map(emp => (<option key={emp._id} value={emp._id}>{emp.name}</option>))}
          </select>

          <select value={datePreset} onChange={(e) => applyPreset(e.target.value)} style={modalStyles.select} title="Quick date filters">
            <option value="today">Today</option>
            <option value="last7">Last 7 days</option>
            <option value="last30">Last 30 days</option>
            <option value="thisWeek">This week (Mon–Sun)</option>
            <option value="thisMonth">This month</option>
            <option value="prevMonth">Previous month</option>
            <option value="custom">Custom…</option>
          </select>

          <label htmlFor="startDate" style={modalStyles.labelWrap}>
            <span style={modalStyles.labelText}>Start Date</span>
            <input id="startDate" type="date" value={startDate}
              onChange={e => { setStartDate(e.target.value); setDatePreset("custom"); setMonth(""); }}
              style={modalStyles.input} />
          </label>

          <label htmlFor="endDate" style={modalStyles.labelWrap}>
            <span style={modalStyles.labelText}>End Date</span>
            <input id="endDate" type="date" value={endDate}
              onChange={e => { setEndDate(e.target.value); setDatePreset("custom"); setMonth(""); }}
              style={modalStyles.input} />
          </label>
        </div>

        {/* Charts (memoized) */}
        <div style={{ ...modalStyles.chartContainer, background: darkMode ? "#161616" : "#f9f9f9" }}>
          <h3 style={{ color: darkMode ? "#fff" : "#000" }}>Weekly Work Hours</h3>
          {!showCreate && lineChartEl /* optionally pause charts while modal open */}
        </div>

        <div style={{ ...modalStyles.chartContainer, background: darkMode ? "#161616" : "#f9f9f9" }}>
          <h3 style={{ color: darkMode ? "#fff" : "#000" }}>Weekend Work Hours</h3>
          {!showCreate && barChartEl}
        </div>
      </div>

      {/* Modal (portal) */}
      <CreateEmployeeModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        token={token}
        employees={employees}
        onCreated={fetchEmployees}
        endpoint={CREATE_EMP_ENDPOINT}
      />
    </div>
  );
}

/* --------------------------- styles --------------------------- */
const styles = {
  input: { padding: "5px", borderRadius: "5px", border: "1px solid #ccc", width: "100%" },
  select: { padding: "5px", borderRadius: "5px", border: "1px solid #ccc" },
  button: { padding: "5px 10px", borderRadius: "5px", border: "none", background: "#007bff", color: "#fff", cursor: "pointer" },
  chartContainer: { padding: "15px", borderRadius: "10px", marginBottom: "20px" },
  labelWrap: { display: "flex", alignItems: "center", gap: "6px" },
  labelText: { fontSize: "12px", fontWeight: 600, width: "6rem" },
};

const modalStyles = {
  // input: { padding: "5px", borderRadius: "5px", border: "1px solid #ccc", width: "100%" },
  select: { padding: "5px", borderRadius: "5px", border: "1px solid #ccc" },
  button: { padding: "5px 10px", borderRadius: "5px", border: "none", background: "#007bff", color: "#fff", cursor: "pointer" },
  chartContainer: { padding: "15px", borderRadius: "10px", marginBottom: "20px" },
  labelWrap: { display: "flex", alignItems: "center", gap: "6px" },
  labelText: { fontSize: "12px", fontWeight: 600 },
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "grid",
    placeItems: "center",
    zIndex: 50
  },
  modal: {
    width: "min(560px, 92vw)",
    background: "linear-gradient(180deg, #f0f4ff 0%, #ffffff 100%)",
    color: "#000",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
    padding: 0
  },
  header: {
    background: "linear-gradient(90deg, #4f46e5, #3b82f6)",
    color: "#fff",
    padding: "14px 18px",
    fontSize: "18px",
    fontWeight: 600
  },
  body: {
    padding: "18px",
    display: "grid",
    gap: 12
  },
  field: {
    display: "grid",
    gridTemplateColumns: "160px 1fr",
    alignItems: "center",
    gap: 10
  },
  input: {
    padding: "6px 8px",
    borderRadius: 6,
    border: "1px solid #cbd5e1",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
    outline: "none",
    transition: "border 0.2s, box-shadow 0.2s"
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    padding: "12px 18px",
    background: "#f9fafb",
    borderTop: "1px solid #e5e7eb"
  },
  cancelBtn: {
    padding: "6px 12px",
    borderRadius: 6,
    border: "none",
    background: "#9ca3af",
    color: "#fff",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  createBtn: {
    padding: "6px 12px",
    borderRadius: 6,
    border: "none",
    background: "#3b82f6",
    color: "#fff",
    cursor: "pointer",
    transition: "background 0.2s",
  }
};
