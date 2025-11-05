import React, { useContext } from "react";
import { AuthContext } from "../AuthContext";
export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  return (
    <div>
      <h1>Welcome, {user?.name} ({user?.role})</h1>
      <button onClick={logout}>Logout</button>
      {/* conditionally render UI by role */}
      {user?.role === "Doctor" && <div>Doctor panel</div>}
      {user?.role === "Admin" && <div>Admin panel</div>}
      {user?.role === "Patient" && <div>Patient panel</div>}
    </div>
  );
}
