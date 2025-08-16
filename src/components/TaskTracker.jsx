import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { Link } from "react-router-dom";

const API_BASE = "https://nexografix-srv.onrender.com/api/tasksShown/all-tasks"; // replace with your endpoint
const API_BASE_USER = "https://nexografix-srv.onrender.com";                         
// "http://localhost:3000"// replace with your user endpoint
const TaskTracker = () => {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [employees, setEmployees] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10; // change as needed
  useEffect(() => {
  const fetchTasks = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user")); // get logged-in user
      const token = user?.token;

      const res = await axios.get(API_BASE, {
        headers: {
          Authorization: `Bearer ${token}`, // include token in request
        },
      });

      setTasks(res.data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  fetchTasks();
}, []);

useEffect(() => {
  const fetchEmployees = async () => {
    try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = user?.token;
        const res = await fetch(`${API_BASE_USER}/api/userGet`, {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch employees");
        const data = await res.json();
        setEmployees(data || []);
      } catch (err) {
        console.error(err);
      }
  };

  fetchEmployees();
}, []);

const filteredTasks = tasks
  .filter((task) =>
    search
      ? employees
          .filter((e) =>
            e.username.toLowerCase().includes(search.toLowerCase())
          )
          .some((e) => e._id === task.assignedTo)
      : true
  )
  .filter((task) =>
    statusFilter
      ? task.status.toLowerCase() === statusFilter.toLowerCase()
      : true
  )
  .filter((task) => {
    if (dateRange.start && dateRange.end) {
      const assigned = new Date(task.assignedDate);
      return (
        assigned >= new Date(dateRange.start) &&
        assigned <= new Date(dateRange.end)
      );
    }
    return true;
  });

const formatDateTime = (dateString, timeString) => {
  if (!dateString) return "-";
  const dateObj = new Date(dateString);

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");

  let hours = dateObj.getHours();
  let minutes = dateObj.getMinutes();
  hours = String(hours).padStart(2, "0");
  minutes = String(minutes).padStart(2, "0");

  // Use the timeString if provided, otherwise use hours:minutes from date
  const time = timeString ? timeString : `${hours}:${minutes}`;

  return `${year}-${month}-${day} ${time}`;
};

const formatForExcel = (dateStr, timeStr) => {
  const date = new Date(dateStr);
  if (!dateStr) return "";

  // Get YYYY-MM-DD
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  // Get HH:mm from timeStr
  let [hour, minute] = ["00", "00"];
  if (timeStr) {
    const t = timeStr.split(/[: ]/); // split by : or space (in case of am/pm)
    hour = t[0].padStart(2, "0");
    minute = t[1].padStart(2, "0");
  }

  return `${yyyy}-${mm}-${dd} ${hour}:${minute}`;
};


  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredTasks.map((t) => ({
        Employee: t.employeeName,
        Task: t.title,
        Description: t.description,
        File: t.fileUrl,
        Assigned: `${t.assignedDate} ${t.assignedTime}`,
        Submission: formatForExcel(t.submissionDate, t.submissionTime),
        Status: t.status,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");
    XLSX.writeFile(workbook, "TaskTracker.xlsx");
  };

  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
const goToPage = (pageNumber) => {
  if (pageNumber < 1) pageNumber = 1;
  if (pageNumber > totalPages) pageNumber = totalPages;
  setCurrentPage(pageNumber);
};

const paginationBtnStyle = {
  padding: "6px 12px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  cursor: "pointer",
};
  return (
    
  <div style={{ padding: "2rem", background: "#f9f9f9", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
    <h2 style={{ color: "#333" }}>📊 Task Tracker</h2>
    <Link
      to="/home"
      style={{
        padding: "8px 16px",
        borderRadius: "6px",
        background: "#007bff",
        color: "#fff",
        textDecoration: "none",
        textAlign: "center",
        cursor: "pointer"
      }}
    >
      ⬅ Back to Home
    </Link>
  </div>
    <h2 style={{ marginBottom: "1rem", color: "#333" }}>📊 Task Tracker</h2>

    {/* Filters and Export */}
    <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
      <input
        type="text"
        placeholder="Search by employee name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc", width: "200px" }}
      />

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
      >
        <option value="">All Status</option>
        <option value="inprogress">In Progress</option>
        <option value="started">Started</option>
        <option value="completed">Completed</option>
        <option value="pending">Pending</option>
      </select>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontWeight: "500" }}>Start Date:</span>
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
        />
        <span style={{ fontWeight: "500" }}>End Date:</span>
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
        />
      </div>

      <button
        onClick={exportToExcel}
        style={{ padding: "8px 16px", borderRadius: "6px", background: "#28a745", color: "#fff", border: "none", cursor: "pointer" }}
      >
        Export to Excel
      </button>
    </div>

    {/* Table */}
    <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #ddd" }}>
      <thead>
        <tr style={{ background: "#f0f0f0" }}>
          <th style={thStyle}>Employee</th>
          <th style={thStyle}>Task</th>
          <th style={thStyle}>Description</th>
          <th style={thStyle}>File</th>
          <th style={thStyle}>Assigned</th>
          <th style={thStyle}>Submission</th>
          <th style={thStyle}>Status</th>
        </tr>
      </thead>
      <tbody>
        {currentTasks.length === 0 ? (
          <tr>
            <td colSpan="7" style={{ textAlign: "center", padding: "12px", color: "#666" }}>No tasks found</td>
          </tr>
        ) : (
          currentTasks.map((task) => (
            <tr key={task._id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={tdStyle}>{task.employeeName}</td>
              <td style={tdStyle}>{task.title}</td>
              <td style={tdStyle}>{task.description}</td>
              <td style={tdStyle}>
                {task.fileUrl ? <a href={task.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#007bff" }}>Open</a> : "-"}
              </td>
              <td style={tdStyle}>{task.assignedDate} {task.assignedTime}</td>
              <td style={tdStyle}>{formatDateTime(task.submissionDate, task.submissionTime)}</td>
              <td style={tdStyle}>
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "20px",
                    color: "#fff",
                    backgroundColor:
                      task.status.toLowerCase() === "completed"
                        ? "#28a745"
                        : task.status.toLowerCase() === "started"
                        ? "#007bff"
                        : task.status.toLowerCase() === "inprogress"
                        ? "#ffc107"
                        : "#6c757d",
                    display: "inline-block",
                    fontSize: "0.9rem",
                    textTransform: "capitalize",
                  }}
                >
                  {task.status}
                </span>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>

    {/* Pagination */}
    <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap" }}>
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        style={{ ...paginationBtnStyle }}
      >
        Prev
      </button>
      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i}
          onClick={() => goToPage(i + 1)}
          style={{
            ...paginationBtnStyle,
            background: currentPage === i + 1 ? "#007bff" : "#f0f0f0",
            color: currentPage === i + 1 ? "#fff" : "#333",
          }}
        >
          {i + 1}
        </button>
      ))}
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{ ...paginationBtnStyle }}
      >
        Next
      </button>
    </div>
  </div>
);

};

const thStyle = { padding: "8px", textAlign: "left", borderBottom: "1px solid #ddd" };
const tdStyle = { padding: "8px", textAlign: "left", verticalAlign: "top" };
const labelText = { fontSize: "12px", fontWeight: 600, width: "6rem", marginLeft: "10px" };

export default TaskTracker;
