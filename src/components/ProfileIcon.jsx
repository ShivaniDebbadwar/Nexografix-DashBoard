import React, { useState, useRef, useEffect } from "react";

export default function ProfileIcon({ username }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={styles.profileContainer} ref={profileRef}>
      <div
        style={styles.profileIcon}
        onClick={() => setShowProfileMenu((prev) => !prev)}
        title="Profile"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="28"
          viewBox="0 0 24 24"
          width="28"
          fill="#4a90e2"
        >
          <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z" />
        </svg>
      </div>
      {showProfileMenu && (
        <div style={styles.profileDropdown}>
          <p style={{ margin: 0, fontWeight: "bold" }}>{username}</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    padding: "2rem",
    fontFamily: "Arial",
    textAlign: "center",
    position: "relative",
    minHeight: "100vh",
    backgroundColor: "#f5f6fa",
  },
  profileContainer: {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    userSelect: "none",
  },
  profileIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#e1ecff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    boxShadow: "0 0 5px rgba(74,144,226,0.5)",
    position: "relative", // keep relative for absolute dropdown
  },
  profileDropdown: {
    position: "absolute", // make it float
    top: "calc(100% + 8px)", // just below the icon
    right: 0,
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "10px 20px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
    textAlign: "center",
    minWidth: "140px",
    zIndex: 2000,
  },
};
