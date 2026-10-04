const express = require("express");
const router = express.Router();
const Queue = require("../models/Queue");
const Hospital = require("../models/Hospital");

// Join live queue (FR-10, US-12, US-13)
router.post("/join", async (req, res) => {
  try {
    const { hospitalId, patientEmail, patientName, doctorName, specialty } = req.body;
    
    // Check if patient is already in an active queue for this hospital
    const existing = await Queue.findOne({ hospitalId, patientEmail, status: "Waiting" });
    if (existing) {
      return res.status(400).json({ success: false, message: "You are already in queue with token " + existing.tokenString });
    }

    // Determine the next token number for this hospital
    const lastEntry = await Queue.findOne({ hospitalId }).sort({ tokenNumber: -1 });
    const nextTokenNum = lastEntry ? lastEntry.tokenNumber + 1 : 1;
    const tokenStr = `Q${nextTokenNum}`;

    const newQueueEntry = await Queue.create({
      hospitalId,
      hospitalName: req.body.hospitalName || "Hospital",
      tokenNumber: nextTokenNum,
      tokenString: tokenStr,
      patientEmail,
      patientName: patientName || "Patient",
      doctorName: doctorName || "General Duty Physician",
      specialty: specialty || "General Medicine",
      status: "Waiting",
    });

    // Update hospital queue count in DB
    const waitingCount = await Queue.countDocuments({ hospitalId, status: "Waiting" });
    await Hospital.findByIdAndUpdate(hospitalId, { queue: waitingCount, wait: `${waitingCount * 3 + 5} min` });

    res.status(201).json({ success: true, queue: newQueueEntry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get patient active queue status (US-13)
router.get("/status", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const activeEntry = await Queue.findOne({ patientEmail: email, status: "Waiting" }).sort({ createdAt: -1 });
    if (!activeEntry) {
      return res.json({ success: true, active: false });
    }

    // Count patients waiting ahead
    const ahead = await Queue.countDocuments({
      hospitalId: activeEntry.hospitalId,
      status: "Waiting",
      tokenNumber: { $lt: activeEntry.tokenNumber },
    });

    res.json({
      success: true,
      active: true,
      queue: {
        id: activeEntry._id,
        hospitalId: activeEntry.hospitalId,
        hospitalName: activeEntry.hospitalName,
        token: activeEntry.tokenString,
        tokenNumber: activeEntry.tokenNumber,
        doctor: activeEntry.doctorName,
        specialty: activeEntry.specialty,
        peopleAhead: ahead,
        estimatedWait: Math.max(2, ahead * 4),
        status: activeEntry.status,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Advance token (Call next patient)
router.post("/advance", async (req, res) => {
  try {
    const { hospitalId } = req.body;
    const nextPatient = await Queue.findOne({ hospitalId, status: "Waiting" }).sort({ tokenNumber: 1 });
    if (nextPatient) {
      nextPatient.status = "Completed";
      await nextPatient.save();
    }

    const waitingCount = await Queue.countDocuments({ hospitalId, status: "Waiting" });
    await Hospital.findByIdAndUpdate(hospitalId, { queue: waitingCount, wait: `${waitingCount * 3 + 5} min` });

    res.json({ success: true, message: "Advanced queue token successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Leave live queue
router.post("/leave", async (req, res) => {
  try {
    const { email } = req.body;
    await Queue.updateMany({ patientEmail: email, status: "Waiting" }, { status: "Cancelled" });
    res.json({ success: true, message: "Left queue successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;