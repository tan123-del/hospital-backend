const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Resend } = require("resend");
const User = require("../models/User");
const Hospital = require("../models/Hospital");

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function: Generate a random 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 1. REGISTER ROUTE
router.post("/register", async (req, res) => {
  try {
    let { name, email, password, role } = req.body;
    email = email ? email.trim().toLowerCase() : "";
    password = password ? password.trim() : "";

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Check if an account already exists with this email
    let existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: "An account with this email already exists. Please log in." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    let hospitalId = null;

    if (role === "hospital") {
      let facility = await Hospital.findOne({ name });
      if (!facility) {
        facility = await Hospital.create({
          name,
          location: "Indore, Madhya Pradesh",
          address: `${name}, Indore`,
          verified: false,
        });
      }
      hospitalId = facility._id;
    }

    if (existingUser && !existingUser.isVerified) {
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.role = role;
      existingUser.hospitalId = hospitalId;
      existingUser.verificationOtp = otp;
      existingUser.otpExpiresAt = otpExpiresAt;
      await existingUser.save();
    } else {
      await User.create({
        name,
        email,
        password: hashedPassword,
        role: role || "patient",
        hospitalId,
        isVerified: false,
        verificationOtp: otp,
        otpExpiresAt,
      });
    }

    console.log(`\n========================================`);
    console.log(`[OTP DISPATCH] Recipient: ${email}`);
    console.log(`[OTP CODE]      ${otp}`);
    console.log(`========================================\n`);

    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: "Smart Hospital <onboarding@resend.dev>",
          to: email,
          subject: "Your Smart Hospital Network Verification Code",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 500px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #2563eb; margin-top: 0;">Smart Hospital Network</h2>
              <p style="font-size: 15px;">Your one-time email verification code is:</p>
              <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e293b;">${otp}</span>
              </div>
              <p style="font-size: 13px; color: #64748b;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
            </div>
          `,
        });
        console.log(`[Resend] Successfully delivered verification email to ${email}`);
      } catch (mailErr) {
        console.error("[Resend Error]:", mailErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      requiresOtp: true,
      message: "Verification code sent to your email.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Registration failed: " + error.message });
  }
});

// 2. VERIFY OTP ROUTE
router.post("/verify-otp", async (req, res) => {
  try {
    let { email, otp } = req.body;
    email = email ? email.trim().toLowerCase() : "";
    otp = otp ? otp.trim() : "";

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User account not found." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Account is already verified. Please log in." });
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "Verification code has expired. Please register again." });
    }

    if (user.verificationOtp !== otp) {
      return res.status(400).json({ message: "Invalid verification code. Please check and try again." });
    }

    user.isVerified = true;
    user.verificationOtp = null;
    user.otpExpiresAt = null;
    await user.save();

    console.log(`[AUTH] User verified successfully: ${email}`);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully! You can now log in.",
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({ message: "Verification failed." });
  }
});

// 3. LOGIN ROUTE (With explicit debugging)
router.post("/login", async (req, res) => {
  try {
    let { email, password, role } = req.body;
    email = email ? email.trim().toLowerCase() : "";
    password = password ? password.trim() : "";

    console.log(`\n--- LOGIN ATTEMPT ---`);
    console.log(`Attempting email: "${email}" | Attempting role: "${role}"`);

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[LOGIN FAILED] No user found in MongoDB with email: ${email}`);
      return res.status(400).json({ message: "Invalid email or password." });
    }

    console.log(`[LOGIN DEBUG] Account found. Registered role: "${user.role}" | isVerified: ${user.isVerified}`);

    // Check verification status
    if (!user.isVerified) {
      console.log(`[LOGIN BLOCKED] User email is not verified.`);
      return res.status(403).json({
        requiresOtp: true,
        message: "Your email is not verified. Please verify your OTP first.",
      });
    }

    // Role check (if role was passed from frontend)
    if (role && user.role && user.role.toLowerCase() !== role.toLowerCase()) {
      console.log(`[LOGIN BLOCKED] Role mismatch: User is '${user.role}' but tried logging in as '${role}'`);
      return res.status(400).json({
        message: `Account role is '${user.role}', not '${role}'. Please switch role to log in.`,
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`[LOGIN DEBUG] Bcrypt match result: ${isMatch}`);

    if (!isMatch) {
      console.log(`[LOGIN FAILED] Password mismatch for ${email}`);
      return res.status(400).json({ message: "Invalid email or password." });
    }

    console.log(`[LOGIN SUCCESS] ${email} authenticated successfully.`);

    const token = jwt.sign(
      { id: user._id, role: user.role, hospitalId: user.hospitalId },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "1d" }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        hospitalId: user.hospitalId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Login failed." });
  }
});

module.exports = router;