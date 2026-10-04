const mongoose = require("mongoose");

const queueSchema = new mongoose.Schema(
  {
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true },
    hospitalName: { type: String, required: true },
    tokenNumber: { type: Number, required: true }, // e.g. 75
    tokenString: { type: String, required: true }, // e.g. "Q75"
    patientEmail: { type: String, required: true },
    patientName: { type: String, default: "Patient" },
    doctorName: { type: String, default: "General Duty Physician" },
    specialty: { type: String, default: "General Medicine" },
    status: { type: String, enum: ["Waiting", "In-Consultation", "Completed", "Cancelled"], default: "Waiting" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Queue", queueSchema);