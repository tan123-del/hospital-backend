require("dotenv").config();
const mongoose = require("mongoose");
const Hospital = require("./models/Hospital");

const sampleHospitals = [
  {
    name: "CityCare Multispeciality Hospital",
    location: "Indore, Madhya Pradesh",
    address: "AB Road, Vijay Nagar, Indore, Madhya Pradesh",
    phone: "+91 98765 43210",
    distance: "2.4 km",
    rating: 4.7,
    reviews: 328,
    specialties: ["Cardiology", "Neurology", "Orthopedics", "General Medicine"],
    services: ["Emergency", "Diagnostics", "ICU", "Pharmacy", "Ambulance"],
    wait: "18 min",
    queue: 7,
    beds: 12,
    emergency: "Available",
    status: "Open",
    verified: true,
    doctors: [
      { name: "Dr. Rajiv Sharma", specialty: "Cardiology", qualification: "MD, DM Cardiology", experience: "14 years", availability: "Available today", verified: true },
      { name: "Dr. Priya Mehta", specialty: "Neurology", qualification: "MBBS, MD Neurology", experience: "11 years", availability: "Available today", verified: true },
    ],
  },
  {
    name: "LifeLine Medical Centre",
    location: "Indore, Madhya Pradesh",
    address: "Scheme No. 54, Indore, Madhya Pradesh",
    phone: "+91 98765 12345",
    distance: "4.1 km",
    rating: 4.5,
    reviews: 241,
    specialties: ["Cardiology", "General Medicine", "Dermatology"],
    services: ["Emergency", "Diagnostics", "Pharmacy"],
    wait: "25 min",
    queue: 11,
    beds: 8,
    emergency: "Available",
    status: "Open",
    verified: true,
    doctors: [
      { name: "Dr. Rahul Jain", specialty: "General Medicine", qualification: "MBBS, MD", experience: "10 years", availability: "Available today", verified: true },
    ],
  },
  {
    name: "Apollo Care Hospital",
    location: "Indore, Madhya Pradesh",
    address: "Sector B, Vijay Nagar, Indore, Madhya Pradesh",
    phone: "+91 98765 67890",
    distance: "5.0 km",
    rating: 4.6,
    reviews: 417,
    specialties: ["Oncology", "Pediatrics", "Cardiology"],
    services: ["Emergency", "ICU", "OT", "Ambulance"],
    wait: "35 min",
    queue: 14,
    beds: 20,
    emergency: "Available",
    status: "Open",
    verified: false, // Pending verification for System Admin to approve
    doctors: [
      { name: "Dr. Sunita Rao", specialty: "Pediatrics", qualification: "MBBS, DCH", experience: "8 years", availability: "Available today", verified: true },
    ],
  },
];

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB. Seeding hospitals...");
    await Hospital.deleteMany({});
    await Hospital.insertMany(sampleHospitals);
    console.log("Hospitals seeded successfully into MongoDB.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seeding error:", err);
    process.exit(1);
  });