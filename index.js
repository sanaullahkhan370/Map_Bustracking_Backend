/*********************************
 * LOAD ENV VARIABLES
 *********************************/
require("dotenv").config();

/*********************************
 * IMPORT PACKAGES
 *********************************/
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

/*********************************
 * APP INITIALIZATION
 *********************************/
const app = express();
app.use(cors());
app.use(express.json());

/*********************************
 * DEBUG ENV (OPTIONAL)
 *********************************/
console.log("🔍 MONGO_URI:", process.env.MONGO_URI);
console.log("🔍 PORT:", process.env.PORT);

/*********************************
 * MONGODB CONNECTION
 *********************************/
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log("✅ MongoDB Connected");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
  });

/*********************************
 * SCHEMA & MODEL
 *********************************/
const BusSchema = new mongoose.Schema({
  busId: { type: String, required: true },
  latitude: Number,
  longitude: Number,
  updatedAt: Date,
});

const Bus = mongoose.model("Bus", BusSchema, "buses");

/*********************************
 * ROUTES
 *********************************/

// 🧪 ROOT TEST
app.get("/", (req, res) => {
  res.send("✅ Bus Tracking Backend is LIVE");
});

// 📍 LOCATION UPDATE (SMS / DRIVER APP) — FIXED VERSION
app.post("/api/location/update", async (req, res) => {
  try {
    const { busId, lat, lng } = req.body;

    console.log("📥 Location Received:", req.body);

    // ✅ CORRECT VALIDATION (BUG FIXED)
    if (!busId || lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: "busId, lat, lng required",
      });
    }

    await Bus.updateOne(
      { busId },
      {
        latitude: Number(lat),
        longitude: Number(lng),
        updatedAt: new Date(),
      },
      { upsert: true }
    );

    return res.json({
      success: true,
      message: "Location updated successfully",
    });
  } catch (err) {
    console.error("❌ Update Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// 🗺️ GET ALL BUSES (MAP / ADMIN APP)
app.get("/api/buses", async (req, res) => {
  try {
    const buses = await Bus.find().sort({ updatedAt: -1 });
    return res.json(buses);
  } catch (err) {
    console.error("❌ Fetch Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch buses",
    });
  }
});
