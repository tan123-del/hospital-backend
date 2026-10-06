require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Route Mounts
app.use("/api/auth", require("./routes/authRoutes.js"));
app.use("/api/hospitals", require("./routes/hospitalRoutes.js"));
app.use("/api/appointments", require("./routes/appointmentRoutes.js"));
app.use("/api/admin", require("./routes/adminRoutes.js"));
app.use("/api/queue", require("./routes/queueRoutes.js"));

app.get("/", (req, res) => {
  res.send("Smart Hospital Network Central API is Running.");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
