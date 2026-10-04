const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");

// GET appointments (by patient email OR by hospitalId)
router.get("/", async (req, res) => {
  try {
    const { email, hospitalId } = req.query;
    let query = {};

    if (email) {
      query.patientEmail = email.toLowerCase();
    }
    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    const appointments = await Appointment.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: appointments.length, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST: Book new appointment (Status defaults to Pending)
router.post("/", async (req, res) => {
  try {
    const { patientName, patientEmail, hospitalId, doctor, specialty, date, time } = req.body;

    const appointment = await Appointment.create({
      patientName,
      patientEmail: patientEmail.toLowerCase(),
      hospitalId,
      hospitalName: req.body.hospitalName || "Partner Hospital",
      doctor,
      specialty,
      date,
      time,
      status: "Pending", // Real-life workflow starts in Pending until hospital accepts
    });

    res.status(201).json({ success: true, appointment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT: Hospital Staff accepts, reschedules, or cancels appointment
router.put("/:id/status", async (req, res) => {
  try {
    const { status, rescheduledTime, notes } = req.body; // status: "Confirmed" | "Cancelled" | "Completed"
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    appointment.status = status;
    if (rescheduledTime) appointment.time = rescheduledTime;
    if (notes) appointment.notes = notes;

    await appointment.save();
    res.json({ success: true, appointment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;