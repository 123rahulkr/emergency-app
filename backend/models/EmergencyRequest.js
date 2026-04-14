const mongoose = require("mongoose");
const emergencyRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    emergencyType: {
      type: String,
      enum: ["medical", "accident", "fire", "crime", "flood", "other"],
      required: [true, "Emergency type is required"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    address: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "responding", "resolved", "cancelled"],
      default: "active",
    },
    responders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);
emergencyRequestSchema.index({ location: "2dsphere" });
module.exports = mongoose.model("EmergencyRequest", emergencyRequestSchema);
