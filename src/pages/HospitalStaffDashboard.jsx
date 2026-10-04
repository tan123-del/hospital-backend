import { useEffect, useMemo, useState } from "react";
import { Activity, BedDouble, CalendarDays, CheckCircle2, Clock3, Plus, Save, ShieldAlert, Stethoscope, Users, X } from "lucide-react";

const STORAGE_KEY = "smartHospitalStaffData";
const initialData = {
  hospitalName: "CityCare Multispeciality Hospital",
  emergencyStatus: "Normal",
  beds: { generalTotal: 120, generalAvailable: 34, icuTotal: 20, icuAvailable: 6 },
  doctors: [
    { id: 1, name: "Dr. Aditi Sharma", specialty: "Cardiology", status: "Available", hours: "09:00–17:00" },
    { id: 2, name: "Dr. Rahul Verma", specialty: "Orthopedics", status: "Available", hours: "10:00–18:00" },
    { id: 3, name: "Dr. Neha Patel", specialty: "Pediatrics", status: "On Leave", hours: "—" },
  ],
  queue: [
    { id: 1, token: "A-014", patient: "Patient 014", department: "Cardiology", wait: 15, status: "Waiting" },
    { id: 2, token: "A-015", patient: "Patient 015", department: "Cardiology", wait: 25, status: "Waiting" },
    { id: 3, token: "O-008", patient: "Patient 008", department: "Orthopedics", wait: 10, status: "In consultation" },
  ],
  appointments: [
    { id: 1, patient: "Patient 021", doctor: "Dr. Aditi Sharma", time: "11:30 AM", reason: "Follow-up", status: "Pending" },
    { id: 2, patient: "Patient 022", doctor: "Dr. Rahul Verma", time: "12:00 PM", reason: "Consultation", status: "Pending" },
    { id: 3, patient: "Patient 023", doctor: "Dr. Aditi Sharma", time: "12:30 PM", reason: "Review", status: "Confirmed" },
  ],
};

function loadData() {
  try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? { ...initialData, ...JSON.parse(saved) } : initialData; }
  catch { return initialData; }
}

const badgeClass = (value) => value === "Available" || value === "Confirmed" || value === "Normal" || value === "Completed" ? "bg-emerald-100 text-emerald-700" : value === "Pending" || value === "Waiting" || value === "On Leave" ? "bg-amber-100 text-amber-700" : value === "Critical" || value === "Unavailable" ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700";

