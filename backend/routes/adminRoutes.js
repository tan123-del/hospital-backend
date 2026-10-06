const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Hospital = require("../models/Hospital");
const Appointment = require("../models/Appointment");
const AuditLog = require("../models/auditlog");

// 1. Get Platform Analytics Overview (FR-18)
router.get("/overview", async (req, res) => {
  try {
    const totalHospitals = await Hospital.countDocuments();
    const verifiedHospitals = await Hospital.countDocuments({ verified: true });
    const totalUsers = await User.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    const pendingAppointments = await Appointment.countDocuments({ status: "Pending" });

    res.json({
      success: true,
      stats: {
        totalHospitals,
        verifiedHospitals,
        pendingApprovals: totalHospitals - verifiedHospitals,
        totalUsers,
        totalAppointments,
        pendingAppointments,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Get All Users (US-16)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Update User Role (US-16)
router.put("/users/:id/role", async (req, res) => {
  try {
    const { role, adminEmail } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");

    await AuditLog.create({
      action: "UPDATE_USER_ROLE",
      performedBy: adminEmail || "system-admin",
      details: `Changed role of user ${user.email} to ${role}`,
    });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Verify / Approve a Hospital (US-08)
router.put("/hospitals/:id/verify", async (req, res) => {
  try {
    const { adminEmail, status } = req.body;
    const hospital = await Hospital.findByIdAndUpdate(req.params.id, { verified: status }, { new: true });

    await AuditLog.create({
      action: status ? "APPROVE_HOSPITAL" : "REVOKE_HOSPITAL",
      performedBy: adminEmail || "system-admin",
      details: `${status ? "Approved" : "Revoked"} hospital verification for ${hospital.name}`,
    });

    res.json({ success: true, hospital });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Get Audit Logs (US-17)
router.get("/audit-logs", async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(50);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
