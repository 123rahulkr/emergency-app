// socket/socketHandler.js — FULLY COMPATIBLE VERSION
// Uses only basic Redis commands that work on ALL Redis versions
// No GEOSEARCH, no HSET object — just GET/SET/SETEX/ZADD/ZRANGE
// Nearby calculation is done in JavaScript using the Haversine formula

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const redis = require("../config/redis");

// ─── Haversine formula ─────────────────────────────────────────
// Calculates the distance in km between two GPS coordinates
// This is the same math Google Maps uses under the hood
// lat1/lon1 = point A, lat2/lon2 = point B
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in km
};

const socketHandler = (io) => {
  // ─── AUTH MIDDLEWARE ─────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      console.log("🔐 Auth attempt, token exists:", !!token);

      if (!token) {
        return next(new Error("Authentication error — no token"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await User.findById(decoded.id).select("-password");

      if (!socket.user) {
        return next(new Error("User not found"));
      }

      console.log("✅ Socket auth passed for:", socket.user.name);
      next();
    } catch (err) {
      console.log("❌ Token verification failed:", err.message);
      next(new Error("Authentication error — invalid token"));
    }
  });

  // ─── ON CONNECTION ────────────────────────────────────────────
  io.on("connection", async (socket) => {
    console.log(`🟢 User connected: ${socket.user.name} (${socket.id})`);

    try {
      // Store socketId — simple string, works on every Redis version
      // SETEX key seconds value
      await redis.setex(`user:${socket.user._id}`, 86400, socket.id);
    } catch (err) {
      console.error("Error storing socket in Redis:", err.message);
    }

    // ── update-location ────────────────────────────────────────
    // We store location as a simple JSON string
    // SET key value EX seconds
    // This avoids HSET entirely — maximum compatibility
    socket.on("update-location", async (data) => {
      const { latitude, longitude } = data;

      try {
        const locationData = JSON.stringify({
          latitude,
          longitude,
          name: socket.user.name,
          userId: socket.user._id.toString(),
          socketId: socket.id,
        });

        // Store as plain JSON string with 24hr expiry
        // Simple SET works on every Redis version ever made
        await redis.setex(`location:${socket.user._id}`, 86400, locationData);

        // Track which users have locations using a simple SET (collection)
        // SADD = add member to a set — basic Redis, always works
        await redis.sadd("active-users", socket.user._id.toString());

        console.log(
          `📍 Location updated: ${socket.user.name} → [${longitude}, ${latitude}]`,
        );
      } catch (err) {
        console.error("Redis error in update-location:", err.message);
      }
    });

    // ── emergency-created ──────────────────────────────────────
    socket.on("emergency-created", async (data) => {
      const {
        requestId,
        latitude,
        longitude,
        emergencyType,
        description,
        address,
      } = data;

      console.log(`🚨 Emergency from ${socket.user.name}: ${emergencyType}`);

      try {
        // Step 1: Get all currently active user IDs from Redis SET
        const allUserIds = await redis.smembers("active-users");
        console.log(`👤 Total active users: ${allUserIds.length}`);

        // Step 2: For each user, get their location and check distance
        // This is the "manual GEOSEARCH" using JavaScript Haversine
        const nearbyUserIds = [];

        for (const userId of allUserIds) {
          // Skip the person who created the emergency
          if (userId === socket.user._id.toString()) continue;

          // Get their stored location JSON
          const locationJson = await redis.get(`location:${userId}`);
          if (!locationJson) continue; // user has no location stored

          const loc = JSON.parse(locationJson);

          // Calculate distance between emergency and this user
          const distanceKm = getDistanceKm(
            latitude,
            longitude,
            loc.latitude,
            loc.longitude,
          );

          console.log(`  📏 ${loc.name} is ${distanceKm.toFixed(2)}km away`);

          // Only include users within 5km
          if (distanceKm <= 5) {
            nearbyUserIds.push({
              userId,
              socketId: loc.socketId,
              name: loc.name,
            });
          }
        }

        console.log(`👥 Found ${nearbyUserIds.length} nearby users within 5km`);

        // Step 3: Send alert to each nearby user
        const alertData = {
          requestId,
          emergencyType,
          description,
          address,
          location: { latitude, longitude },
          requester: {
            name: socket.user.name,
            phone: socket.user.phone,
          },
          createdAt: new Date(),
        };

        for (const { userId, socketId, name } of nearbyUserIds) {
          if (socketId) {
            io.to(socketId).emit("new-emergency-alert", alertData);
            console.log(`📢 Alert sent to ${name}`);
          }
        }

        // Join a room for this emergency (for status updates later)
        socket.join(`emergency:${requestId}`);
      } catch (error) {
        console.error("Error broadcasting emergency:", error.message);
        socket.emit("error", { message: "Failed to broadcast emergency" });
      }
    });

    // ── respond-to-emergency ───────────────────────────────────
    socket.on("respond-to-emergency", async (data) => {
      const { requestId, requesterSocketId } = data;

      if (requesterSocketId) {
        io.to(requesterSocketId).emit("responder-coming", {
          responder: {
            name: socket.user.name,
            phone: socket.user.phone,
          },
          requestId,
        });
      }

      socket.join(`emergency:${requestId}`);
      console.log(
        `🙋 ${socket.user.name} responding to emergency ${requestId}`,
      );
    });

    // ── update-emergency-status ────────────────────────────────
    socket.on("update-emergency-status", (data) => {
      const { requestId, status } = data;
      io.to(`emergency:${requestId}`).emit("emergency-status-changed", {
        requestId,
        status,
      });
    });

    // ── disconnect ─────────────────────────────────────────────
    socket.on("disconnect", async () => {
      console.log(`🔴 User disconnected: ${socket.user.name}`);

      try {
        await redis.del(`user:${socket.user._id}`);
        await redis.del(`location:${socket.user._id}`);
        // Remove from active users set
        await redis.srem("active-users", socket.user._id.toString());
      } catch (err) {
        console.error("Error cleaning Redis on disconnect:", err.message);
      }
    });
  });
};

module.exports = socketHandler;
