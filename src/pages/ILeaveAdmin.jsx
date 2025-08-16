
import React, { useEffect, useState } from "react";

export default function iLeaveAdmin() {
  const [leaveRequests, setLeaveRequests] = useState([]);

  useEffect(() => {
    const savedLeaves = localStorage.getItem("employeeLeaves");
    if (savedLeaves) {
      setLeaveRequests(JSON.parse(savedLeaves));
    }
  }, []);

  const updateStatus = (index, newStatus) => {
    const updated = [...leaveRequests];
    updated[index].status = newStatus;
    setLeaveRequests(updated);
    localStorage.setItem("employeeLeaves", JSON.stringify(updated));
  };

  return (
    <div style={styles.wrapper}>
      <h2>🗂 Admin Leave Dashboard</h2>

      <table style={styles.table}>
        <thead>
          <tr>
            <th>Type</th>
            <th>From</th>
            <th>To</th>
            <th>Days</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {leaveRequests.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: "center" }}>No leave requests found</td>
            </tr>
          ) : (
            leaveRequests.map((req, idx) => (
              <tr key={idx}>
                <td>{req.leaveType}</td>
                <td>{req.fromDate}</td>
                <td>{req.toDate}</td>
                <td>{req.days}</td>
                <td>{req.reason}</td>
                <td>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: req.status === "Approved" ? "green" :
                      req.status === "Rejected" ? "red" : "#f0ad4e"
                  }}>
                    {req.status}
                  </span>
                </td>
                <td>
                  {req.status === "Pending" ? (
                    <>
                      <button
                        onClick={() => updateStatus(idx, "Approved")}
                        style={{ ...styles.btn, backgroundColor: "green" }}>
                        Approve
                      </button>
                      <button
                        onClick={() => updateStatus(idx, "Rejected")}
                        style={{ ...styles.btn, backgroundColor: "red" }}>
                        Reject
                      </button>
                    </>
                  ) : (
                    <span style={{ fontStyle: "italic", color: "#555" }}>No action</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  wrapper: { padding: "2rem", maxWidth: "1000px", margin: "0 auto" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },
  statusBadge: {
    padding: "5px 10px",
    borderRadius: "12px",
    color: "white",
    fontSize: "0.9rem"
  },
  btn: {
    border: "none",
    color: "white",
    padding: "5px 10px",
    marginRight: "5px",
    cursor: "pointer",
    borderRadius: "5px"
  }
};
