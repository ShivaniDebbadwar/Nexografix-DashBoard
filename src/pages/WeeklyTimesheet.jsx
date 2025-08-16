import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ProfileIcon from "../components/ProfileIcon";
const API_BASE = "https://nexografix-srv.onrender.com/api"; // adjust if needed

const holidaysList = [
  { date: "2025-01-26", name: "Republic Day" },
  { date: "2025-08-15", name: "Independence Day" },
  { date: "2025-10-02", name: "Gandhi Jayanti" },
  { date: "2025-12-25", name: "Christmas" },
];

function useApi() {
  const api = useMemo(() => {
    const inst = axios.create({ baseURL: API_BASE });
    inst.interceptors.request.use((config) => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = user?.token;
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    return inst;
  }, []);
  return api;
}

// HH:MM + HH:MM -> "8h 30m"
const toHoursString = (login, logout) => {
  if (!login || !logout) return "";
  const [sh, sm] = login.split(":").map(Number);
  const [eh, em] = logout.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

export default function WeeklyTimesheet() {
  const api = useApi();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const username = user?.username || "Employee";
  const userRole = user?.role || "employee";
  const [manager, setManagerName] = useState(user?.manager || "");
  // tabs & week
  const [activeTab, setActiveTab] = useState("week"); // week | weekend | history | reopen
  const [weekStart, setWeekStart] = useState(getStartOfWeek(new Date()));

  // grid entries
  const [entries, setEntries] = useState([]);

  // ui state
  const [showHolidayPopup, setShowHolidayPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  // reopen modal
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenDate, setReopenDate] = useState("");
  const [reopenReason, setReopenReason] = useState("");

  // reopen requests list
  const [reopenRequests, setReopenRequests] = useState([]);
  const [reopenLoading, setReopenLoading] = useState(false);

  // weekend working form
  const [weekendDate, setWeekendDate] = useState("");
  const [weekendReason, setWeekendReason] = useState("");
  const weekendOptions = useMemo(() => getWeekendDatesAround(weekStart), [weekStart]);

  // history
  const [mySheets, setMySheets] = useState([]);
  const [weekendHistory, setWeekendHistory] = useState([]);

  // build grid when week/manager changes
  useEffect(() => {
    setEntries(generateWeekData(weekStart, manager));
  }, [weekStart, manager]);

  // load current week docs and merge → prevents “hours disappearing”
  useEffect(() => {
    (async () => {
      try {
        const startStr = new Date(weekStart).toISOString().slice(0, 10);
        const { data } = await api.get("/timesheedetails/week", { params: { start: startStr } });

        setEntries((prev) =>
          prev.map((row) => {
            const ts = data.find((d) => String(d.date).slice(0, 10) === row.date);
            if (!ts) return row;
            const firstTask = (ts.tasks || [])[0] || {};
            return {
              ...row,
              timesheetId: ts._id,
              status:
                ts.status === "submitted"
                  ? "Submitted"
                  : ts.status === "approved"
                  ? "Approved"
                  : ts.status === "rejected"
                  ? "Rejected"
                  : "Draft",
              // refill inputs from server
              login: firstTask.login ?? row.login,
              logout: firstTask.logout ?? row.logout,
              hours: firstTask.hours ?? row.hours,
              // keep reopened as-is unless server moved it forward
              reopened: row.reopened && ts.status !== "submitted" ? row.reopened : row.reopened,
            };
          })
        );
      } catch {
        // optional: setErr("Failed to load week.");
      }
    })();
  }, [weekStart, api]);

  // lazy-load history
  useEffect(() => {
    if (activeTab === "history") loadHistory();
  }, [activeTab]);

  // lazy-load reopen requests when tab opened
  useEffect(() => {
    if (activeTab === "reopen") loadReopenRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ---------- helpers ----------
  function getStartOfWeek(date) {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay()); // Sunday
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function formatDate(date) {
    return date.toISOString().split("T")[0];
  }

  // weekends allowed; only real holidays are blocked
  function generateWeekData(start, mgr = "") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = formatDate(today);

    const data = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);

      const dateStr = formatDate(d);
      const holiday = holidaysList.find((h) => h.date === dateStr);
      const day = d.getDay();
      const isWeekend = day === 0 || day === 6; // Sun/Sat
      const isHoliday = !!holiday;

      data.push({
        date: dateStr,
        login: "",
        logout: "",
        hours: "",
        status: isHoliday ? "Holiday" : dateStr === todayStr ? "Pending" : "Closed",
        isToday: dateStr === todayStr,
        isWeekend,
        isHoliday,
        dayLabel: isHoliday ? holiday.name : isWeekend ? (day === 0 ? "Sunday" : "Saturday") : "",
        manager: mgr || "—",
        reopened: false,
        timesheetId: null,
        isFuture: d.getTime() > today.getTime(), // for hiding Reopen on future
      });
    }
    return data;
  }

  const handleChange = (idx, field, value) => {
    const updated = [...entries];
    updated[idx][field] = value;
    if (updated[idx].login && updated[idx].logout) {
      updated[idx].hours = toHoursString(updated[idx].login, updated[idx].logout);
    } else {
      updated[idx].hours = "";
    }
    setEntries(updated);
  };

  const shiftWeek = (days) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + days);
    setWeekStart(d);
  };

  // lock for Submitted/Approved or holiday
  const isLocked = (e) => e.isHoliday || e.status === "Submitted" || e.status === "Approved";

  // Save one row as draft
  const saveOneDraft = async (idx) => {
    const row = entries[idx];
    if (!row.login || !row.logout) return;

    const payload = {
      date: row.date,
      tasks: [{ type: "work", login: row.login, logout: row.logout, hours: row.hours }],
    };

    const { data } = await api.post("/timesheedetails/create", payload);
    const id = data?.timesheet?._id;
    if (id) {
      const updated = [...entries];
      updated[idx].timesheetId = id;
      updated[idx].status = "Draft";
      setEntries(updated);
    }
  };

  // Save all filled days
  const handleSave = async () => {
    try {
      setErr("");
      setOk("");
      setLoading(true);
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        if (e.isHoliday) continue;
        if (!e.login || !e.logout) continue;
        if (e.timesheetId) continue;
        await saveOneDraft(i);
      }
      setOk("Timesheet saved as draft for filled days.");
    } catch (e) {
      setErr(e.response?.data?.error || e.response?.data?.message || "Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  // Submit a single day
  const submitDay = async (idx) => {
    try {
      setErr("");
      setOk("");
      const id = entries[idx].timesheetId;
      if (!id) return;
      const { data } = await api.post(`/timesheedetails/submit/${id}`); // if server returns timesheet
      const updated = [...entries];
      updated[idx].status = "Submitted";
      // keep UI in sync with server task values if returned
      const t0 = data?.timesheet?.tasks?.[0];
      if (t0) {
        updated[idx].login = t0.login ?? updated[idx].login;
        updated[idx].logout = t0.logout ?? updated[idx].logout;
        updated[idx].hours = t0.hours ?? updated[idx].hours;
      }
      setEntries(updated);
      setOk(`Submitted ${entries[idx].date}`);
    } catch (e) {
      setErr(e.response?.data?.error || "Failed to submit.");
    }
  };

  // Reopen request (past & today only)
  const openReopen = (dateStr) => {
    setReopenDate(dateStr);
    setReopenReason("");
    setReopenOpen(true);
  };

  const sendReopenRequest = async () => {
    try {
      setErr("");
      setOk("");
      if (!reopenReason) {
        setErr("Please enter a reason.");
        return;
      }
      await api.post("/timesheet/reopen-request", {
        employeeUsername: username,
        reason: reopenReason,
        date: reopenDate,
      });
      setOk("Reopen request sent to manager.");
      setReopenOpen(false);
      const updated = entries.map((e) =>
        e.date === reopenDate ? { ...e, reopened: true, status: "Reopen Requested" } : e
      );
      setEntries(updated);

      // if reopen tab is active, refresh
      if (activeTab === "reopen") loadReopenRequests();
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to request reopen.");
    }
  };

  // Admin approve/reject a reopen request
  const reviewReopenRequest = async (requestId, status) => {
    try {
      setErr("");
      setOk("");
      await api.put(`/timesheet/reopen-review/${requestId}`, { status });
      setOk(`Request ${status}.`);
      setReopenRequests((prev) => prev.map((r) => (r._id === requestId ? { ...r, status } : r)));

      // if approved, also update entries UI to allow editing of that date for that employee (if currently viewing same)
      if (status === "approved") {
        const req = reopenRequests.find((r) => r._id === requestId);
        if (req) {
          setEntries((prev) => prev.map((e) => (e.date === String(req.date).slice(0, 10) ? { ...e, reopened: true, status: "Draft" } : e)));
        }
      }
    } catch (err) {
      setErr(err.response?.data?.message || "Failed to update request.");
    }
  };

  // load reopen requests
  const loadReopenRequests = async () => {
    try {
      setReopenLoading(true);
      setErr("");
      setOk("");
      let res;
      if (userRole === "admin") {
        // admin: get all requests
        res = await api.get("/timesheet/reopen-requests");
      } else {
        // employee: get own requests
        res = await api.get("/timesheet/reopen-requests/my", { params: { username } });
      }
      // expect array of requests with fields: _id, employeeId or employeeUsername, date, reason, status, createdAt
      setReopenRequests(res.data || []);
    } catch (err) {
      setErr(err.response?.data?.message || "Failed to load reopen requests.");
    } finally {
      setReopenLoading(false);
    }
  };

  // Weekend working (optional separate flow)
  const applyWeekendWorking = async (e) => {
    e.preventDefault();
    if (!weekendDate || !weekendReason) return;
    try {
      setErr("");
      setOk("");
      await api.post("/weekend/submit", { date: weekendDate, reason: weekendReason });
      setOk("Weekend working submitted for approval.");
      setWeekendDate("");
      setWeekendReason("");
    } catch (ex) {
      setErr(ex.response?.data?.message || "Failed to submit weekend working.");
    }
  };

  // History
  async function loadHistory() {
    try {
      setLoading(true);
      const [ts, ww] = await Promise.all([api.get("/timesheedetails/my"), api.get("/weekend/my")]);
      setMySheets(ts.data || []);
      setWeekendHistory(ww.data || []);
    } catch {
      setErr("Failed to load history.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <ProfileIcon username={username} />
      <h2 style={styles.title}>🕒 My Weekly Timesheet Entry</h2>

      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeTab === "week" ? styles.tabActive : {}) }}
          onClick={() => setActiveTab("week")}
        >
          Week Entry
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === "weekend" ? styles.tabActive : {}) }}
          onClick={() => setActiveTab("weekend")}
        >
          Weekend Working
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === "history" ? styles.tabActive : {}) }}
          onClick={() => setActiveTab("history")}
        >
          History
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === "reopen" ? styles.tabActive : {}) }}
          onClick={() => setActiveTab("reopen")}
        >
          Reopen Requests
        </button>
      </div>

      {err && <div style={styles.alertDanger}>{err}</div>}
      {ok && <div style={styles.alertOk}>{ok}</div>}

      {activeTab === "week" && (
        <>
          <div style={styles.weekControls}>
            <button onClick={() => shiftWeek(-7)} style={styles.navBtn}>
              « Previous
            </button>
            <span style={styles.weekText}>
              {formatDate(weekStart)} to {formatDate(new Date(weekStart.getTime() + 6 * 86400000))}
            </span>
            <button onClick={() => setWeekStart(getStartOfWeek(new Date()))} style={styles.navBtn}>
              This Week
            </button>
            <button onClick={() => shiftWeek(7)} style={styles.navBtn}>
              Next »
            </button>
            <button onClick={() => setShowHolidayPopup(true)} style={styles.holidayBtn}>
              📅 View Holidays
            </button>
          </div>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.cell}>Date</th>
                  <th style={styles.cell}>Login</th>
                  <th style={styles.cell}>Logout</th>
                  <th style={styles.cell}>Hours</th>
                  <th style={styles.cell}>Status</th>
                  <th style={styles.cell}>Manager</th>
                  <th style={styles.cell}>Action</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, idx) => (
                  <tr key={e.date} style={e.isHoliday ? styles.holidayRow : {}}>
                    <td style={styles.cell}>{e.date}</td>
                    <td style={styles.cell}>
                      <input
                        type="time"
                        value={e.login}
                        disabled={isLocked(e) || (!e.isToday && !e.reopened)}
                        onChange={(ev) => handleChange(idx, "login", ev.target.value)}
                        style={styles.input}
                      />
                    </td>
                    <td style={styles.cell}>
                      <input
                        type="time"
                        value={e.logout}
                        disabled={isLocked(e) || (!e.isToday && !e.reopened)}
                        onChange={(ev) => handleChange(idx, "logout", ev.target.value)}
                        style={styles.input}
                      />
                    </td>
                    <td style={styles.cell}>{e.hours}</td>
                    <td style={styles.cell}>
                      <span
                        style={{
                          ...styles.badge,
                          backgroundColor: e.isHoliday
                            ? "#f39c12"
                            : e.status === "Closed"
                            ? "#dc3545"
                            : e.status === "Reopen Requested"
                            ? "#ffc107"
                            : e.status === "Submitted"
                            ? "#17a2b8"
                            : e.status === "Draft"
                            ? "#6f42c1"
                            : "#28a745",
                        }}
                      >
                        {e.isHoliday ? e.dayLabel : e.isWeekend ? e.dayLabel || e.status : e.status}
                      </span>
                    </td>
                    <td style={styles.cell}>{e.manager}</td>
                    <td style={styles.cell}>
                      {!e.isHoliday && (
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                          {e.login && e.logout && !e.timesheetId && e.status !== "Submitted" && e.status !== "Approved" && (
                            <button onClick={() => saveOneDraft(idx)} style={styles.secondaryBtn}>
                              Save Draft
                            </button>
                          )}

                          {e.timesheetId && e.status !== "Submitted" && e.status !== "Approved" && (
                            <button onClick={() => submitDay(idx)} style={styles.submitBtn}>
                              Submit Day
                            </button>
                          )}

                          {/* Reopen only for today/past (not future), not already reopened */}
                          {!e.isFuture && !e.reopened && (
                            <button onClick={() => openReopen(e.date)} style={styles.reopenBtn}>
                              Reopen
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={handleSave} style={styles.saveBtn} disabled={loading}>
            💾 Save Timesheet
          </button>

          {showHolidayPopup && (
            <div style={styles.popupOverlay}>
              <div style={styles.popup}>
                <h3 style={{ marginBottom: "1rem" }}>📅 Company Holidays</h3>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {holidaysList.map((h) => (
                    <li key={h.date} style={{ marginBottom: 8 }}>
                      <strong>{h.date}</strong>: {h.name}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setShowHolidayPopup(false)} style={styles.closeBtn}>
                  Close
                </button>
              </div>
            </div>
          )}

          {reopenOpen && (
            <div style={styles.popupOverlay}>
              <div style={styles.popup}>
                <h3>Request Reopen</h3>
                <p style={{ marginTop: 8, marginBottom: 8 }}>
                  Date: <strong>{reopenDate}</strong>
                </p>
                <textarea
                  placeholder="Reason"
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  style={{ ...styles.input, height: 90 }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={sendReopenRequest} style={styles.submitBtn}>
                    Send
                  </button>
                  <button onClick={() => setReopenOpen(false)} style={styles.closeBtn}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "weekend" && (
        <div style={styles.card}>
          <h3>🗓 Apply for Weekend Working</h3>
          <form onSubmit={applyWeekendWorking} style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <label>
              Date <span style={{ color: "red" }}>*</span>
              <select
                value={weekendDate}
                onChange={(e) => setWeekendDate(e.target.value)}
                style={styles.input}
                required
              >
                <option value="">-- Select Saturday/Sunday --</option>
                {weekendOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Reason <span style={{ color: "red" }}>*</span>
              <textarea
                value={weekendReason}
                onChange={(e) => setWeekendReason(e.target.value)}
                style={{ ...styles.input, height: 90 }}
                required
              />
            </label>
            <button type="submit" style={styles.submitBtn}>
              Submit
            </button>
          </form>
          <p style={{ fontSize: 12, color: "#6c757d", marginTop: 8 }}>
            Your weekend working request will be sent for manager approval.
          </p>
        </div>
      )}

      {activeTab === "history" && (
        <div style={styles.tableWrapper}>
          {loading ? (
            <p>Loading…</p>
          ) : (
            <>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.cell}>Date</th>
                    <th style={styles.cell}>Items</th>
                    <th style={styles.cell}>Status</th>
                    <th style={styles.cell}>Submitted</th>
                    <th style={styles.cell}>Approved</th>
                  </tr>
                </thead>
                <tbody>
                  {mySheets.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: 12 }}>
                        No timesheets yet
                      </td>
                    </tr>
                  ) : (
                    mySheets.map((t) => (
                      <tr key={t._id}>
                        <td style={styles.cell}>{String(t.date).slice(0, 10)}</td>
                        <td style={styles.cell}>
                          {(t.tasks || []).map((x, i) => (
                            <div key={i} style={{ fontSize: 12 }}>
                              {x.type}: {x.hours || ""} {x.login ? `(${x.login}–${x.logout})` : ""}
                            </div>
                          ))}
                        </td>
                        <td style={styles.cell}>
                          <span
                            style={{
                              ...styles.badge,
                              backgroundColor:
                                t.status === "approved"
                                  ? "#28a745"
                                  : t.status === "rejected"
                                  ? "#dc3545"
                                  : t.status === "submitted"
                                  ? "#17a2b8"
                                  : "#6f42c1",
                            }}
                          >
                            {t.status?.charAt(0).toUpperCase() + t.status?.slice(1)}
                          </span>
                        </td>
                        <td style={styles.cell}>{t.submittedAt ? new Date(t.submittedAt).toLocaleString() : "—"}</td>
                        <td style={styles.cell}>{t.approvedAt ? new Date(t.approvedAt).toLocaleString() : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <h3 style={{ marginTop: 24 }}>Weekend Working</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.cell}>Date</th>
                    <th style={styles.cell}>Reason</th>
                    <th style={styles.cell}>Status</th>
                    <th style={styles.cell}>Submitted</th>
                    <th style={styles.cell}>Approved</th>
                  </tr>
                </thead>
                <tbody>
                  {weekendHistory.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: 12 }}>
                        No weekend entries
                      </td>
                    </tr>
                  ) : (
                    weekendHistory.map((w) => (
                      <tr key={w._id}>
                        <td style={styles.cell}>{String(w.date).slice(0, 10)}</td>
                        <td style={styles.cell}>{w.reason}</td>
                        <td style={styles.cell}>
                          <span
                            style={{
                              ...styles.badge,
                              backgroundColor:
                                w.status === "approved" ? "#28a745" : w.status === "rejected" ? "#dc3545" : "#17a2b8",
                            }}
                          >
                            {w.status?.charAt(0).toUpperCase() + w.status?.slice(1)}
                          </span>
                        </td>
                        <td style={styles.cell}>{w.submittedAt ? new Date(w.submittedAt).toLocaleString() : "—"}</td>
                        <td style={styles.cell}>{w.approvedAt ? new Date(w.approvedAt).toLocaleString() : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {activeTab === "reopen" && (
        <div style={styles.tableWrapper}>
          {reopenLoading ? (
            <p>Loading reopen requests…</p>
          ) : (
            <>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.cell}>Date</th>
                    {userRole === "admin" && <th style={styles.cell}>Employee</th>}
                    <th style={styles.cell}>Reason</th>
                    <th style={styles.cell}>Status</th>
                    <th style={styles.cell}>Submitted</th>
                    <th style={styles.cell}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reopenRequests.length === 0 ? (
                    <tr>
                      <td colSpan={userRole === "admin" ? "6" : "5"} style={{ textAlign: "center", padding: 12 }}>
                        No reopen requests
                      </td>
                    </tr>
                  ) : (
                    reopenRequests.map((r) => (
                      <tr key={r._id}>
                        <td style={styles.cell}>{String(r.date).slice(0, 10)}</td>
                        {userRole === "admin" && <td style={styles.cell}>{r.employeeUsername || r.employee?.username || "—"}</td>}
                        <td style={styles.cell}>{r.reason}</td>
                        <td style={styles.cell}>
                          <span
                            style={{
                              ...styles.badge,
                              backgroundColor:
                                r.status === "approved" ? "#28a745" : r.status === "rejected" ? "#dc3545" : "#ffc107",
                            }}
                          >
                            {r.status?.charAt(0).toUpperCase() + r.status?.slice(1)}
                          </span>
                        </td>
                        <td style={styles.cell}>{r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}</td>
                        <td style={styles.cell}>
                          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                            {/* Admin actions */}
                            {userRole === "admin" && r.status !== "approved" && r.status !== "rejected" && (
                              <>
                                <button onClick={() => reviewReopenRequest(r._id, "approved")} style={styles.submitBtn}>
                                  Approve
                                </button>
                                <button onClick={() => reviewReopenRequest(r._id, "rejected")} style={styles.closeBtn}>
                                  Reject
                                </button>
                              </>
                            )}

                            {/* Employee: show withdraw? (not implemented on backend) */}
                            {userRole !== "admin" && (
                              <span style={{ fontSize: 12 }}>{r.status}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- helpers ---------- */
function getWeekendDatesAround(weekStart) {
  const out = [];
  const addDate = (d) => out.push(d.toISOString().slice(0, 10));
  [-7, 0, 7].forEach((offset) => {
    const start = new Date(weekStart);
    start.setDate(start.getDate() + offset);
    const sat = new Date(start);
    sat.setDate(start.getDate() + 6); // Saturday
    const sun = new Date(start);
    sun.setDate(start.getDate() + 0); // Sunday
    addDate(sun);
    addDate(sat);
  });
  return [...new Set(out)].sort();
}

/* ---------- styles ---------- */
const styles = {
popupOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 },
  popup: { background: "#fff", padding: "1.2rem", borderRadius: "10px", width: 420, boxShadow: "0 5px 15px rgba(0,0,0,0.3)" },
 card: { background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", maxWidth: 520 },
  alertOk: { background: "#e7f7ee", border: "1px solid #bfe7cf", color: "#1e7e34", padding: "10px 12px", borderRadius: 8, marginBottom: 8 },
  alertDanger: { background: "#ffecec", border: "1px solid #ffc9c9", color: "#a70f0f", padding: "10px 12px", borderRadius: 8, marginBottom: 8 },
 container: {
    padding: "2rem",
    fontFamily: "Segoe UI, system-ui, -apple-system, sans-serif",
    backgroundColor: "#f4f6f9",
    minHeight: "100vh",
  },
  title: {
    fontSize: "2rem",
    color: "#2c3e50",
    marginBottom: "1.5rem",
    fontWeight: 800,
    letterSpacing: "-0.5px",
  },
  tabs: { display: "flex", gap: 8, marginBottom: 20 },
  tab: {
    padding: "10px 16px",
    borderRadius: 8,
    border: "1px solid #dee2e6",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 500,
    transition: "all 0.2s ease",
  },
  tabActive: {
    background: "linear-gradient(135deg, #007bff, #0056b3)",
    color: "#fff",
    borderColor: "#007bff",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
  },
  weekControls: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "0.8rem",
    marginBottom: "1rem",
  },
  navBtn: {
    padding: "8px 14px",
    background: "linear-gradient(135deg, #17a2b8, #138496)",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 500,
    transition: "opacity 0.2s ease",
  },
  holidayBtn: {
    background: "linear-gradient(135deg, #007bff, #0056b3)",
    color: "#fff",
    padding: "8px 14px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 500,
  },
  weekText: { fontWeight: "bold", fontSize: "1rem" },
  tableWrapper: {
    overflowX: "auto",
    borderRadius: "10px",
    background: "#fff",
    marginTop: 8,
    boxShadow: "0 3px 12px rgba(0,0,0,0.05)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.95rem",
    textAlign: "center",
  },
  cell: {
    padding: "12px 10px",
    borderBottom: "1px solid #f0f0f0",
  },
  input: {
    padding: "7px",
    fontSize: "0.9rem",
    border: "1px solid #ccc",
    borderRadius: "5px",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.2s ease",
  },
  badge: {
    padding: "4px 12px",
    borderRadius: "20px",
    color: "#fff",
    fontSize: "0.85rem",
    fontWeight: 500,
    display: "inline-block",
  },
  saveBtn: {
    marginTop: "1rem",
    padding: "12px 24px",
    background: "linear-gradient(135deg, #28a745, #1e7e34)",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
  },
  secondaryBtn: {
    padding: "6px 10px",
    fontSize: "0.85rem",
    background: "#6f42c1",
    border: "none",
    borderRadius: "5px",
    color: "#fff",
    cursor: "pointer",
    transition: "opacity 0.2s ease",
  },
  submitBtn: {
    padding: "6px 10px",
    fontSize: "0.85rem",
    background: "#17a2b8",
    border: "none",
    borderRadius: "5px",
    color: "#fff",
    cursor: "pointer",
    transition: "opacity 0.2s ease",
  },
  reopenBtn: {
    padding: "6px 10px",
    fontSize: "0.85rem",
    background: "#ffc107",
    border: "none",
    borderRadius: "5px",
    color: "#000",
    cursor: "pointer",
    transition: "opacity 0.2s ease",
  },
  closeBtn: {
    padding: "6px 10px",
    fontSize: "0.85rem",
    background: "#dc3545",
    border: "none",
    borderRadius: "5px",
    color: "#fff",
    cursor: "pointer",
  },
  holidayRow: {
    backgroundColor: "#fff9e6",
  },
};
