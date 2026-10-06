import { API_BASE_URL } from "./api";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock3,
  Hospital,
  LogOut,
  MapPin,
  Search,
  ShieldCheck,
  ShieldAlert,
  User,
  Users,
} from "lucide-react";

import PatientDashboard from "./pages/PatientDashboard";
import HospitalStaffDashboard from "../SmartHospital_Staff_Dashboard_Complete/HospitalStaffDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("smartHospitalUser")) || null;
    } catch {
      return null;
    }
  });

  const [page, setPageState] = useState(() => {
    const user = JSON.parse(localStorage.getItem("smartHospitalUser") || "null");
    if (!user) return "auth";
    if (user.role === "admin") return "admin-dashboard";
    return user.role === "hospital" ? "hospital-dashboard" : "dashboard";
  });

  function navigateTo(newPage) {
    window.history.pushState({ page: newPage }, "", `#${newPage}`);
    setPageState(newPage);
    window.scrollTo(0, 0);
  }

  function handleLogout() {
    setCurrentUser(null);
    setAppointment(null);
    setQueueData(null);
    localStorage.removeItem("smartHospitalToken");
    localStorage.removeItem("smartHospitalUser");
    localStorage.removeItem("smartHospitalAppointment");
    navigateTo("auth");
  }

  useEffect(() => {
    window.history.replaceState({ page }, "", `#${page}`);
    function handlePopState(e) {
      if (e.state && e.state.page) {
        setPageState(e.state.page);
      } else {
        if (!currentUser) setPageState("auth");
        else if (currentUser.role === "admin") setPageState("admin-dashboard");
        else if (currentUser.role === "hospital") setPageState("hospital-dashboard");
        else setPageState("dashboard");
      }
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentUser]);

  const [hospitalsList, setHospitalsList] = useState([]);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("All Specialties");
  const [status, setStatus] = useState("All");
  const [selectedHospital, setSelectedHospital] = useState(null);

  const [appointment, setAppointment] = useState(() => {
    try {
      const saved = localStorage.getItem("smartHospitalAppointment");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [queueData, setQueueData] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Fetch live hospitals from MongoDB
  async function loadHospitals() {
    try {
      const res = await fetch("http://localhost:5000/api/hospitals");
      const data = await res.json();
      if (res.ok && data.hospitals) {
        const formatted = data.hospitals.map((h, i) => ({
          id: h._id || i + 10,
          _id: h._id,
          name: h.name,
          location: h.location || "Indore, Madhya Pradesh",
          address: h.address || `${h.name}, Indore`,
          phone: h.phone || "+91 98765 00000",
          distance: h.distance || "2.5 km",
          rating: h.rating || 4.6,
          reviews: h.reviews || 100,
          specialties: h.specialties?.length ? h.specialties : ["Cardiology", "General Medicine"],
          services: h.services?.length ? h.services : ["Emergency", "Diagnostics", "Pharmacy"],
          wait: h.wait || "15 min",
          queue: h.queue ?? 5,
          beds: h.beds ?? 12,
          emergency: h.emergency || "Available",
          status: h.status || "Open",
          verified: h.verified ?? true,
          doctors: h.doctors?.length ? h.doctors : [
            { name: `Dr. Officer`, specialty: "General Medicine", qualification: "MBBS", availability: "Available today", verified: true }
          ],
        }));
        setHospitalsList(formatted);
      }
    } catch (err) {
      console.error("DB hospital fetch failed:", err);
    }
  }

  // Poll & fetch live queue from backend at runtime
  async function syncQueueStatus() {
    if (!currentUser?.email) return;
    try {
      const res = await fetch(`http://localhost:5000/api/queue/status?email=${encodeURIComponent(currentUser.email)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.active) setQueueData(data.queue);
        else setQueueData(null);
      }
    } catch (err) {
      console.error("Queue sync error:", err);
    }
  }

  useEffect(() => {
    loadHospitals();
  }, []);

  useEffect(() => {
    syncQueueStatus();
    const interval = setInterval(syncQueueStatus, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Sync Appointments
  useEffect(() => {
    async function fetchAppointments() {
      if (!currentUser?.email) return;
      try {
        const res = await fetch(`http://localhost:5000/api/appointments?email=${encodeURIComponent(currentUser.email)}`);
        const data = await res.json();
        if (res.ok && data.appointments?.length > 0) {
          const active = data.appointments.find((a) => a.status !== "Cancelled");
          if (active) setAppointment(active);
        }
      } catch (err) {
        console.error("Failed to load appointments:", err);
      }
    }
    fetchAppointments();
  }, [currentUser]);

  function addNotification(title, message) {
    setNotifications((prev) => [
      { id: Date.now(), title, message, time: "Just now", unread: true },
      ...prev,
    ]);
  }

  function openHospital(hospital) {
    setSelectedHospital(hospital);
    navigateTo("details");
  }

  function startBooking(hospital) {
    setSelectedHospital(hospital);
    navigateTo("booking");
  }

  async function confirmAppointment(data) {
    try {
      const payload = {
        patientName: data.patientName,
        patientEmail: currentUser?.email || "patient@example.com",
        hospitalId: selectedHospital._id || selectedHospital.id,
        hospitalName: selectedHospital.name,
        doctor: data.doctor.name,
        specialty: data.doctor.specialty,
        date: data.date,
        time: data.time,
      };

      const res = await fetch("http://localhost:5000/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || "Booking failed");

      setAppointment(resData.appointment);
      localStorage.setItem("smartHospitalAppointment", JSON.stringify(resData.appointment));
      addNotification("Appointment Requested", `Request logged at ${selectedHospital.name}.`);
      navigateTo("appointment-confirmed");
    } catch (err) {
      alert("Booking failed: " + err.message);
    }
  }

  async function joinQueue(hospital) {
    if (!currentUser?.email) {
      alert("Please log in to join live OPD queue.");
      navigateTo("auth");
      return;
    }

    try {
      const doc = hospital.doctors[0] || { name: "Duty Specialist", specialty: "General Medicine" };
      const res = await fetch("http://localhost:5000/api/queue/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId: hospital._id || hospital.id,
          hospitalName: hospital.name,
          patientEmail: currentUser.email,
          patientName: currentUser.name || "Patient",
          doctorName: doc.name,
          specialty: doc.specialty,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to join queue");

      await syncQueueStatus();
      addNotification("Queue Joined", `Token assigned at ${hospital.name}`);
      navigateTo("queue");
    } catch (err) {
      alert(err.message);
    }
  }

  async function leaveQueue() {
    try {
      await fetch("http://localhost:5000/api/queue/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser?.email }),
      });
      setQueueData(null);
      addNotification("Queue Left", "You have stepped out of the queue.");
      navigateTo("dashboard");
    } catch (err) {
      console.error(err);
    }
  }

  const filteredHospitals = hospitalsList.filter((hospital) => {
    const text = search.toLowerCase().trim();
    const matchesSearch =
      hospital.name.toLowerCase().includes(text) ||
      hospital.location.toLowerCase().includes(text) ||
      hospital.specialties.some((s) => s.toLowerCase().includes(text));

    const matchesSpecialty = specialty === "All Specialties" || hospital.specialties.includes(specialty);
    const matchesStatus = status === "All" || hospital.status === status;

    return matchesSearch && matchesSpecialty && matchesStatus;
  });

  /* View Routing without Patient View switcher */
  if (page === "auth") {
    return (
      <AuthScreen
        onComplete={(user) => {
          setCurrentUser(user);
          if (user.role === "admin") navigateTo("admin-dashboard");
          else if (user.role === "hospital") navigateTo("hospital-dashboard");
          else navigateTo("dashboard");
        }}
      />
    );
  }

  if (page === "admin-dashboard") {
    return (
      <AdminDashboard
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  if (page === "hospital-dashboard") {
    return (
      <HospitalStaffDashboard
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  if (page === "dashboard") {
    return (
      <PatientDashboard
        appointment={appointment}
        queueData={queueData}
        notifications={notifications}
        onFindHospital={() => navigateTo("search")}
        onHospitalSelect={(hospitalId) => {
          const hospital = hospitalsList.find((h) => h.id === hospitalId || h._id === hospitalId);
          if (hospital) openHospital(hospital);
        }}
        onTrackQueue={() => queueData && navigateTo("queue")}
        onViewAppointment={() => appointment && navigateTo("appointment-confirmed")}
        onProfile={() => navigateTo("profile")}
        onNotifications={() => navigateTo("notifications")}
        onCancelAppointment={() => setAppointment(null)}
        onLeaveQueue={leaveQueue}
        onLogout={handleLogout}
      />
    );
  }

  if (page === "search") {
    return (
      <HospitalSearch
        search={search}
        setSearch={setSearch}
        specialty={specialty}
        setSpecialty={setSpecialty}
        status={status}
        setStatus={setStatus}
        hospitals={filteredHospitals}
        onBack={() => navigateTo("dashboard")}
        onDashboard={() => navigateTo("dashboard")}
        onLogout={handleLogout}
        onViewHospital={openHospital}
      />
    );
  }

  if (page === "details" && selectedHospital) {
    return (
      <HospitalDetails
        hospital={selectedHospital}
        onBack={() => navigateTo("search")}
        onDashboard={() => navigateTo("dashboard")}
        onLogout={handleLogout}
        onBook={() => startBooking(selectedHospital)}
        onQueue={() => joinQueue(selectedHospital)}
      />
    );
  }

  if (page === "booking" && selectedHospital) {
    return (
      <AppointmentBooking
        hospital={selectedHospital}
        onBack={() => navigateTo("details")}
        onDashboard={() => navigateTo("dashboard")}
        onLogout={handleLogout}
        onConfirm={confirmAppointment}
      />
    );
  }

  if (page === "appointment-confirmed" && appointment) {
    return (
      <AppointmentConfirmed
        appointment={appointment}
        onDashboard={() => navigateTo("dashboard")}
      />
    );
  }

  if (page === "queue" && queueData) {
    return (
      <QueueTracking
        queueData={queueData}
        onDashboard={() => navigateTo("dashboard")}
        onLeave={leaveQueue}
      />
    );
  }

  if (page === "profile") {
    return (
      <ProfilePage
        currentUser={currentUser}
        appointment={appointment}
        queueData={queueData}
        onDashboard={() => navigateTo("dashboard")}
        onLogout={handleLogout}
      />
    );
  }

  if (page === "notifications") {
    return <NotificationsPage notifications={notifications} onBack={() => navigateTo("dashboard")} />;
  }

  return null;
}

/* Authentication Screen */
function AuthScreen({ onComplete }) {
  const [step, setStep] = useState("welcome");
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  async function submitForm(e) {
    e.preventDefault();
    setError("");

    try {
      const endpoint = mode === "signup" ? "http://localhost:5000/api/auth/register" : "http://localhost:5000/api/auth/login";
      const payload = mode === "signup" ? { name: name.trim(), email: email.trim(), password, role } : { email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requiresOtp) {
          setStep("otp");
          return;
        }
        throw new Error(data.message || "Authentication failed");
      }

      if (data.requiresOtp) {
        setStep("otp");
        return;
      }

      if (data.token) localStorage.setItem("smartHospitalToken", data.token);
      if (data.user) localStorage.setItem("smartHospitalUser", JSON.stringify(data.user));

      onComplete(data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid OTP code");

      alert("Email verified! You can now log in.");
      setMode("login");
      setStep("form");
      setPassword("");
    } catch (err) {
      setError(err.message);
    }
  }

  const fieldClass = "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500";
  const primaryBtn = "w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500 transition";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-700 via-blue-900 to-slate-950 p-10">
          <div className="flex items-center gap-3">
            <Hospital size={30} />
            <span className="text-xl font-bold">Smart Hospital Network</span>
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-blue-300 font-bold">INDORE MUNICIPAL</span>
            <h1 className="mt-3 text-3xl font-bold leading-snug">Multi-hospital triage, queue tokens & scheduling.</h1>
          </div>
          <p className="text-xs text-blue-200">Indore Health Network Central Gateway</p>
        </div>

        <div className="p-8 sm:p-10">
          {step === "welcome" && (
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">AUTHENTICATION</span>
              <h2 className="text-3xl font-bold mt-2">Healthcare Access Portal</h2>
              <p className="text-sm text-slate-400 mt-2">Log in or create a verified account.</p>
              <div className="mt-8 space-y-3">
                <button className={primaryBtn} onClick={() => { setMode("login"); setStep("role"); }}>Log In →</button>
                <button className="w-full rounded-xl border border-slate-700 py-3 font-semibold hover:border-blue-500" onClick={() => { setMode("signup"); setStep("role"); }}>Sign Up</button>
              </div>
            </div>
          )}

          {step === "role" && (
            <div>
              <button onClick={() => setStep("welcome")} className="text-xs text-slate-400 flex items-center gap-1.5 mb-6 hover:text-white"><ArrowLeft size={14} /> Back</button>
              <h2 className="text-2xl font-bold">Select Portal Type</h2>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={() => { setRole("patient"); setStep("form"); }} className="p-4 rounded-xl border border-slate-700 bg-slate-950 hover:border-blue-500 text-left">
                  <User size={24} className="text-blue-400 mb-2" />
                  <h3 className="font-bold text-sm">Patient</h3>
                  <p className="text-xs text-slate-400 mt-1">Book & join queue.</p>
                </button>
                <button onClick={() => { setRole("hospital"); setStep("form"); }} className="p-4 rounded-xl border border-slate-700 bg-slate-950 hover:border-blue-500 text-left">
                  <Hospital size={24} className="text-blue-400 mb-2" />
                  <h3 className="font-bold text-sm">Staff</h3>
                  <p className="text-xs text-slate-400 mt-1">Manage beds & OPD.</p>
                </button>
                <button onClick={() => { setRole("admin"); setStep("form"); }} className="p-4 rounded-xl border border-slate-700 bg-slate-950 hover:border-purple-500 text-left">
                  <ShieldAlert size={24} className="text-purple-400 mb-2" />
                  <h3 className="font-bold text-sm">Admin</h3>
                  <p className="text-xs text-slate-400 mt-1">Verify hospitals & users.</p>
                </button>
              </div>
            </div>
          )}

          {step === "form" && (
            <div>
              <button onClick={() => setStep("role")} className="text-xs text-slate-400 flex items-center gap-1.5 mb-6 hover:text-white"><ArrowLeft size={14} /> Change role ({role})</button>
              <h2 className="text-2xl font-bold capitalize">{mode === "login" ? `Log In as ${role}` : `Sign Up as ${role}`}</h2>
              <form onSubmit={submitForm} className="mt-6 space-y-4">
                {mode === "signup" && (
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Full / Hospital Name</label>
                    <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                )}
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Email Address</label>
                  <input className={fieldClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Password</label>
                  <input className={fieldClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button type="submit" className={primaryBtn}>{mode === "login" ? "Log In" : "Register with Email OTP"}</button>
              </form>
              <p className="text-center text-xs text-slate-400 mt-5">
                {mode === "login" ? "Don't have an account?" : "Already verified?"}{" "}
                <button type="button" className="text-blue-400 font-semibold" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
                  {mode === "login" ? "Sign up" : "Log in"}
                </button>
              </p>
            </div>
          )}

          {step === "otp" && (
            <div>
              <ShieldCheck size={40} className="text-blue-400 mb-3" />
              <h2 className="text-2xl font-bold">Email Verification</h2>
              <p className="text-xs text-slate-400 mt-1">Enter the 6-digit code sent to <strong>{email}</strong>.</p>
              <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
                <input className={`${fieldClass} text-center text-2xl font-bold tracking-widest`} maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="000000" required />
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button type="submit" className={primaryBtn}>Verify OTP</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Hospital Search */
function HospitalSearch({ search, setSearch, specialty, setSpecialty, status, setStatus, hospitals, onBack, onDashboard, onLogout, onViewHospital }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar onDashboard={onDashboard} onLogout={onLogout} />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6"><ArrowLeft size={16} /> Back</button>
        <h1 className="text-3xl font-bold">Find a Hospital</h1>
        <p className="text-sm text-slate-400 mt-1">Search Indore healthcare providers by specialty, waiting time, and live queue status.</p>

        <div className="mt-6 bg-white rounded-2xl p-2 flex items-center shadow-lg">
          <Search size={20} className="text-slate-400 ml-3" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search hospital name or specialty..." className="flex-1 px-4 py-2 text-slate-800 outline-none text-sm" />
        </div>

        <div className="mt-5 flex gap-4">
          <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs">
            <option>All Specialties</option>
            <option>Cardiology</option>
            <option>Neurology</option>
            <option>General Medicine</option>
            <option>Orthopedics</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs">
            <option>All</option>
            <option>Open</option>
            <option>Closed</option>
          </select>
        </div>

        <div className="space-y-4 mt-6">
          {hospitals.map((hospital) => (
            <div key={hospital._id || hospital.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{hospital.name}</h3>
                  {hospital.verified && <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">VERIFIED</span>}
                </div>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><MapPin size={13} /> {hospital.address}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {hospital.specialties?.map((s) => (
                    <span key={s} className="bg-slate-950 text-slate-300 text-[11px] px-2 py-0.5 rounded-md border border-slate-800">{s}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-6 self-end md:self-center">
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Live Wait</span>
                  <span className="text-xl font-bold text-blue-400">{hospital.wait}</span>
                </div>
                <button onClick={() => onViewHospital(hospital)} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-xs font-semibold">View Details</button>
              </div>
            </div>
          ))}
          {hospitals.length === 0 && <p className="text-slate-500 text-center py-10">No hospitals found matching criteria.</p>}
        </div>
      </main>
    </div>
  );
}

/* Hospital Details */
function HospitalDetails({ hospital, onBack, onDashboard, onLogout, onBook, onQueue }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar onDashboard={onDashboard} onLogout={onLogout} />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-xs"><ArrowLeft size={16} /> Back to Search</button>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{hospital.name}</h1>
              {hospital.verified ? (
                <span className="bg-green-500/15 text-green-400 border border-green-500/30 text-xs px-2.5 py-1 rounded-full font-bold">Verified Facility</span>
              ) : (
                <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs px-2.5 py-1 rounded-full font-bold">Pending Verification</span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-2 flex items-center gap-1.5"><MapPin size={16} /> {hospital.address}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onBook} className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2">
              <Calendar size={16} /> Book OPD
            </button>
            <button onClick={onQueue} className="bg-green-600 hover:bg-green-500 px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2">
              <Users size={16} /> Join Live Queue
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

/* Appointment Booking with Native Dark Picker */
function AppointmentBooking({ hospital, onBack, onDashboard, onLogout, onConfirm }) {
  const [doctorId, setDoctorId] = useState(0);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");

  const doctorsList = hospital.doctors?.length ? hospital.doctors : [{ name: "Duty Physician", specialty: "General Medicine" }];
  const doctor = doctorsList[doctorId] || doctorsList[0];
  const slots = ["09:30 AM", "11:00 AM", "02:30 PM", "04:30 PM"];

  function handleSubmit(e) {
    e.preventDefault();
    if (!date || !time || !patientName || !phone) {
      alert("Please fill in all booking fields.");
      return;
    }
    onConfirm({ doctor, date, time, patientName, phone });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar onDashboard={onDashboard} onLogout={onLogout} />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-xs"><ArrowLeft size={16} /> Back</button>
        <h1 className="text-3xl font-bold">Schedule Appointment</h1>
        <p className="text-xs text-slate-400 mt-1">{hospital.name}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="font-bold text-sm text-slate-300">1. Select Doctor</h2>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              {doctorsList.map((doc, idx) => (
                <button
                  type="button"
                  key={doc.name + idx}
                  onClick={() => setDoctorId(idx)}
                  className={`p-4 rounded-xl text-left border ${
                    doctorId === idx ? "border-blue-500 bg-blue-500/10" : "border-slate-800 bg-slate-950"
                  }`}
                >
                  <h4 className="font-bold text-sm">{doc.name}</h4>
                  <p className="text-xs text-blue-400 mt-0.5">{doc.specialty}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="font-bold text-sm text-slate-300">2. Date & Time</h2>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Appointment Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  onClick={(e) => e.target.showPicker && e.target.showPicker()}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white [color-scheme:dark] outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Time Slot</label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white [color-scheme:dark] outline-none"
                  required
                >
                  <option value="">Select slot</option>
                  {slots.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="font-bold text-sm text-slate-300">3. Patient Contact</h2>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <input
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none"
                placeholder="Patient Full Name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
              />
              <input
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none"
                placeholder="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-3.5 rounded-xl font-bold transition">Confirm Appointment</button>
        </form>
      </main>
    </div>
  );
}

/* Live Queue Tracking Screen */
function QueueTracking({ queueData, onDashboard, onLeave }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <span className="text-xs text-blue-400 font-bold tracking-widest uppercase">LIVE OPD QUEUE TOKEN</span>
      <h1 className="text-6xl font-black text-blue-400 mt-2">{queueData.token}</h1>
      <p className="text-slate-400 mt-2 text-sm">{queueData.hospitalName} · Dr. {queueData.doctor}</p>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full mt-6 space-y-4">
        <div>
          <span className="text-xs text-slate-400">Position in Queue</span>
          <p className="text-3xl font-bold mt-1">{queueData.peopleAhead} Ahead</p>
        </div>
        <div>
          <span className="text-xs text-slate-400">Estimated Waiting Time</span>
          <p className="text-xl font-bold text-green-400 mt-0.5">{queueData.estimatedWait} minutes</p>
        </div>
        <button onClick={onLeave} className="w-full bg-red-600/20 text-red-400 border border-red-500/30 py-3 rounded-xl font-semibold text-sm hover:bg-red-600/30">
          Leave Live Queue
        </button>
      </div>

      <button onClick={onDashboard} className="text-xs text-slate-400 hover:text-white mt-6">Return to Patient Dashboard</button>
    </div>
  );
}

/* Appointment Confirmed */
function AppointmentConfirmed({ appointment, onDashboard }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 text-center">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full">
        <CheckCircle2 size={50} className="text-green-400 mx-auto" />
        <h2 className="text-2xl font-bold mt-4">Appointment Booked</h2>
        <p className="text-xs text-slate-400 mt-1">Status: <span className="text-amber-400 font-bold">{appointment.status}</span></p>
        <div className="bg-slate-950 rounded-2xl p-4 mt-6 text-left text-xs space-y-2">
          <p><strong>Hospital:</strong> {appointment.hospitalName}</p>
          <p><strong>Doctor:</strong> {appointment.doctor}</p>
          <p><strong>Schedule:</strong> {appointment.date} at {appointment.time}</p>
        </div>
        <button onClick={onDashboard} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-xs mt-6">Dashboard</button>
      </div>
    </div>
  );
}

/* Profile Page */
function ProfilePage({ currentUser, appointment, onDashboard, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-10 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onDashboard} className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"><ArrowLeft size={16} /> Back</button>
        <button onClick={onLogout} className="text-xs bg-red-600/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold">
          <LogOut size={14} /> Log Out
        </button>
      </div>
      <h1 className="text-2xl font-bold">Patient Profile</h1>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-6 space-y-3 text-sm">
        <p><strong>Name:</strong> {currentUser?.name}</p>
        <p><strong>Email:</strong> {currentUser?.email}</p>
        <p><strong>Account Role:</strong> <span className="text-blue-400 capitalize font-bold">{currentUser?.role}</span></p>
        <p><strong>Appointment:</strong> {appointment ? `${appointment.doctor} (${appointment.date})` : "None"}</p>
      </div>
    </div>
  );
}

/* Notifications Page */
function NotificationsPage({ notifications, onBack }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 max-w-2xl mx-auto">
      <button onClick={onBack} className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-6"><ArrowLeft size={16} /> Back</button>
      <h1 className="text-2xl font-bold">Notifications</h1>
      <div className="mt-6 space-y-3">
        {notifications.map((n) => (
          <div key={n.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
            <h4 className="font-bold text-sm">{n.title}</h4>
            <p className="text-xs text-slate-400 mt-1">{n.message}</p>
          </div>
        ))}
        {notifications.length === 0 && <p className="text-slate-500 text-xs py-4">No notifications yet.</p>}
      </div>
    </div>
  );
}

/* Global Navbar */
function Navbar({ onDashboard, onLogout }) {
  return (
    <nav className="border-b border-slate-800 px-6 py-4 flex justify-between items-center bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      <button onClick={onDashboard} className="flex items-center gap-2 font-bold text-base text-white">
        <Hospital className="text-blue-500" size={20} /> Smart Hospital Network
      </button>
      <div className="flex items-center gap-3">
        <span className="text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-semibold hidden sm:inline">
          Indore Grid Live
        </span>
        {onLogout && (
          <button onClick={onLogout} className="flex items-center gap-1 text-xs bg-red-600/15 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-600/25 font-semibold transition">
            <LogOut size={14} /> Log Out
          </button>
        )}
      </div>
    </nav>
  );
}

export default App;
