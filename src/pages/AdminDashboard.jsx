import React, { useState, useEffect } from "react";
import { ShieldCheck, Users, Hospital, Activity, FileText, Check, X, LogOut, ArrowRightLeft } from "lucide-react";

export default function AdminDashboard({ currentUser, onLogout, onSwitchToPatient }) {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);

  async function loadAdminData() {
    try {
      const [overviewRes, hospRes, usersRes, logsRes] = await Promise.all([
        fetch("http://localhost:5000/api/admin/overview"),
        fetch("http://localhost:5000/api/hospitals"),
        fetch("http://localhost:5000/api/admin/users"),
        fetch("http://localhost:5000/api/admin/audit-logs"),
      ]);

      const [overviewData, hospData, usersData, logsData] = await Promise.all([
        overviewRes.json(),
        hospRes.json(),
        usersRes.json(),
        logsRes.json(),
      ]);

      if (overviewData.success) setStats(overviewData.stats);
      if (hospData.success) setHospitals(hospData.hospitals);
      if (usersData.success) setUsers(usersData.users);
      if (logsData.success) setLogs(logsData.logs);
    } catch (err) {
      console.error("Failed loading admin panel data:", err);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function toggleHospitalVerification(hospitalId, currentStatus) {
    await fetch(`http://localhost:5000/api/admin/hospitals/${hospitalId}/verify`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminEmail: currentUser?.email, status: !currentStatus }),
    });
    loadAdminData();
  }

  async function changeUserRole(userId, newRole) {
    await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole, adminEmail: currentUser?.email }),
    });
    loadAdminData();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-8 border-b border-slate-800 gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-purple-400 font-bold">SYSTEM ADMINISTRATOR</span>
          <h1 className="text-3xl font-bold mt-1">Smart Hospital Network Command Center</h1>
          <p className="text-sm text-slate-400">Master Governance, Verification & Audit Trails</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onSwitchToPatient} className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800">
            <ArrowRightLeft size={16} /> Patient View
          </button>
          <button onClick={onLogout} className="flex items-center gap-2 bg-red-600/20 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600/30">
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 mt-6 border-b border-slate-800 pb-3">
        {["overview", "hospitals", "users", "audit"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition ${
              tab === t ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 1. Overview */}
      {tab === "overview" && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <span className="text-slate-400 text-sm">Registered Hospitals</span>
            <p className="text-3xl font-bold mt-2">{stats.totalHospitals}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <span className="text-slate-400 text-sm">Verified Facilities</span>
            <p className="text-3xl font-bold mt-2 text-green-400">{stats.verifiedHospitals}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <span className="text-slate-400 text-sm">Registered Accounts</span>
            <p className="text-3xl font-bold mt-2 text-blue-400">{stats.totalUsers}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <span className="text-slate-400 text-sm">Appointments Logged</span>
            <p className="text-3xl font-bold mt-2 text-purple-400">{stats.totalAppointments}</p>
          </div>
        </div>
      )}

      {/* 2. Hospital Management */}
      {tab === "hospitals" && (
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Hospitals Verification & Onboarding</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-400 uppercase text-xs">
                <tr>
                  <th className="pb-3">Hospital Name</th>
                  <th className="pb-3">Location</th>
                  <th className="pb-3">Beds</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {hospitals.map((h) => (
                  <tr key={h._id || h.id}>
                    <td className="py-4 font-bold">{h.name}</td>
                    <td className="py-4 text-slate-400">{h.location}</td>
                    <td className="py-4">{h.beds} beds</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        h.verified ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"
                      }`}>
                        {h.verified ? "Verified" : "Pending Verification"}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => toggleHospitalVerification(h._id || h.id, h.verified)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                          h.verified ? "bg-red-600/30 text-red-300" : "bg-green-600 text-white"
                        }`}
                      >
                        {h.verified ? "Revoke Verification" : "Approve & Verify"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. User & Role Management */}
      {tab === "users" && (
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">User & Access Control (RBAC)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-400 uppercase text-xs">
                <tr>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Current Role</th>
                  <th className="pb-3 text-right">Assign Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="py-4 font-bold">{u.name}</td>
                    <td className="py-4 text-slate-400">{u.email}</td>
                    <td className="py-4 capitalize font-semibold text-blue-400">{u.role}</td>
                    <td className="py-4 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => changeUserRole(u._id, e.target.value)}
                        className="bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-xl text-xs"
                      >
                        <option value="patient">Patient</option>
                        <option value="hospital">Hospital Staff</option>
                        <option value="admin">System Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Audit Logs */}
      {tab === "audit" && (
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">System Audit Trail</h2>
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log._id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center text-sm">
                <div>
                  <span className="font-bold text-purple-400">{log.action}</span>
                  <p className="text-slate-400 text-xs mt-1">{log.details}</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>{log.performedBy}</p>
                  <p>{new Date(log.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}