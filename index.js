// ================================
// IMPORTS & CONFIG
// ================================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ================================
// MIDDLEWARES
// ================================
app.use(cors());
app.use(express.json());

// ================================
// MONGODB CONNECTION
// ================================
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ================================
// TEST ROUTE (DEPLOY CHECK)
// ================================
app.get("/", (req, res) => {
  res.send("🚍 Bus Tracking Backend is LIVE");
});

// ================================
// USERS COLLECTION (Flexible Schema)
// ================================
const userSchema = new mongoose.Schema(
  {},
  {
    strict: false,
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema, "users");

// ================================
// DRIVER → LOCATION UPDATE API
// ================================
app.post("/api/location/update", async (req, res) => {
  try {
    const { busId, latitude, longitude } = req.body;

    if (!busId || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "busId, latitude and longitude are required",
      });
    }

    const updatedUser = await User.findOneAndUpdate(
      { busId: busId },
      {
        latitude,
        longitude,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Driver / Bus not found",
      });
    }

    res.json({
      success: true,
      message: "📍 Location updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("❌ Location Update Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
});

// ================================
// STUDENT → GET ALL BUSES API
// ================================
app.get("/api/buses", async (req, res) => {
  try {
    const users = await User.find({});

    const buses = users.map((u) => ({
      busId: u.busId ?? "NO BUS ID",
      latitude: u.latitude ?? null,
      longitude: u.longitude ?? null,
      name: u.name ?? "NO NAME",
      role: u.role ?? "NO ROLE",
      updatedAt: u.updatedAt ?? null,
    }));

    res.json(buses);
  } catch (error) {
    console.error("❌ Fetch Buses Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
});

// ================================
// SERVER START (RENDER READY)
// ================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
