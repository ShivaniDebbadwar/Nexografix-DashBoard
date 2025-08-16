import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Link } from "react-router-dom";

/* ----------------- helpers ----------------- */
const pad2 = (n) => String(n).padStart(2, "0");
const to12h = (dt) => {
  if (!dt) return "";
  const d = dt instanceof Date ? dt : new Date(dt);
  let h = d.getHours();
  const m = pad2(d.getMinutes());
  const ampm = h < 12 ? "AM" : "PM";
  h = h % 12 || 12;
  return `${pad2(h)}:${m} ${ampm}`;
};
const minutesToHMM = (mins) =>
  (mins === null || mins === undefined) ? "" : `${Math.floor(mins / 60)}:${pad2(Math.abs(mins) % 60)}`;
const isoDate = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10));
const getDateRange = (startISO, endISO) => {
  const out = [];
  const s = new Date(startISO);
  const e = new Date(endISO);
  e.setHours(23, 59, 59, 999);
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) out.push(d.toISOString().slice(0, 10));
  return out;
};
const defaultStart = () => {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().slice(0, 10);
};
const defaultEnd = () => new Date().toISOString().slice(0, 10);

/* ================== Component ================== */
export default function EmployeesDailyAttendance() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = user?.token;
  const API_BASE = "https://nexografix-srv.onrender.com";

  const [employees, setEmployees] = useState([]); // [{_id, name}]
  const [raw, setRaw] = useState([]);            // raw attendance from backend
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [startDate, setStartDate] = useState(defaultStart());
  const [endDate, setEndDate] = useState(defaultEnd());
  const [searchTerm, setSearchTerm] = useState("");

  /* -------- fetch employees + attendance (admin) -------- */
  useEffect(() => {
    const go = async () => {
      if (!token) return;
      setErr(""); setLoading(true);
      try {
        // 1) All employees
        const resUsers = await fetch(`${API_BASE}/api/userGet`, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
        });
        if (!resUsers.ok) throw new Error(await resUsers.text());
        const users = await resUsers.json();
        const emps = (users || []).map(u => ({
          _id: u._id,
          name: u.username || u.name || u.email || "Unknown"
        }));
        setEmployees(emps);

        // 2) All attendance (admin)
        const resAtt = await fetch(`${API_BASE}/api/attendance/all`, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
        });
        if (!resAtt.ok) throw new Error(await resAtt.text());
        const json = await resAtt.json();
        setRaw(Array.isArray(json.attendance) ? json.attendance : []);
      } catch (e) {
        setErr(e?.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    go();
  }, [token, API_BASE]);

  /* -------- derive rows inside range + by employee/date -------- */
  const dateKeys = useMemo(() => getDateRange(startDate, endDate), [startDate, endDate]);

  // Build: name -> { [dateISO]: info }, pre-seeded with ALL employees so blanks show up
  const empMap = useMemo(() => {
    const map = new Map();

    // Pre-seed blanks for every employee (so they always show)
    employees.forEach((e) => {
      map.set(e.name, {}); // dates will be filled if any
    });

    // Fill from attendance
    raw.forEach((r) => {
      const name = r?.userId?.username || r?.userId?.name || r?.userId?.email || "Unknown";
      const dISO = isoDate(r.date);

      // compute totals robustly
      const totalBreakMinutes =
        r.totalBreakMinutes ??
        (Array.isArray(r.breaks)
          ? r.breaks.reduce((sum, b) => {
              if (!b?.start || !b?.end) return sum;
              const dur = Math.max(0, Math.floor((new Date(b.end) - new Date(b.start)) / 60000));
              return sum + dur;
            }, 0)
          : 0);

      const workMinutes =
        r.totalWorkMinutes ??
        (r.loginTime && r.logoutTime
          ? Math.max(0, Math.floor((new Date(r.logoutTime) - new Date(r.loginTime)) / 60000) - totalBreakMinutes)
          : 0);

      // display only the first break window (you can expand to list all if you want)
      const firstBreak = (Array.isArray(r.breaks) && r.breaks.length > 0) ? r.breaks[0] : null;

      const info = {
        login: r.loginTime ? new Date(r.loginTime) : null,
        logout: r.logoutTime ? new Date(r.logoutTime) : null,
        breakIn: firstBreak?.start ? new Date(firstBreak.start) : null,
        breakOut: firstBreak?.end ? new Date(firstBreak.end) : null,
        tWorkMin: (r.loginTime && r.logoutTime) ? workMinutes : null,  // null -> show blank
        tBreakMin: (r.loginTime && r.logoutTime) ? totalBreakMinutes : null,
      };

      if (!map.has(name)) map.set(name, {}); // in case some employee didn't come from /userGet
      const prev = map.get(name)[dISO];
      // keep the "best" record per date: prefer one with both login/logout
      const hasBoth = (v) => v && v.login && v.logout;
      if (!prev || (hasBoth(info) && !hasBoth(prev))) {
        map.get(name)[dISO] = info;
      }
    });

    return map;
  }, [raw, employees]);

  const allEmployeeNames = useMemo(
    () => employees.map(e => e.name).sort((a, b) => a.localeCompare(b)),
    [employees]
  );

  const employeeNames = useMemo(
    () => allEmployeeNames.filter((n) => n.toLowerCase().includes(searchTerm.toLowerCase())),
    [allEmployeeNames, searchTerm]
  );

  /* ---------------- Excel export (mirrors table; blanks stay blank) ---------------- */
  const handleDownload = () => {
    const pretty = (iso) => {
      const [y, m, d] = iso.split("-").map(Number);
      return `${pad2(d)}/${pad2(m)}/${y}`;
    };

    const top = ["EMP NAME"];
    dateKeys.forEach((dk) => top.push(pretty(dk), "", "", "", "", ""));
    const sub = [""];
    dateKeys.forEach(() =>
      sub.push("Login Time", "Logout Time", "Total Working Hrs", "Break In", "Break Out", "Total Break Time")
    );

    const rows = [top, sub];

    employeeNames.forEach((name) => {
      const byDate = empMap.get(name) || {};
      const row = [name];
      dateKeys.forEach((dk) => {
        const v = byDate[dk] || {};
        row.push(
          to12h(v.login || ""),                  // Login
          to12h(v.logout || ""),                 // Logout
          minutesToHMM(v.tWorkMin),             // Total Working (blank if null)
          to12h(v.breakIn || ""),               // Break In
          to12h(v.breakOut || ""),              // Break Out
          minutesToHMM(v.tBreakMin)             // Total Break (blank if null)
        );
      });
      rows.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // merges (EMP NAME vertical + each date group across)
    ws["!merges"] = ws["!merges"] || [];
    ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }); // A1:A2
    for (let i = 0; i < dateKeys.length; i++) {
      const startCol = 1 + i * 6;
      ws["!merges"].push({ s: { r: 0, c: startCol }, e: { r: 0, c: startCol + 5 } });
    }

    // column widths
    const cols = [{ wch: 24 }];
    for (let i = 0; i < dateKeys.length * 6; i++) cols.push({ wch: 16 });
    ws["!cols"] = cols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `Attendance_${startDate}_to_${endDate}.xlsx`);
  };

  /* --------------------------- UI --------------------------- */
  return (
    <div style={{ padding: 20 }}>
      <nav style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 20px", background: "#007bff", color: "#fff",
        borderRadius: 8, marginBottom: 16
      }}>
        <div style={{ fontWeight: "bold" }}>Employee Details</div>
        <div style={{ display: "flex", gap: 16 }}>
          <Link to="/home" style={{ color: "#fff", textDecoration: "none" }}>← Back to Home</Link>
          <button onClick={handleDownload} style={{
            background: "#fff", color: "#007bff", border: "none",
            padding: "8px 12px", borderRadius: 6, cursor: "pointer", fontWeight: 600
          }}>
            Download Excel
          </button>
        </div>
      </nav>

      <div style={{
        display: "flex", gap: "1rem", flexWrap: "wrap",
        background: "#f9f9f9", padding: "12px", borderRadius: 8, marginBottom: 12
      }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label><b>Start Date</b></label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label><b>End Date</b></label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 240 }}>
          <label><b>Search employee</b></label>
          <input
            type="text"
            placeholder="Type name…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading && <div>Loading…</div>}
      {err && <div style={{ color: "#b91c1c" }}>{err}</div>}

      {!loading && !err && (
        <div style={{ overflowX: "auto" }}>
          <table border="1" cellPadding="6" cellSpacing="0" style={{ width: "100%", minWidth: 900 }}>
            <thead>
              {/* Top header: EMP NAME + merged date cells */}
              <tr>
                <th rowSpan={2} style={{ minWidth: 180, textAlign: "left" }}>EMP NAME</th>
                {dateKeys.map((dk) => {
                  const [y, m, d] = dk.split("-").map(Number);
                  return (
                    <th key={dk} colSpan={6} style={{ textAlign: "center" }}>
                      {pad2(d)}/{pad2(m)}/{y}
                    </th>
                  );
                })}
              </tr>
              {/* Sub header: repeated per date */}
              <tr>
                {dateKeys.map((dk) => (
                  <React.Fragment key={`sub-${dk}`}>
                    <th>Login</th>
                    <th>Logout</th>
                    <th>Total Working Hrs</th>
                    <th>Break In</th>
                    <th>Break Out</th>
                    <th>Total Break Time</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            <tbody>
              {employeeNames.length === 0 && (
                <tr><td colSpan={1 + dateKeys.length * 6} align="center">No records found</td></tr>
              )}
              {employeeNames.map((name) => {
                const byDate = empMap.get(name) || {};
                return (
                  <tr key={name}>
                    <td>{name}</td>
                    {dateKeys.map((dk) => {
                      const v = byDate[dk] || {};
                      return (
                        <React.Fragment key={`${name}-${dk}`}>
                          <td>{to12h(v.login) || ""}</td>
                          <td>{to12h(v.logout) || ""}</td>
                          <td>{minutesToHMM(v.tWorkMin)}</td>
                          <td>{to12h(v.breakIn) || ""}</td>
                          <td>{to12h(v.breakOut) || ""}</td>
                          <td>{minutesToHMM(v.tBreakMin)}</td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
