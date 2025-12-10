const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ MongoDB Connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((e) => console.log("❌ Mongo Error", e));

// ✅ Test Route
app.get("/", (req, res) => {
  res.send("Bus Tracking Server Running...");
});

/* ======================================================
   ✅ USERS COLLECTION MODEL (Direct users collection)
   ====================================================== */
const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model("User", userSchema, "users");

/* ======================================================
   ✅ DRIVER → LOCATION UPDATE (users collection update)
   ====================================================== */
app.post("/api/location/update", async (req, res) => {
  const { busId, latitude, longitude } = req.body;

  try {
    const updatedUser = await User.findOneAndUpdate(
      { busId: busId }, // ❗ role filter hata diya for safety
      {
        latitude,
        longitude,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json({
      success: true,
      message: "Location updated in users collection",
      user: updatedUser,
    });
  } catch (e) {
    res.status(500).json({ message: "Server Error", error: e });
  }
});

/* ======================================================
   ✅ ✅ ✅ DEBUG: STUDENT → ALL USERS AS BUSES (NO FILTER)
   ====================================================== */
app.get("/api/buses", async (req, res) => {
  try {
    // ❗❗ KISI BHI TARAH KA FILTER NAHI
    const users = await User.find({});

    console.log("✅ ALL USERS FROM DB:", users);

    const buses = users.map((u) => ({
      busId: u.busId || "NO BUS ID",
      latitude: u.latitude || u.latitue || "NO LAT",
      longitude: u.longitude || "NO LNG",
      name: u.name || "NO NAME",
      role: u.role || "NO ROLE",
    }));

    res.json(buses);
  } catch (e) {
    console.error("❌ API /api/buses error:", e);
    res.status(500).json({ message: "Server Error", error: e });
  }
});

/* ======================================================
   ✅ SERVER START
   ====================================================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
