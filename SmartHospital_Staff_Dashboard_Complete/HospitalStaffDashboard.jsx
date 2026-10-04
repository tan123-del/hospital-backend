import React, { useState, useEffect } from "react";
import { Users, Bed, Clock, Calendar, Check, X, RefreshCw, LogOut, ArrowRightLeft } from "lucide-react";

export default function HospitalStaffDashboard({ currentUser, onLogout, onSwitchToPatient }) {
  const [appointments, setAppointments] = useState([]);
  const [bedCount, setBedCount] = useState(12);
  const [activeQueue, setActiveQueue] = useState(4);
  const [currentToken, setCurrentToken] = useState(102);

  // Load appointments requested at this hospital
  async function fetchHospitalAppointments() {
    try {
      const res = await fetch("http://localhost:5000/api/appointments");
      const data = await res.json();
      if (res.ok && data.appointments) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.error("Failed to load appointments:", err);
    }
  }

  useEffect(() => {
    fetchHospitalAppointments();
    const interval = setInterval(fetchHospitalAppointments, 10000);
    return () => clearInterval(interval);
  }, []);

  async function updateAppointmentStatus(id, newStatus) {
    try {
      const res = await fetch(`http://localhost:5000/api/appointments/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchHospitalAppointments();
      }
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  }

  function callNextPatient() {
    setCurrentToken((prev) => prev + 1);
    setActiveQueue((prev) => Math.max(0, prev - 1));
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-10">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-8 border-b border-slate-800">
        <div>
          <span className="text-xs uppercase tracking-wider text-blue-400 font-bold">STAFF PORTAL</span>
          <h1 className="text-3xl font-bold mt-1">{currentUser?.name || "Hospital Command Center"}</h1>
          <p className="text-sm text-slate-400">Indore Branch · Live Hospital Management & Triage</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onSwitchToPatient}
            className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-800 text-sm font-semibold"
          >
            <ArrowRightLeft size={16} /> Switch to Patient View
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-red-600/20 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-xl hover:bg-red-600/30 text-sm font-semibold"
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-sm">Available Beds</span>
            <Bed size={20} className="text-blue-400" />
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-bold">{bedCount}</span>
            <div className="flex gap-2">
              <button onClick={() => setBedCount((b) => Math.max(0, b - 1))} className="px-2.5 py-1 bg-slate-800 rounded-lg text-sm hover:bg-slate-700">-</button>
              <button onClick={() => setBedCount((b) => b + 1)} className="px-2.5 py-1 bg-slate-800 rounded-lg text-sm hover:bg-slate-700">+</button>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-sm">Current Token Calling</span>
            <Users size={20} className="text-green-400" />
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <span className="text-3xl font-bold text-green-400">Q{currentToken}</span>
            <button onClick={callNextPatient} className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-xl text-xs font-semibold">
              Call Next
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-sm">Waiting in OPD</span>
            <Clock size={20} className="text-yellow-400" />
          </div>
          <p className="text-3xl font-bold mt-3">{activeQueue} <span className="text-sm font-normal text-slate-400">patients</span></p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-sm">Pending Bookings</span>
            <Calendar size={20} className="text-purple-400" />
          </div>
          <p className="text-3xl font-bold mt-3">
            {appointments.filter((a) => a.status === "Pending").length}
          </p>
        </div>
      </div>

      {/* Appointment Approval Queue */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl mt-10 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">Incoming Patient Appointments</h2>
            <p className="text-sm text-slate-400">Real-time requests awaiting hospital approval</p>
          </div>
          <button onClick={fetchHospitalAppointments} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {appointments.length === 0 ? (
          <p className="text-slate-500 py-8 text-center">No appointment requests at this time.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-400 uppercase text-xs">
                <tr>
                  <th className="pb-3">Patient</th>
                  <th className="pb-3">Doctor / Dept</th>
                  <th className="pb-3">Date & Slot</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {appointments.map((appt) => (
                  <tr key={appt._id} className="hover:bg-slate-800/30 transition">
                    <td className="py-4">
                      <div className="font-semibold text-white">{appt.patientName}</div>
                      <div className="text-xs text-slate-500">{appt.patientEmail}</div>
                    </td>
                    <td className="py-4">
                      <div>{appt.doctor}</div>
                      <div className="text-xs text-blue-400">{appt.specialty}</div>
                    </td>
                    <td className="py-4">
                      <div>{appt.date}</div>
                      <div className="text-xs text-slate-400">{appt.time}</div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        appt.status === "Confirmed"
                          ? "bg-green-500/15 text-green-400 border border-green-500/20"
                          : appt.status === "Pending"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                          : "bg-red-500/15 text-red-400 border border-red-500/20"
                      }`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {appt.status === "Pending" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => updateAppointmentStatus(appt._id, "Confirmed")}
                            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-xl flex items-center gap-1 text-xs font-semibold"
                            title="Accept Appointment"
                          >
                            <Check size={16} /> Accept
                          </button>
                          <button
                            onClick={() => updateAppointmentStatus(appt._id, "Cancelled")}
                            className="bg-red-600/30 hover:bg-red-600/50 text-red-300 p-2 rounded-xl flex items-center gap-1 text-xs font-semibold"
                            title="Decline Appointment"
                          >
                            <X size={16} /> Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}