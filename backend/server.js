const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// 1. Comprehensive CORS setup
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  credentials: false
};

app.use(cors(corsOptions));

// Explicitly handle all preflight OPTIONS requests across any endpoint
app.options("*", cors(corsOptions));

// 2. Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Root health-check endpoint
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Smart Hospital API is operational" });
});

// 4. API Routes Mounting (with fallback protection)
try {
  app.use("/api/auth", require("./routes/authRoutes"));
} catch (err) {
  console.warn("authRoutes not loaded:", err.message);
}

try {
  app.use("/api/hospitals", require("./routes/hospitalRoutes"));
} catch (err) {
  console.warn("hospitalRoutes not loaded:", err.message);
}

try {
  app.use("/api/queue", require("./routes/QueueRoutes"));
} catch (err) {
  console.warn("QueueRoutes not loaded:", err.message);
}

try {
  app.use("/api/appointments", require("./routes/appointmentRoutes"));
} catch (err) {
  console.warn("appointmentRoutes not loaded:", err.message);
}

try {
  app.use("/api/admin", require("./routes/adminRoutes"));
} catch (err) {
  console.warn("adminRoutes not loaded:", err.message);
}

// 5. Global 404 Fallback that includes CORS headers
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});

// 6. Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

// 7. Database Connection & Port Binding
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => console.error("MongoDB connection failed:", err));
}

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

module.exports = app;
