import React, { useEffect, useState, useMemo, useCallback } from "react";
import ReactDOM from "react-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom"; 
import ProfileIcon from "../components/ProfileIcon";

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
  const [form, setForm] = useState({
    userName: "",
    password: "",
    email: "",
    totalEarning: "",
    manager: "",
    role: ""
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
            <span>user Name<span style={{ color: "red" }}>*</span></span>
            <input name="userName" type="text" autoComplete="new-username" value={form.userName} onChange={onFormChange} style={modalStyles.input} required />
          </label>
          <label style={modalStyles.field}>
            <span>password<span style={{ color: "red" }}>*</span></span>
            <input name="password" type="password" autoComplete="new-password" value={form.password} onChange={onFormChange} style={modalStyles.input} required />
          </label>
          <label style={modalStyles.field}>
            <span>email<span style={{ color: "red" }}>*</span></span>
            <input name="email" type="email" autoComplete="off" value={form.email} onChange={onFormChange} style={modalStyles.input} required />
          </label>
          <label style={modalStyles.field}>
            <span>total Earning<span style={{ color: "red" }}>*</span></span>
            <input name="totalEarning" autoComplete="off" value={form.totalEarning} onChange={onFormChange} style={modalStyles.input} required />
          </label>
          <label style={modalStyles.field}>
            <span>manager<span style={{ color: "red" }}>*</span></span>
            {/* If you want a free-text manager, keep input; to bind to existing employees, use select below */}
            {/* <input name="manager" value={form.manager} onChange={onFormChange} style={modalStyles.input} required /> */}
            <input name="manager" autoComplete="off" value={form.manager} onChange={onFormChange} style={modalStyles.input} required />
         
          </label>
          <label style={modalStyles.field}>
            <span>role<span style={{ color: "red" }}>*</span></span>
            <input name="role" autoComplete="off" value={form.role} onChange={onFormChange} style={modalStyles.input} required />
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

/* --------------------------- Main Page --------------------------- */
export default function AttendanceSummary() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = user?.token;
  const username = user?.username || "admin";

  const API_BASE = "https://nexografix-srv.onrender.com";
  const CREATE_EMP_ENDPOINT = `${API_BASE}/api/users/create`;

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
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
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
        ? ["#4cc9f0","#f72585","#22c55e","#eab308","#a78bfa","#f97316","#06b6d4","#ef4444","#84cc16","#e879f9"]
        : ["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"],
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
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 20px", background: darkMode ? "#111" : "#007bff", color: "#fff"
      }}>
        <div style={{ fontWeight: "bold", fontSize: "18px", cursor: "pointer" }}>🏢 Company Logo</div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Link to="/home" style={{ color: "#fff", textDecoration: "none" }}>Home</Link>
          <Link to="/employee-details" style={{ color: "#fff", textDecoration: "none" }}>Employee Details</Link>
          <Link to="/task-assign" style={{ color: "#fff", textDecoration: "none" }}>Assign Task</Link>
      <Link to="/task-tracker" style={{ color: "#fff", textDecoration: "none" }}>Task Tracker</Link>
      
      <ProfileIcon username={username} />
        </div>
        
      </nav>
      <div style={{ padding: "20px" }}>
        <h2>👋 Welcome, {username}</h2>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <button style={styles.button} onClick={() => setShowCreate(true)}>Create Employee</button>
          <button onClick={() => setDarkMode(!darkMode)} style={styles.button}>
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <select value={employee} onChange={e => setEmployee(e.target.value)} style={styles.select}>
            <option value="">All Employees</option>
            {employees.map(emp => (<option key={emp._id} value={emp._id}>{emp.name}</option>))}
          </select>

          <select value={datePreset} onChange={(e) => applyPreset(e.target.value)} style={styles.select} title="Quick date filters">
            <option value="today">Today</option>
            <option value="last7">Last 7 days</option>
            <option value="last30">Last 30 days</option>
            <option value="thisWeek">This week (Mon–Sun)</option>
            <option value="thisMonth">This month</option>
            <option value="prevMonth">Previous month</option>
            <option value="custom">Custom…</option>
          </select>

          <label htmlFor="startDate" style={styles.labelWrap}>
            <span style={{ ...styles.labelText, color: darkMode ? "#fff" : "#000" }}>Start Date</span>
            <input id="startDate" type="date" value={startDate}
              onChange={e => { setStartDate(e.target.value); setDatePreset("custom"); setMonth(""); }}
              style={styles.input} />
          </label>

          <label htmlFor="endDate" style={styles.labelWrap}>
            <span style={{ ...styles.labelText, color: darkMode ? "#fff" : "#000" }}>End Date</span>
            <input id="endDate" type="date" value={endDate}
              onChange={e => { setEndDate(e.target.value); setDatePreset("custom"); setMonth(""); }}
              style={styles.input} />
          </label>
        </div>

        {/* Charts (memoized) */}
        <div style={{ ...styles.chartContainer, background: darkMode ? "#161616" : "#f9f9f9" }}>
          <h3 style={{ color: darkMode ? "#fff" : "#000" }}>Weekly Work Hours</h3>
          {!showCreate && lineChartEl /* optionally pause charts while modal open */}
        </div>

        <div style={{ ...styles.chartContainer, background: darkMode ? "#161616" : "#f9f9f9" }}>
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
