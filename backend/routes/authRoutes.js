const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const Hospital = require("../models/Hospital");

// Configure Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper: 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 1. REGISTER (Dual-Entity Creation for Hospitals)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User with this email already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let linkedHospitalId = null;

    // Option A: If registering as Hospital, create the Facility record
    if (role === "hospital") {
      let hospitalDoc = await Hospital.findOne({ name: name.trim() });
      if (!hospitalDoc) {
        hospitalDoc = await Hospital.create({
          name: name.trim(),
          location: "Indore, Madhya Pradesh",
          address: `${name.trim()}, Indore, Madhya Pradesh`,
          phone: "+91 98765 00000",
          distance: "2.5 km",
          rating: 4.5,
          reviews: 1,
          specialties: ["General Medicine", "Emergency Care"],
          services: ["Emergency", "Diagnostics", "Pharmacy"],
          wait: "15 min",
          queue: 0,
          beds: 15,
          emergency: "Available",
          status: "Open",
          verified: false, // Requires System Admin Approval
          doctors: [
            {
              name: `Dr. ${name.split(" ")[0]} Resident`,
              specialty: "General Medicine",
              qualification: "MBBS, MD",
              experience: "5 years",
              availability: "Available today",
              verified: true,
            },
          ],
        });
      }
      linkedHospitalId = hospitalDoc._id;
    }

    // Create User record linked to the Hospital
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      hospitalId: linkedHospitalId,
      isVerified: false,
      verificationOtp: otp,
      otpExpiresAt,
    });

    // Send OTP via Nodemailer
    try {
      await transporter.sendMail({
        from: `"Smart Hospital Network" <${process.env.EMAIL_USER}>`,
        to: email.trim(),
        subject: "Smart Hospital Network - Email Verification Code",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>Verify Your Healthcare Account</h2>
            <p>Your one-time email verification code is:</p>
            <h1 style="font-size: 32px; letter-spacing: 5px; color: #2563eb;">${otp}</h1>
            <p>This code will expire in 10 minutes.</p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.warn("Mail dispatch failed, check credentials. OTP:", otp);
    }

    res.status(201).json({
      success: true,
      requiresOtp: true,
      message: "Registration initiated. Verification code sent to email.",
      email: newUser.email,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. VERIFY OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "Account already verified." });
    }

    if (user.verificationOtp !== otp.trim() || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP code." });
    }

    user.isVerified = true;
    user.verificationOtp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    res.json({ success: true, message: "Email verified successfully. You may now log in." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ success: false, message: "Invalid email or password." });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        requiresOtp: true,
        message: "Account not verified. Please verify your OTP.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, hospitalId: user.hospitalId },
      process.env.JWT_SECRET || "smartHospitalSecret2026",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hospitalId: user.hospitalId,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;