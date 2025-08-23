import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const TaskAssignForm = () => {
  const [form, setForm] = useState({
    employeeName: "",
    assignedTo: "",
    taskName: "",
    description: "",
    assignedDate: new Date().toISOString().split("T")[0],
    assignedTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    submissionDate: "",
    submissionTime: "",
  });

  // Dynamic file rows (PDF + Excel)
  const [fileRows, setFileRows] = useState([{ pdfUrl: "", excelUrl: "" }]);

  const [employees, setEmployees] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_BASE = "https://nexografix-srv.onrender.com";

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const token = user?.token;
        const res = await fetch(`${API_BASE}/api/userGet`, {
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

  const filteredEmployees = employees.filter((emp) =>
    (emp.username || emp.name || "").toLowerCase().includes(form.employeeName.toLowerCase())
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // File row functions
  const handleFileRowChange = (index, field, value) => {
    const newRows = [...fileRows];
    newRows[index][field] = value;
    setFileRows(newRows);
  };

  const handleAddRow = () => {
    setFileRows([...fileRows, { pdfUrl: "", excelUrl: "" }]);
  };

  const handleDeleteRow = (index) => {
    const newRows = fileRows.filter((_, i) => i !== index);
    setFileRows(newRows);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!form.assignedTo) return alert("Please select an employee from the list");
    if (!form.taskName) return alert("Task name is required");
    // if (!form.description) return alert("Task description is required");
    if (fileRows.length === 0 || fileRows.some(row => !row.pdfUrl || !row.excelUrl)) {
      return alert("Please provide both PDF and Excel file URLs");
    }
    if (!form.submissionDate) return alert("Submission date is required");
    if (!form.submissionTime) return alert("Submission time is required");

    setLoading(true);

    try {
      const payload = {
        title: form.taskName,
        // description: form.description,
        employeeName: form.employeeName,
        assignedTo: form.assignedTo,
        fileRows, // new field instead of fileURL
        assignedDate: form.assignedDate,
        assignedTime: form.assignedTime,
        submissionDate: form.submissionDate,
        submissionTime: form.submissionTime,
      };

      const res = await fetch(`${API_BASE}/api/tasks/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      alert("✅ Task assigned successfully and email sent to employee!");
      setForm({
        employeeName: "",
        assignedTo: "",
        taskName: "",
        // description: "",
        assignedDate: new Date().toISOString().split("T")[0],
        assignedTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        submissionDate: "",
        submissionTime: "",
      });
      setFileRows([{ pdfUrl: "", excelUrl: "" }]);
    } catch (err) {
      alert("❌ Error assigning task: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
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
      <h2 style={styles.title}>📝 Assign Task</h2>
      <form onSubmit={handleSubmit} style={styles.form}>

        {/* Employee Name */}
        <div style={styles.field}>
          <label>
            Employee Name <span style={styles.req}>*</span>
          </label>
          <input
            type="text"
            name="employeeName"
            placeholder="Type to search..."
            value={form.employeeName}
            onChange={(e) => {
              handleChange(e);
              setShowDropdown(true);
            }}
            style={styles.input}
            autoComplete="off"
          />

          {showDropdown && form.employeeName && (
            <div style={styles.dropdown}>
              {filteredEmployees.length === 0 ? (
                <div style={styles.noMatch}>No match found</div>
              ) : (
                filteredEmployees.map((emp) => (
                  <div
                    key={emp._id}
                    style={styles.dropdownItem}
                    onClick={() => {
                      setForm({
                        ...form,
                        employeeName: emp.username || emp.name,
                        assignedTo: emp._id,
                      });
                      setShowDropdown(false);
                    }}
                  >
                    {emp.username || emp.name} ({emp.email})
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Task Name */}
        <div style={styles.field}>
          <label>
            Task Name <span style={styles.req}>*</span>
          </label>
          <input type="text" name="taskName" value={form.taskName} onChange={handleChange} style={styles.input} />
        </div>

        {/* Task Description */}
        {/* <div style={styles.fieldFull}>
          <label>
            Task Description <span style={styles.req}>*</span>
          </label>
          <textarea name="description" value={form.description} onChange={handleChange} rows="4" style={styles.textarea}></textarea>
        </div> */}

        {/* File Rows */}
        <div style={{ flex: "1 1 100%" }}>
          <label>Files (PDF & Excel) <span style={styles.req}>*</span></label>
          {fileRows.map((row, index) => (
            <div key={index} style={{ display: "flex", gap: "10px", marginTop: "10px", alignItems: "center" }}>
              <input
                type="url"
                placeholder="PDF File URL"
                value={row.pdfUrl}
                onChange={(e) => handleFileRowChange(index, "pdfUrl", e.target.value)}
                style={styles.input}
              />
              <input
                type="url"
                placeholder="Excel File URL"
                value={row.excelUrl}
                onChange={(e) => handleFileRowChange(index, "excelUrl", e.target.value)}
                style={styles.input}
              />
              <input name="description" value={row.description}  onChange={(e) => handleFileRowChange(index, "description", e.target.value)} rows="4" style={styles.textarea} placeholder="No of Images"></input>
       
              {fileRows.length > 1 && (
                <button type="button" onClick={() => handleDeleteRow(index)} style={styles.deleteBtn}>❌</button>
              )}
            </div>
          ))}
          <button type="button" onClick={handleAddRow} style={styles.addBtn}>➕ Add File</button>
        </div>

        {/* Assigned Date */}
        <div style={styles.field}>
          <label>Assigned Date</label>
          <input type="date" name="assignedDate" value={form.assignedDate} onChange={handleChange} style={styles.input} />
        </div>

        {/* Assigned Time */}
        <div style={styles.field}>
          <label>Assigned Time</label>
          <input name="assignedTime" value={form.assignedTime} onChange={handleChange} style={styles.input} />
        </div>

        {/* Submission Date */}
        <div style={styles.field}>
          <label>
            Submission Date <span style={styles.req}>*</span>
          </label>
          <input type="date" name="submissionDate" value={form.submissionDate} onChange={handleChange} style={styles.input} />
        </div>

        {/* Submission Time */}
        <div style={styles.field}>
          <label>
            Submission Time <span style={styles.req}>*</span>
          </label>
          <input type="time" name="submissionTime" value={form.submissionTime} onChange={handleChange} style={styles.input} />
        </div>

        {/* Submit Button */}
        <div style={styles.buttonWrapper}>
          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? "Assigning..." : "Assign Task"}
          </button>
        </div>
      </form>
    </div>
  );
};

const styles = {
  wrapper: {
    backgroundColor: "#f4f9ff",
    padding: "2rem",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    maxWidth: "800px",
    margin: "auto",
  },
  title: {
    textAlign: "center",
    marginBottom: "1.5rem",
    color: "#1e90ff",
  },
  form: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1.5rem",
  },
  field: {
    flex: "1 1 45%",
    display: "flex",
    flexDirection: "column",
    position: "relative",
  },
  fieldFull: {
    flex: "1 1 100%",
    display: "flex",
    flexDirection: "column",
  },
  input: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "1rem",
    marginTop: "5px",
    flex: 1,
  },
  textarea: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "1rem",
    marginTop: "5px",
    resize: "vertical",
  },
  req: { color: "red" },
  addBtn: {
    marginTop: "10px",
    padding: "6px 12px",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  deleteBtn: {
    padding: "6px 10px",
    backgroundColor: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  buttonWrapper: {
    flex: "1 1 100%",
    textAlign: "center",
    marginTop: "1.5rem",
  },
  submitBtn: {
    padding: "12px 25px",
    backgroundColor: "#007bff",
    color: "#fff",
    fontSize: "1rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    background: "#fff",
    border: "1px solid #ccc",
    maxHeight: "150px",
    overflowY: "auto",
    zIndex: 1000,
    width: "100%",
    borderRadius: "5px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  dropdownItem: {
    padding: "8px 10px",
    cursor: "pointer",
    borderBottom: "1px solid #eee",
  },
  noMatch: {
    padding: "10px",
    color: "#999",
    textAlign: "center",
  },
};

export default TaskAssignForm;
