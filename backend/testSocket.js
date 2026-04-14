// backend/testSocket.js — UPDATED

const { io } = require("socket.io-client");

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZGRiYjRmNDc5OTJmZDNhOWRlNjE5MiIsImlhdCI6MTc3NjE0Njk5NSwiZXhwIjoxNzc4NzM4OTk1fQ.Q79TMOfFyQvp0FKeRpsTh2wwG7QiwsJeE3kfCH_sEw0";

const socket = io("http://localhost:5000", {
  auth: { token: TOKEN },

  transports: ["websocket"],

  // These help with reconnection noise in tests
  reconnectionAttempts: 3,
  reconnectionDelay: 1000,
  timeout: 5000,
});

socket.on("connect", () => {
  console.log("✅ Connected!", socket.id);
  console.log("Transport:", socket.io.engine.transport.name);

  socket.emit("update-location", {
    latitude: 28.6139,
    longitude: 77.209,
  });

  socket.emit("emergency-created", {
    requestId: "507f1f77bcf86cd799439011",
    latitude: 28.6139,
    longitude: 77.209,
    emergencyType: "medical",
    description: "Test emergency",
    address: "New Delhi, India",
  });
});

socket.on("new-emergency-alert", (data) => {
  console.log("🚨 ALERT RECEIVED:", data);
});

socket.on("connect_error", (err) => {
  console.error("❌ Connection error:", err.message);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});
