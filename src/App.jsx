import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ChangePassword from "./pages/ChangePassword";
import ForgotPassword from "./pages/ForgotPassword";
import ITimePage from "./pages/ITimePage";
import WeeklyTimesheet from "./pages/WeeklyTimesheet";
import IleaveAdmin from "./pages/iLeaveAdmin";
import IleaveEmployee from "./pages/iLeaveEmployee";
import EmployeesDailyAttendance from "./components/EmployeesDailyAttendance";
import TaskAssignForm from "./components/TaskAssignForm";
import TaskTracker from "./components/TaskTracker"; // Assuming you have a TaskTracker component
export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  const location = useLocation();

  // Update user state on route change
  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem("user")));
  }, [location]);

  const role = user?.role;
  const forceChange = user?.forceChangePassword === true || user?.forceChangePassword === "true";

  return (
    <Routes>
      <Route path="/" element={<LoginPage onLogin={(u) => setUser(u)} />} />
      <Route path="/home" element={<AdminDashboard />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/itime" element={<ITimePage />} />
      <Route path="/weekly-timesheet" element={<WeeklyTimesheet />} />
      <Route path="/ileave-admin" element={<IleaveAdmin />} />
      <Route path="/ileave" element={<IleaveEmployee />} />
      <Route path="/employee-details" element={<EmployeesDailyAttendance />} />
       <Route path="/task-assign" element={<TaskAssignForm />} />
        <Route path="/task-tracker" element={<TaskTracker />} />

      <Route
        path="/admin"
        element={role === "admin" && !forceChange ? <AdminDashboard /> : <Navigate to="/change-password" />}
      />
      <Route
        path="/employee"
        element={role === "employee" && !forceChange ? <EmployeeDashboard /> : <Navigate to="/change-password" />}
      />
    </Routes>
  );
}
