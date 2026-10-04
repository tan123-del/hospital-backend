import { useEffect, useState } from "react";

import {
  Activity,
  ArrowRight,
  Bell,
  Calendar,
  Hospital,
  MapPin,
  Navigation,
  Search,
  Star,
  Users,
} from "lucide-react";

export default function PatientDashboard({
  appointment,
  queueData,
  notifications,
  onFindHospital,
  onHospitalSelect,
  onTrackQueue,
  onViewAppointment,
  onProfile,
  onNotifications,
  onCancelAppointment,
  onLeaveQueue,
  onUseLocation,
  locationStatus,
  locationError,
}) {
  const [recommendedHospitals, setRecommendedHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [hospitalError, setHospitalError] = useState("");

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/hospitals");

        if (!response.ok) {
          throw new Error(`Failed to fetch hospitals (HTTP ${response.status})`);
        }

        const data = await response.json();
        const hospitals = Array.isArray(data.hospitals) ? data.hospitals : [];

        const formattedHospitals = hospitals.map((hospital) => ({
          id: hospital._id,
          name: hospital.name,
          location: [hospital.address, hospital.city].filter(Boolean).join(", "),
          distance: "Distance unavailable",
          rating: hospital.rating ?? 0,
          reviews: 0,
          wait: "Unavailable",
          beds: hospital.beds ?? 0,
          specialty: hospital.specialties?.[0] || "General",
          status: "Open",
        }));

        setRecommendedHospitals(formattedHospitals);
        setHospitalError("");
      } catch (error) {
        setHospitalError(error.message || "Could not load hospitals.");
      } finally {
        setLoadingHospitals(false);
      }
    };

    fetchHospitals();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* =====================================================
          NAVBAR
         ===================================================== */}

      <nav className="border-b border-slate-800">

        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">

          <div className="flex items-center gap-3">

            <div className="bg-blue-600 p-2 rounded-xl">
              <Hospital size={25} />
            </div>

            <span className="text-xl font-bold">
              Smart Hospital Network
            </span>

          </div>

          <div className="flex items-center gap-3">

            {/* NOTIFICATIONS */}

            <button
              type="button"
              onClick={onNotifications}
              className="relative bg-slate-900 border border-slate-800 p-3 rounded-xl hover:border-blue-500/50"
            >

              <Bell size={19} />

              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 w-5 h-5 rounded-full text-[10px] flex items-center justify-center">
                  {notifications.filter((item) => item.unread !== false).length}
                </span>
              )}

            </button>

            {/* PROFILE */}

            <button
              type="button"
              onClick={onProfile}
              className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl hover:border-blue-500/50"
            >

              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                T
              </div>

              <span className="text-sm">
                Patient
              </span>

            </button>

          </div>

        </div>

      </nav>

      {/* =====================================================
          MAIN
         ===================================================== */}

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* WELCOME */}

        <div className="flex flex-col lg:flex-row justify-between gap-6">

          <div>

            <p className="text-blue-400 text-sm font-semibold">
              PATIENT DASHBOARD
            </p>

            <h1 className="text-5xl font-bold mt-2">
              Welcome back!
            </h1>

            <p className="text-slate-400 mt-3">
              Find hospitals, manage appointments and track
              your live queue from one place.
            </p>

          </div>

          <button
            type="button"
            onClick={onFindHospital}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 h-fit"
          >
            <Search size={19} />
            Find a Hospital
          </button>

        </div>

        {/* SEARCH */}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mt-8">

          <div className="flex flex-col md:flex-row gap-3">

            <button
              type="button"
              onClick={onFindHospital}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl flex items-center text-left px-4 py-3"
            >

              <Search
                size={19}
                className="text-slate-500"
              />

              <span className="text-slate-500 ml-3">
                Search hospital or specialty...
              </span>

            </button>

            <button
              type="button"
              onClick={onUseLocation}
              className="bg-slate-800 hover:bg-slate-700 px-5 py-3 rounded-xl flex items-center justify-center gap-2"
            >
              <Navigation size={18} />
              {locationStatus === "loading" ? "Getting location..." : locationStatus === "ready" ? "Location Enabled" : "Use Current Location"}
            </button>

          </div>
          {locationStatus === "ready" && (
            <p className="text-sm text-green-400 mt-3">✓ Your current location is being used to calculate hospital distances.</p>
          )}
          {locationError && (
            <p role="alert" className="text-sm text-amber-400 mt-3">{locationError}</p>
          )}

        </div>

        {/* =====================================================
            LIVE STATS
           ===================================================== */}

        <div className="grid md:grid-cols-3 gap-5 mt-8">

          <StatCard
            icon={<Calendar size={22} />}
            label="Upcoming Appointment"
            value={
              appointment
                ? "1"
                : "0"
            }
            description={
              appointment
                ? `${appointment.date} • ${appointment.time}`
                : "No appointment"
            }
            active={Boolean(appointment)}
            onClick={
              appointment
                ? onViewAppointment
                : onFindHospital
            }
          />

          <StatCard
            icon={<Users size={22} />}
            label="Live Queue"
            value={
              queueData
                ? queueData.token
                : "—"
            }
            description={
              queueData
                ? `${queueData.peopleAhead} ahead`
                : "No active queue"
            }
            active={Boolean(queueData)}
            onClick={
              queueData
                ? onTrackQueue
                : onFindHospital
            }
          />

          <StatCard
            icon={<Activity size={22} />}
            label="Estimated Wait"
            value={
              queueData
                ? `${queueData.estimatedWait} min`
                : "—"
            }
            description={
              queueData
                ? "Live queue estimate"
                : "No active queue"
            }
            active={Boolean(queueData)}
            onClick={
              queueData
                ? onTrackQueue
                : onFindHospital
            }
          />

        </div>

        {/* =====================================================
            APPOINTMENT + QUEUE
           ===================================================== */}

        <div className="grid lg:grid-cols-2 gap-6 mt-8">

          {/* APPOINTMENT */}

          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <div className="flex justify-between items-center">

              <h2 className="text-xl font-bold">
                Upcoming Appointment
              </h2>

              <Calendar
                className="text-blue-400"
                size={22}
              />

            </div>

            {appointment ? (

              <div className="bg-slate-950 rounded-xl p-6 mt-5">

                <div className="flex justify-between gap-4">

                  <div>

                    <p className="text-blue-400 font-semibold">
                      {appointment.specialty}
                    </p>

                    <h3 className="text-xl font-bold mt-1">
                      {appointment.doctor}
                    </h3>

                    <p className="text-slate-400 text-sm mt-2">
                      {appointment.hospitalName}
                    </p>

                  </div>

                  <span className="text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full text-xs h-fit">
                    Confirmed
                  </span>

                </div>

                <div className="grid grid-cols-2 gap-3 mt-5">

                  <div className="bg-slate-900 rounded-xl p-3">

                    <p className="text-xs text-slate-500">
                      Date
                    </p>

                    <p className="font-semibold mt-1">
                      {appointment.date}
                    </p>

                  </div>

                  <div className="bg-slate-900 rounded-xl p-3">

                    <p className="text-xs text-slate-500">
                      Time
                    </p>

                    <p className="font-semibold mt-1">
                      {appointment.time}
                    </p>

                  </div>

                </div>

                <div className="flex gap-3 mt-5">

                  <button
                    type="button"
                    onClick={onViewAppointment}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 py-2.5 rounded-xl font-semibold"
                  >
                    View Details
                  </button>

                  <button
                    type="button"
                    onClick={onCancelAppointment}
                    className="px-4 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 rounded-xl"
                  >
                    Cancel
                  </button>

                </div>

              </div>

            ) : (

              <div className="bg-slate-950 rounded-xl p-6 mt-5">

                <p className="text-slate-400">
                  You don't have any upcoming appointments.
                </p>

                <button
                  type="button"
                  onClick={onFindHospital}
                  className="text-blue-400 mt-3 font-semibold"
                >
                  Find a hospital →
                </button>

              </div>

            )}

          </section>

          {/* QUEUE */}

          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">

            <div className="flex justify-between items-center">

              <h2 className="text-xl font-bold">
                Live Queue
              </h2>

              <Activity
                className="text-green-400"
                size={22}
              />

            </div>

            {queueData ? (

              <div className="bg-slate-950 rounded-xl p-6 mt-5">

                <div className="flex justify-between items-start">

                  <div>

                    <p className="text-slate-500 text-sm">
                      Your token
                    </p>

                    <p className="text-4xl font-bold text-blue-400">
                      {queueData.token}
                    </p>

                  </div>

                  <span className="text-green-400 bg-green-500/10 px-3 py-1 rounded-full text-xs">
                    Active
                  </span>

                </div>

                <p className="font-semibold mt-5">
                  {queueData.hospitalName}
                </p>

                <p className="text-blue-400 text-sm mt-1">
                  {queueData.doctor}
                </p>

                <div className="grid grid-cols-2 gap-3 mt-5">

                  <div className="bg-slate-900 rounded-xl p-3">

                    <p className="text-xs text-slate-500">
                      People Ahead
                    </p>

                    <p className="font-bold mt-1">
                      {queueData.peopleAhead}
                    </p>

                  </div>

                  <div className="bg-slate-900 rounded-xl p-3">

                    <p className="text-xs text-slate-500">
                      Estimated Wait
                    </p>

                    <p className="font-bold mt-1">
                      {queueData.estimatedWait} min
                    </p>

                  </div>

                </div>

                <div className="flex gap-3 mt-5">

                  <button
                    type="button"
                    onClick={onTrackQueue}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 py-2.5 rounded-xl font-semibold"
                  >
                    Track Queue
                  </button>

                  <button
                    type="button"
                    onClick={onLeaveQueue}
                    className="px-4 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 rounded-xl"
                  >
                    Leave
                  </button>

                </div>

              </div>

            ) : (

              <div className="bg-slate-950 rounded-xl p-6 mt-5">

                <p className="text-slate-400">
                  You are not currently in a hospital queue.
                </p>

                <button
                  type="button"
                  onClick={onFindHospital}
                  className="text-blue-400 mt-3 font-semibold"
                >
                  Find a hospital →
                </button>

              </div>

            )}

          </section>

        </div>

        {/* =====================================================
            RECOMMENDED HOSPITALS
           ===================================================== */}

        <section className="mt-10">

          <div className="flex justify-between items-end mb-5">

            <div>

              <h2 className="text-2xl font-bold">
                Recommended Hospitals
              </h2>

              <p className="text-slate-500 text-sm mt-1">
                Based on location, availability, waiting time
                and patient reviews.
              </p>

            </div>

            <button
              type="button"
              onClick={onFindHospital}
              className="text-blue-400 flex items-center gap-1"
            >
              View all
              <ArrowRight size={16} />
            </button>

          </div>

          {loadingHospitals && (
            <p className="text-slate-400 mb-4">Loading hospitals...</p>
          )}

          {hospitalError && (
            <p role="alert" className="text-red-400 mb-4">{hospitalError}</p>
          )}

          {!loadingHospitals && !hospitalError && recommendedHospitals.length === 0 && (
            <p className="text-slate-400 mb-4">No hospitals found. Add a hospital through the API first.</p>
          )}

          <div className="grid lg:grid-cols-3 gap-5">

            {recommendedHospitals.map(
              (hospital) => (

                <div
                  key={hospital.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-blue-500/40 transition"
                >

                  <div className="flex justify-between gap-3">

                    <h3 className="font-bold text-lg">
                      {hospital.name}
                    </h3>

                    <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full h-fit">
                      {hospital.status}
                    </span>

                  </div>

                  <div className="flex items-center gap-1 text-slate-500 text-sm mt-2">
                    <MapPin size={15} />
                    {hospital.location}
                  </div>

                  <div className="flex items-center gap-2 mt-4">

                    <Star
                      size={16}
                      className="text-yellow-400 fill-yellow-400"
                    />

                    <span className="font-semibold">
                      {hospital.rating}
                    </span>

                    <span className="text-slate-500 text-sm">
                      ({hospital.reviews})
                    </span>

                    <span className="text-slate-600">
                      •
                    </span>

                    <span className="text-slate-500 text-sm">
                      {hospital.distance}
                    </span>

                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-5">

                    <div className="bg-slate-950 rounded-xl p-3">

                      <p className="text-slate-500 text-xs">
                        Wait
                      </p>

                      <p className="font-bold mt-1">
                        {hospital.wait}
                      </p>

                    </div>

                    <div className="bg-slate-950 rounded-xl p-3">

                      <p className="text-slate-500 text-xs">
                        Beds
                      </p>

                      <p className="font-bold mt-1">
                        {hospital.beds}
                      </p>

                    </div>

                  </div>

                  <div className="flex justify-between items-center mt-5">

                    <span className="text-sm text-blue-400">
                      {hospital.specialty}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        onHospitalSelect(
                          hospital.id
                        )
                      }
                      className="text-blue-400 hover:text-blue-300 font-semibold text-sm"
                    >
                      View Hospital →
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        </section>

        {/* =====================================================
            RECENT ACTIVITY
           ===================================================== */}

        <section className="mt-10">

          <h2 className="text-2xl font-bold mb-5">
            Recent Activity
          </h2>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800">

            <ActivityItem
              icon={<Search size={18} />}
              title="Hospital search"
              description="View hospitals, specialists and live availability"
              time="Today"
            />

            <ActivityItem
              icon={<Calendar size={18} />}
              title={
                appointment
                  ? "Appointment booked"
                  : "Appointment"
              }
              description={
                appointment
                  ? `${appointment.doctor} • ${appointment.date}`
                  : "No appointment booked yet"
              }
              time={
                appointment
                  ? "Just now"
                  : "Today"
              }
            />

            <ActivityItem
              icon={<Users size={18} />}
              title={
                queueData
                  ? "Live queue active"
                  : "Live queue"
              }
              description={
                queueData
                  ? `${queueData.token} • ${queueData.peopleAhead} ahead`
                  : "No active hospital queue"
              }
              time={
                queueData
                  ? "Just now"
                  : "Today"
              }
            />

          </div>

        </section>

        {/* NOTICE */}

        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 mt-8">

          <div className="flex gap-3">

            <Activity
              className="text-blue-400"
              size={20}
            />

            <div>

              <h3 className="font-semibold">
                Real-time hospital information
              </h3>

              <p className="text-sm text-slate-400 mt-1">
                Queue status, estimated waiting times, bed
                availability and emergency status are designed
                to update as hospitals provide new information.
              </p>

            </div>

          </div>

        </div>

      </main>
    </div>
  );
}

/* =========================================================
   STAT CARD
   ========================================================= */

function StatCard({
  icon,
  label,
  value,
  description,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left bg-slate-900 border rounded-2xl p-5 transition w-full ${
        active
          ? "border-blue-500/50 hover:border-blue-400"
          : "border-slate-800 hover:border-slate-700"
      }`}
    >

      <div className="bg-blue-500/10 text-blue-400 p-3 rounded-xl w-fit">
        {icon}
      </div>

      <p className="text-slate-500 text-sm mt-5">
        {label}
      </p>

      <p className="text-3xl font-bold mt-1">
        {value}
      </p>

      <p className="text-slate-500 text-sm mt-1">
        {description}
      </p>

    </button>
  );
}

/* =========================================================
   ACTIVITY ITEM
   ========================================================= */

function ActivityItem({
  icon,
  title,
  description,
  time,
}) {
  return (
    <div className="p-5 flex items-center gap-4">

      <div className="bg-slate-950 p-3 rounded-xl text-blue-400">
        {icon}
      </div>

      <div className="flex-1">

        <p className="font-semibold">
          {title}
        </p>

        <p className="text-sm text-slate-500 mt-1">
          {description}
        </p>

      </div>

      <span className="text-xs text-slate-600">
        {time}
      </span>

    </div>
  );
}