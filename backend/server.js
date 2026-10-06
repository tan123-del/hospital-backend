const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// 1. Enable Full CORS for any origin & handle preflight OPTIONS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 2. Parse incoming JSON
app.use(express.json());

// 3. Health check route
app.get("/", (req, res) => {
  res.json({ message: "Smart Hospital Network API is running" });
});

// 4. Mount Routes
app.use("/api/auth", require("./routes/authRoutes"));

// Mount other existing routes safely
try {
  app.use("/api/hospital", require("./routes/hospitalRoutes"));
} catch (e) {}

try {
  app.use("/api/queue", require("./routes/QueueRoutes"));
} catch (e) {}

try {
  app.use("/api/appointments", require("./routes/appointmentRoutes"));
} catch (e) {}

try {
  app.use("/api/admin", require("./routes/adminRoutes"));
} catch (e) {}

// 5. Connect to MongoDB
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log("MongoDB Connected Successfully");
      // Only listen directly when not handled as an export in serverless environments
      if (process.env.NODE_ENV !== "production") {
        app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
      }
    })
    .catch((err) => console.error("MongoDB Connection Error:", err));
}

if (process.env.NODE_ENV === "production") {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

module.exports = app;
