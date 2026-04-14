const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createRequest,
  getNearbyRequests,
  getMyRequests,
  updateRequestStatus,
  respondToRequest,
} = require("../controllers/requestController");

router.post("/", protect, createRequest);
router.get("/nearby", protect, getNearbyRequests);
router.get("/mine", protect, getMyRequests);
router.put("/:id/status", protect, updateRequestStatus);
router.put("/:id/respond", protect, respondToRequest);

module.exports = router;
