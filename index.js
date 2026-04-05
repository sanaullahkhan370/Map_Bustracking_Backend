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
 * SCHEMAS & MODELS
 *********************************/

// 🚌 BUS SCHEMA
const BusSchema = new mongoose.Schema({
  busId: { type: String, required: true },
  latitude: Number,
  longitude: Number,
  updatedAt: Date,
});
const Bus = mongoose.model("Bus", BusSchema, "buses");

// 👤 USER SCHEMA
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  role: { type: String, default: "student" },
});
const User = mongoose.model("User", UserSchema, "users");

// 💳 PAYMENT SCHEMA
const PaymentSchema = new mongoose.Schema({
  txnId: { type: String, required: true },
  sender: String,
  createdAt: { type: Date, default: Date.now }
});
const Payment = mongoose.model("Payment", PaymentSchema, "payments");

/*********************************
 * ROUTES
 *********************************/

// 🧪 ROOT
app.get("/", (req, res) => {
  res.send("✅ Smart Bus Tracker Backend is LIVE");
});


// ===================== USER APIs =====================

// ➕ REGISTER USER
app.post("/api/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "username & password required",
      });
    }

    const already = await User.findOne({ username });
    if (already) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      username,
      password,
      role: role || "student",
    });

    return res.json({
      success: true,
      message: "User registered successfully",
      user: {
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Register Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// 🔐 LOGIN USER
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "username & password required",
      });
    }

    const user = await User.findOne({ username });

    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    return res.json({
      success: true,
      message: "Login successful",
      user: {
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


// ===================== BUS APIs =====================

// 📍 LOCATION UPDATE
app.post("/api/location/update", async (req, res) => {
  try {
    const { busId, lat, lng } = req.body;

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
      message: "Location updated",
    });
  } catch (err) {
    console.error("❌ Update Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// 🗺️ GET ALL BUSES
app.get("/api/buses", async (req, res) => {
  try {
    const buses = await Bus.find().sort({ updatedAt: -1 });
    return res.json(buses);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch buses",
    });
  }
});


// ===================== PAYMENT API =====================

// 📩 SMS PAYMENT RECEIVE
app.post("/api/payment-sms", async (req, res) => {
  try {
    const { txnId, sender } = req.body;

    if (!txnId || !sender) {
      return res.status(400).json({
        success: false,
        message: "txnId and sender required"
      });
    }

    // 🔍 Duplicate check
    const exists = await Payment.findOne({ txnId });

    if (exists) {
      return res.json({
        success: true,
        message: "Already exists"
      });
    }

    // 💾 Save
    await Payment.create({
      txnId,
      sender
    });

    console.log("💰 Payment Saved:", txnId);

    return res.json({
      success: true,
      message: "Payment saved"
    });

  } catch (err) {
    console.error("❌ Payment Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});
