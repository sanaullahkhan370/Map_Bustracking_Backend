const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// health check
app.get("/", (req, res) => {
  res.send("Bus Tracking Backend is LIVE");
});

// MongoDB connect FIRST
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log("✅ MongoDB Connected");

    // ONLY start server AFTER DB connected
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
  });

// schema
const BusSchema = new mongoose.Schema({
  busId: String,
  name: String,
  latitude: String,
  longitude: String,
});

const Bus = mongoose.model("Bus", BusSchema);

// routes
app.get("/api/buses", async (req, res) => {
  try {
    const buses = await Bus.find({});
    res.json(buses);
  } catch (err) {
    console.error("❌ Fetch Buses Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
