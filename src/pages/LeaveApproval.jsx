import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const users = JSON.parse(localStorage.getItem("user") || "{}");
const managerName = users?.username || "admin";
const token = users?.token;
const API_BASE_Test = "https://nexografix-srv.onrender.com";

const PendingLeaveApprovals = () => {
  const [timesheets, setTimesheets] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState([]);

  useEffect(() => {
    if (!token || !managerName) return;

    fetch(`${API_BASE_Test}/api/leaves/manager/${managerName}/approvals`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => setTimesheets(data.timesheets))
      .catch(err => console.error(err));
  }, []);

  const toggleSelect = (id) => {
    setSelectedRecords(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleApproval = async (id, action) => {
    try {
      const res = await fetch(`${API_BASE_Test}/api/leaves/${action}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed");
      alert(`Timesheet ${action}d`);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkApproval = async (action) => {
    if (selectedRecords.length === 0) return alert("Select at least one record");

    try {
      const res = await fetch(`${API_BASE_Test}/api/leaves/bulk-${action}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ ids: selectedRecords })
      });
      if (!res.ok) throw new Error("Failed");
      alert(`Selected timesheets ${action}d`);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
    <h2 style={{ margin: 0 }}>Pending Leave Approvals</h2>
    <Link to="/home" style={{ color: "#000000ff", textDecoration: "none" }}>← Back to Home</Link>
  </div>
      {/* Bulk action buttons */}
      <div style={{ marginBottom: 10 }}>
        <button
          style={{ marginRight: 8, background: "green", color: "white", padding: "5px 10px" }}
          onClick={() => handleBulkApproval("approve")}
          disabled={selectedRecords.length === 0}
        >
          Approve Selected
        </button>
        <button
          style={{ background: "red", color: "white", padding: "5px 10px" }}
          onClick={() => handleBulkApproval("reject")}
          disabled={selectedRecords.length === 0}
        >
          Reject Selected
        </button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
        <thead>
          <tr style={{ background: "#f1f1f1" }}>
            <th style={{ padding: 10, border: "1px solid #ddd" }}>Select</th>
            <th style={{ padding: 10, border: "1px solid #ddd" }}>Employee</th>
            <th style={{ padding: 10, border: "1px solid #ddd" }}>From Date</th>
            <th style={{ padding: 10, border: "1px solid #ddd" }}>To Date</th>
            <th style={{ padding: 10, border: "1px solid #ddd" }}>Leave Days</th>
            <th style={{ padding: 10, border: "1px solid #ddd" }}>Leave Type</th>
            <th style={{ padding: 10, border: "1px solid #ddd" }}>Reason</th>
            <th style={{ padding: 10, border: "1px solid #ddd" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {timesheets.map((t) => (
            <tr key={t.id}>
              <td style={{ padding: 10, border: "1px solid #ddd" }}>
                <input
                  type="checkbox"
                  checked={selectedRecords.includes(t.id)}
                  onChange={() => toggleSelect(t.id)}
                />
              </td>
              <td style={{ padding: 10, border: "1px solid #ddd" }}>{t.employeeId?.username}</td>
              <td style={{ padding: 10, border: "1px solid #ddd" }}>{t.fromDate.slice(0,10)}</td>
              <td style={{ padding: 10, border: "1px solid #ddd" }}>{t.toDate.slice(0,10)}</td>
              <td style={{ padding: 10, border: "1px solid #ddd" }}>{t.leaveDays}</td>
              <td style={{ padding: 10, border: "1px solid #ddd" }}>{t.leaveType}</td>
              <td style={{ padding: 10, border: "1px solid #ddd" }}>{t.reason}</td>
              <td style={{ padding: 10, border: "1px solid #ddd" }}>
                <button
                  style={{ marginRight: 8, background: "green", color: "white", padding: "5px 10px" }}
                  onClick={() => handleApproval(t.id, "approve")}
                >
                  Approve
                </button>
                <button
                  style={{ background: "red", color: "white", padding: "5px 10px" }}
                  onClick={() => handleApproval(t.id, "reject")}
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
          {timesheets.length === 0 && (
            <tr>
              <td colSpan="7" style={{ textAlign: "center", padding: 20 }}>
                ✅ No pending Leave approvals
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PendingLeaveApprovals;
