import React, { useState, useEffect } from 'react';

const ITimePage = () => {
    const role = localStorage.getItem('role');
    const [employeeName] = useState(localStorage.getItem('username') || ''); // For employee
    const [loginTime, setLoginTime] = useState('');
    const [logoutTime, setLogoutTime] = useState('');
    const [records, setRecords] = useState([]);

    useEffect(() => {
        const stored = localStorage.getItem('itimeRecords');
        if (stored) setRecords(JSON.parse(stored));
    }, []);

 const handleSubmit = (e) => {
  e.preventDefault();
  const date = new Date().toISOString().split("T")[0];

  const newRecord = {
    date,
    employee: employeeName,
    login: loginTime,
    logout: logoutTime,
    status: "Pending"  // ✅ this is required
  };

  const updated = [...records, newRecord];
  setRecords(updated);
  localStorage.setItem("itimeRecords", JSON.stringify(updated));

  setLoginTime('');
  setLogoutTime('');
};

    const handleApprove = (index) => {
        const updated = [...records];
        updated[index].status = "Approved";
        setRecords(updated);
        localStorage.setItem("itimeRecords", JSON.stringify(updated));
    };

    return (
        <div style={styles.wrapper}>
            <h2>🕒 {role === 'admin' ? 'All Employees Timesheet' : 'My Timesheet Entry'}</h2>

            {role === 'employee' && (
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label>Login Time <span style={styles.star}>*</span></label>
                        <input type="time" required value={loginTime} onChange={e => setLoginTime(e.target.value)} />
                    </div>
                    <div style={styles.inputGroup}>
                        <label>Logout Time <span style={styles.star}>*</span></label>
                        <input type="time" required value={logoutTime} onChange={e => setLogoutTime(e.target.value)} />
                    </div>
                    <button style={styles.btn}>Submit</button>
                </form>
            )}

            {/* Table for all */}
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Date</th>
                        <th>Login</th>
                        <th>Logout</th>
                        <th>Status</th>
                        {role === "admin" && <th>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {records.length === 0 ? (
                        <tr><td colSpan="6" align="center">No records found</td></tr>
                    ) : (
                        records
                            .filter(r => role === "admin" || r.employee === employeeName)
                            .map((r, idx) => (
                                <tr key={idx}>
                                    <td>{r.employee}</td>
                                    <td>{r.date}</td>
                                    <td>{r.login}</td>
                                    <td>{r.logout}</td>
                                    <td>
                                        <span style={{
                                            ...styles.badge,
                                            backgroundColor: r.status === "Approved" ? "#28a745" : "#ffc107"
                                        }}>
                                            {r.status}
                                        </span>
                                    </td>
                                    {role === "admin" && (
                                        <td>
                                            {r.status === "Pending" && (
                                                <button
                                                    onClick={() => handleApprove(idx)}
                                                    style={styles.approveBtn}
                                                >
                                                    Approve
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))
                    )}
                </tbody>
            </table>

        </div>
    );
};

const styles = {
    wrapper: {
        padding: '2rem', maxWidth: '800px', margin: 'auto', fontFamily: 'Arial'
    },
    form: {
        display: 'flex', gap: '1rem', marginBottom: '1.5rem'
    },
    inputGroup: {
        display: 'flex', flexDirection: 'column'
    },
    btn: {
        padding: '10px 15px', background: '#007bff', color: 'white',
        border: 'none', borderRadius: '5px', cursor: 'pointer'
    },
    table: {
        width: '100%', borderCollapse: 'collapse', marginTop: '1rem'
    },
    star: { color: 'red' },
    badge: {
        padding: "4px 10px",
        color: "white",
        borderRadius: "12px",
        fontSize: "0.85rem"
    },
    approveBtn: {
        background: "#007bff",
        color: "#fff",
        border: "none",
        padding: "5px 10px",
        borderRadius: "5px",
        cursor: "pointer"
    }

};

export default ITimePage;
