import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import ProfileIcon from "../components/ProfileIcon";

const API_BASE = "https://nexografix-srv.onrender.com/api/leaves"; // change if your server URL is different
const LEAVE_TYPES = [
  { value: "casual", label: "Casual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "earned", label: "Earned Leave" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
  { value: "comp-off", label: "Comp Off" },
  { value: "other", label: "Other" },
];

export default function EmployeeLeave() {
  // expects localStorage.user = { token: "JWT...", ... }
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = user?.token;
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  const username = user?.username || "Employee";

  // form
  const [leaveType, setLeaveType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");

  // ui
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  // helpers
  const normalize = (dStr) => {
    const d = new Date(dStr);
    if (Number.isNaN(d)) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const invalidRange = useMemo(() => {
    const f = normalize(fromDate);
    const t = normalize(toDate);
    return f && t && t < f;
  }, [fromDate, toDate]);
  const days = useMemo(() => {
    const f = normalize(fromDate);
    const t = normalize(toDate);
    if (!f || !t) return 0;
    const diff = (t - f) / (1000 * 60 * 60 * 24);
    return diff < 0 ? 0 : diff + 1; // inclusive
  }, [fromDate, toDate]);

  // load history
  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await axios.get(`${API_BASE}/history`, { headers: authHeader });
      setHistory(data.leaves || []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load leave history.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // submit
  const submitRequest = async (e) => {
    e.preventDefault();
    setOk("");
    if (!leaveType || !fromDate || !toDate || !reason) {
      setError("Please fill all required fields.");
      return;
    }
    if (invalidRange || days <= 0) return;

    try {
      setSubmitting(true);
      setError("");
      await axios.post(
        `${API_BASE}/request`,
        { leaveType, reason, fromDate, toDate, attachmentUrl },
        { headers: authHeader }
      );
      setOk("Leave request submitted.");
      setLeaveType("");
      setFromDate("");
      setToDate("");
      setReason("");
      setAttachmentUrl("");
      await fetchHistory();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <ProfileIcon username={username} />
      <h2 style={{ marginBottom: 16 }}>📅 Apply for Leave</h2>

      {error && <div style={styles.alertError}>{error}</div>}
      {ok && <div style={styles.alertOk}>{ok}</div>}

      <form onSubmit={submitRequest} style={styles.form}>
        <div style={styles.field}>
          <label>Leave Type <span style={styles.req}>*</span></label>
          <select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            required
            style={styles.input}
          >
            <option value="">-- Select Leave Type --</option>
            {LEAVE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
          <label>From Date <span style={styles.req}>*</span></label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            required
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label>To Date <span style={styles.req}>*</span></label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            required
            style={styles.input}
            min={fromDate || undefined}
          />
          {fromDate && toDate && (
            <small style={{ marginTop: 6, color: invalidRange ? "#dc3545" : "#555" }}>
              {invalidRange ? "“To Date” cannot be earlier than “From Date”." : `Days: ${days}`}
            </small>
          )}
        </div>

        <div style={styles.field}>
          <label>Reason <span style={styles.req}>*</span></label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label>Attachment URL (optional)</label>
          <input
            type="url"
            value={attachmentUrl}
            onChange={(e) => setAttachmentUrl(e.target.value)}
            style={styles.input}
            placeholder="https://..."
          />
        </div>

        <button
          type="submit"
          style={styles.button}
          disabled={submitting || invalidRange || days <= 0}
        >
          {submitting ? "Submitting..." : "Apply Leave"}
        </button>
      </form>

      <h3 style={{ marginTop: 32 }}>📜 Your Leave History</h3>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>From</th>
              <th style={styles.th}>To</th>
              <th style={styles.th}>Days</th>
              <th style={styles.th}>Reason</th>
              <th style={styles.th}>Attachment</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Comment</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: 12 }}>
                  No leave applications yet
                </td>
              </tr>
            ) : (
              history.map((lv) => {
                const id = lv.id || lv._id;
                const from = String(lv.fromDate).slice(0, 10);
                const to = String(lv.toDate).slice(0, 10);
                const d =
                  lv.leaveDays ??
                  Math.max(
                    0,
                    Math.floor((new Date(lv.toDate) - new Date(lv.fromDate)) / (1000 * 60 * 60 * 24)) + 1
                  );
                return (
                  <tr key={id}>
                    <td style={styles.td}>
                      {lv.leaveType ? lv.leaveType.replace(/(^.|-.)/g, (m) => m.toUpperCase()) : "—"}
                    </td>
                    <td style={styles.td}>{from}</td>
                    <td style={styles.td}>{to}</td>
                    <td style={styles.td}>{d}</td>
                    <td style={styles.td}>{lv.reason}</td>
                    <td style={styles.td}>
                      {lv.attachmentUrl ? (
                        <a href={lv.attachmentUrl} target="_blank" rel="noreferrer">View</a>
                      ) : "—"}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          backgroundColor:
                            lv.status === "approved" ? "#28a745"
                            : lv.status === "rejected" ? "#dc3545"
                            : "#f0ad4e",
                        }}
                      >
                        {lv.status?.charAt(0).toUpperCase() + lv.status?.slice(1)}
                      </span>
                    </td>
                    <td style={styles.td}>{lv.comment || "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles = {
  wrapper: { padding: "2rem", maxWidth: 900, margin: "0 auto" },
  form: { display: "grid", gap: "1rem", background: "#f9f9f9", padding: "1.5rem", borderRadius: 10 },
  field: { display: "flex", flexDirection: "column" },
  input: { padding: "8px 10px", fontSize: "1rem", borderRadius: 8, border: "1px solid #ccc", marginTop: 6 },
  button: { backgroundColor: "#007bff", color: "white", padding: "10px 16px", fontSize: "1rem", border: "none", borderRadius: 8, cursor: "pointer", width: 160 },
  req: { color: "red" },
  alertError: { marginBottom: 12, padding: "10px 12px", background: "#ffe9ea", border: "1px solid #ffccd1", color: "#b00020", borderRadius: 8 },
  alertOk: { marginBottom: 12, padding: "10px 12px", background: "#e8f7ee", border: "1px solid #b9e6c8", color: "#1e7e34", borderRadius: 8 },
  table: { width: "100%", marginTop: 12, borderCollapse: "separate", borderSpacing: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderRadius: 10, overflow: "hidden" },
  thead: { backgroundColor: "#f1f1f1" },
  th: { padding: 12, textAlign: "center", fontWeight: 600, borderBottom: "1px solid #ddd" },
  td: { padding: 12, textAlign: "center", borderBottom: "1px solid #eee", fontSize: "0.95rem" },
  badge: { padding: "5px 12px", borderRadius: 12, color: "#fff", fontSize: "0.85rem" },
};
