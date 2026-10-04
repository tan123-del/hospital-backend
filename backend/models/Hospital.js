const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  qualification: { type: String, default: "MBBS, MD" },
  experience: { type: String, default: "5 years" },
  availability: { type: String, default: "Available today" },
  verified: { type: Boolean, default: true },
});

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ownerEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    location: {
      type: String,
      default: "Indore, Madhya Pradesh",
    },
    address: {
      type: String,
      default: "Indore, Madhya Pradesh",
    },
    phone: {
      type: String,
      default: "+91 98765 00000",
    },
    distance: {
      type: String,
      default: "2.5 km",
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    reviews: {
      type: Number,
      default: 1,
    },
    specialties: {
      type: [String],
      default: ["General Medicine", "Emergency", "Cardiology"],
    },
    services: {
      type: [String],
      default: ["Emergency", "Diagnostics", "Pharmacy", "ICU"],
    },
    wait: {
      type: String,
      default: "15 min",
    },
    queue: {
      type: Number,
      default: 3,
    },
    beds: {
      type: Number,
      default: 15,
    },
    emergency: {
      type: String,
      default: "Available",
    },
    status: {
      type: String,
      default: "Open",
    },
    hours: {
      type: String,
      default: "Open 24 hours",
    },
    doctors: [doctorSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Hospital", hospitalSchema);