export default function HospitalStaffDashboard({ onBack }) {
  const [data, setData] = useState(loadData);
  const [tab, setTab] = useState("Overview");
  const [doctorForm, setDoctorForm] = useState({ name: "", specialty: "", status: "Available", hours: "09:00–17:00" });
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data]);
  const pending = data.appointments.filter(x => x.status === "Pending").length;
  const waiting = data.queue.filter(x => x.status === "Waiting").length;
  const availableDoctors = data.doctors.filter(x => x.status === "Available").length;
  const occupancy = useMemo(() => Math.round(((data.beds.generalTotal - data.beds.generalAvailable) / Math.max(data.beds.generalTotal, 1)) * 100), [data.beds]);
  const update = (fn) => setData(prev => ({ ...prev, ...fn(prev) }));
  const updateBed = (key, value) => setData(prev => ({ ...prev, beds: { ...prev.beds, [key]: Math.max(0, Number(value) || 0) } }));
  const updateDoctor = (id, field, value) => setData(prev => ({ ...prev, doctors: prev.doctors.map(d => d.id === id ? { ...d, [field]: value } : d) }));
  const updateQueueStatus = (id, status) => setData(prev => ({ ...prev, queue: prev.queue.map(q => q.id === id ? { ...q, status } : q) }));
  const updateAppointment = (id, status) => setData(prev => ({ ...prev, appointments: prev.appointments.map(a => a.id === id ? { ...a, status } : a) }));
  const addDoctor = (e) => { e.preventDefault(); if (!doctorForm.name.trim() || !doctorForm.specialty.trim()) return; setData(prev => ({ ...prev, doctors: [...prev.doctors, { ...doctorForm, id: Date.now() }] })); setDoctorForm({ name: "", specialty: "", status: "Available", hours: "09:00–17:00" }); setShowDoctorForm(false); };
  const saveNow = () => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); setSavedMessage("Changes saved on this device."); setTimeout(() => setSavedMessage(""), 2500); };
  const tabs = ["Overview", "Beds", "Doctors", "Queue", "Appointments"];
  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <header className="bg-gradient-to-r from-slate-950 via-blue-950 to-cyan-900 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-6">
        <div className="flex items-center gap-3"><div className="rounded-2xl bg-white/10 p-3"><Activity className="h-7 w-7" /></div><div><p className="text-sm text-cyan-100">SMART HOSPITAL NETWORK</p><h1 className="text-2xl font-bold">Hospital Staff Dashboard</h1><p className="mt-1 text-sm text-blue-100">{data.hospitalName} · Staff workspace</p></div></div>
        <div className="flex flex-wrap gap-2"><button onClick={onBack} className="rounded-xl border border-white/30 px-4 py-2 text-sm hover:bg-white/10">← Patient view</button><button onClick={saveNow} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-950 hover:bg-blue-50"><Save className="h-4 w-4"/> Save changes</button></div>
      </div>
    </header>
    <main className="mx-auto max-w-7xl px-5 py-6">
      {savedMessage && <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{savedMessage}</div>}
      <div className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border bg-white p-2">{tabs.map(t => <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === t ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{t}</button>)}</div>
      {tab === "Overview" && <>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Available beds", `${data.beds.generalAvailable}/${data.beds.generalTotal}`, BedDouble, "General ward"],["Available doctors", `${availableDoctors}/${data.doctors.length}`, Stethoscope, "On duty"],["Patients waiting", waiting, Users, "Active queue"],["Pending appointments", pending, CalendarDays, "Awaiting review"]].map(([label,value,Icon,sub]) => <div key={label} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-slate-500">{label}</span><span className="rounded-xl bg-blue-50 p-2 text-blue-700"><Icon className="h-5 w-5"/></span></div><div className="mt-3 text-3xl font-bold">{value}</div><p className="mt-1 text-sm text-slate-500">{sub}</p></div>)}</div>
        <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border bg-white p-5"><h2 className="mb-4 text-lg font-bold">Hospital status</h2><label className="mb-2 block text-sm font-medium text-slate-600">Emergency department status</label><select value={data.emergencyStatus} onChange={e => setData(p => ({...p, emergencyStatus:e.target.value}))} className="w-full rounded-xl border px-3 py-3"><option>Normal</option><option>Busy</option><option>Critical</option></select><div className="mt-5 flex items-center justify-between"><span className="text-sm text-slate-600">General bed occupancy</span><strong>{occupancy}%</strong></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{width:`${Math.min(occupancy,100)}%`}}/></div><p className="mt-3 text-xs text-slate-500">Demo workspace: changes are saved in this browser only.</p></section>
        <section className="rounded-2xl border bg-white p-5"><h2 className="mb-4 text-lg font-bold">Quick actions</h2><div className="grid gap-3 sm:grid-cols-2">{[["Manage beds","Beds",BedDouble],["Update doctors","Doctors",Stethoscope],["Manage queue","Queue",Users],["Review appointments","Appointments",CalendarDays]].map(([label,t,Icon])=><button key={t} onClick={()=>setTab(t)} className="flex items-center gap-3 rounded-xl border p-4 text-left hover:border-blue-300 hover:bg-blue-50"><Icon className="h-5 w-5 text-blue-700"/><span className="font-semibold">{label}</span></button>)}</div></section></div>
      </>}
      {tab === "Beds" && <section className="rounded-2xl border bg-white p-5"><h2 className="mb-2 text-xl font-bold">Bed & capacity management</h2><p className="mb-5 text-sm text-slate-500">Update total and currently available beds. Available beds cannot exceed total capacity.</p><div className="grid gap-5 md:grid-cols-2">{[["General beds","generalTotal","generalAvailable"],["ICU beds","icuTotal","icuAvailable"]].map(([label,total,available])=><div key={label} className="rounded-2xl bg-slate-50 p-5"><h3 className="mb-4 font-bold">{label}</h3><label className="mb-2 block text-sm">Total capacity</label><input type="number" min="0" value={data.beds[total]} onChange={e=>updateBed(total,e.target.value)} className="mb-4 w-full rounded-xl border bg-white px-3 py-3"/><label className="mb-2 block text-sm">Available beds</label><input type="number" min="0" max={data.beds[total]} value={data.beds[available]} onChange={e=>updateBed(available,Math.min(Number(e.target.value)||0,data.beds[total]))} className="w-full rounded-xl border bg-white px-3 py-3"/><p className="mt-3 text-sm text-slate-500">Occupied: {Math.max(0,data.beds[total]-data.beds[available])}</p></div>)}</div></section>}
      {tab === "Doctors" && <section className="rounded-2xl border bg-white p-5"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Doctor availability</h2><p className="text-sm text-slate-500">Manage staff status, specialty and duty hours.</p></div><button onClick={()=>setShowDoctorForm(x=>!x)} className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 font-semibold text-white"><Plus className="h-4 w-4"/> Add doctor</button></div>
        {showDoctorForm && <form onSubmit={addDoctor} className="mb-5 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2"><input placeholder="Doctor name" value={doctorForm.name} onChange={e=>setDoctorForm(p=>({...p,name:e.target.value}))} className="rounded-lg border px-3 py-2.5"/><input placeholder="Specialty" value={doctorForm.specialty} onChange={e=>setDoctorForm(p=>({...p,specialty:e.target.value}))} className="rounded-lg border px-3 py-2.5"/><input placeholder="Duty hours" value={doctorForm.hours} onChange={e=>setDoctorForm(p=>({...p,hours:e.target.value}))} className="rounded-lg border px-3 py-2.5"/><div className="flex gap-2"><button className="rounded-lg bg-blue-700 px-4 py-2 text-white">Add</button><button type="button" onClick={()=>setShowDoctorForm(false)} className="rounded-lg border px-4 py-2">Cancel</button></div></form>}
        <div className="space-y-3">{data.doctors.map(d=><div key={d.id} className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr]"><div><p className="font-semibold">{d.name}</p><p className="text-sm text-slate-500">{d.specialty}</p></div><div className="flex items-center gap-2 text-sm text-slate-600"><Clock3 className="h-4 w-4"/>{d.hours}</div><select value={d.status} onChange={e=>updateDoctor(d.id,"status",e.target.value)} className="rounded-lg border px-3 py-2"><option>Available</option><option>Busy</option><option>On Leave</option><option>Unavailable</option></select><button onClick={()=>setData(p=>({...p,doctors:p.doctors.filter(x=>x.id!==d.id)}))} className="justify-self-start rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">Remove</button></div>)}</div></section>}
      {tab === "Queue" && <section className="rounded-2xl border bg-white p-5"><h2 className="mb-1 text-xl font-bold">Patient queue & tokens</h2><p className="mb-5 text-sm text-slate-500">Update patient queue status and estimated wait.</p><div className="space-y-3">{data.queue.map(q=><div key={q.id} className="grid gap-3 rounded-xl border p-4 md:grid-cols-[.7fr_1.2fr_1.2fr_.7fr_1fr]"><div className="font-bold text-blue-700">{q.token}</div><div><p className="font-semibold">{q.patient}</p><p className="text-sm text-slate-500">{q.department}</p></div><label className="flex items-center gap-2 text-sm"><Clock3 className="h-4 w-4"/><input type="number" min="0" value={q.wait} onChange={e=>setData(p=>({...p,queue:p.queue.map(x=>x.id===q.id?{...x,wait:Math.max(0,Number(e.target.value)||0)}:x)}))} className="w-20 rounded-lg border px-2 py-2"/> min</label><select value={q.status} onChange={e=>updateQueueStatus(q.id,e.target.value)} className="rounded-lg border px-2 py-2"><option>Waiting</option><option>In consultation</option><option>Completed</option><option>Cancelled</option></select><button onClick={()=>setData(p=>({...p,queue:p.queue.filter(x=>x.id!==q.id)}))} className="justify-self-start rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">Remove</button></div>)}</div>{data.queue.length===0&&<p className="py-8 text-center text-slate-500">No patients in the queue.</p>}</section>}
      {tab === "Appointments" && <section className="rounded-2xl border bg-white p-5"><h2 className="mb-1 text-xl font-bold">Appointment management</h2><p className="mb-5 text-sm text-slate-500">Confirm or cancel appointment requests.</p><div className="space-y-3">{data.appointments.map(a=><div key={a.id} className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1.2fr_1.2fr_.8fr_1fr_1.3fr]"><div className="font-semibold">{a.patient}<p className="text-sm font-normal text-slate-500">{a.reason}</p></div><div className="text-sm">{a.doctor}</div><div className="text-sm text-slate-600">{a.time}</div><div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(a.status)}`}>{a.status}</span></div><div className="flex flex-wrap gap-2">{a.status === "Pending" ? <><button onClick={()=>updateAppointment(a.id,"Confirmed")} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Confirm</button><button onClick={()=>updateAppointment(a.id,"Cancelled")} className="rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-600">Cancel</button></> : <button onClick={()=>updateAppointment(a.id,"Pending")} className="rounded-lg border px-3 py-2 text-sm">Reset</button>}</div></div>)}</div>{data.appointments.length===0&&<p className="py-8 text-center text-slate-500">No appointments available.</p>}</section>}
      <footer className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0"/><p><strong>Demo notice:</strong> This staff dashboard stores changes in your browser's localStorage. It is not connected to a real hospital system or shared database. Do not enter real patient-identifying or medical information.</p></footer>
    </main>
  </div>;
}
