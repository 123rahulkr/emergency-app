const EmergencyRequest = require("../models/EmergencyRequest");
const User = require("../models/User");

const createRequest = async (req, res) => {
  const { emergencyType, description, longitude, latitude, address } = req.body;

  try {
    const request = await EmergencyRequest.create({
      requester: req.user._id,
      emergencyType,
      description,
      address,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
    });

    await request.populate("requester", "name phone");
    const io = req.app.get("io");
    if (io) {
      io.emit("emergency-created-server", {
        requestId: request._id,
        emergencyType,
        description,
        address,
        latitude,
        longitude,
        requester: {
          name: request.requester.name,
          phone: request.requester.phone,
        },
        createdAt: request.createdAt,
      });
    }
    res.status(201).json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating emergency request" });
  }
};

const getNearbyRequests = async (req, res) => {
  const { longitude, latitude, radius = 5000 } = req.query;

  try {
    const requests = await EmergencyRequest.find({
      status: "active",
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(radius),
        },
      },
    }).populate("requester", "name phone");

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching nearby requests" });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const requests = await EmergencyRequest.find({
      requester: req.user._id,
    }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Error fetching your requests" });
  }
};

const updateRequestStatus = async (req, res) => {
  const { status } = req.body;

  try {
    const request = await EmergencyRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.requester.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this request" });
    }

    request.status = status;
    await request.save();
    const io = req.app.get("io");
    if (io) {
      io.to(`emergency:${request._id}`).emit("emergency-status-changed", {
        requestId: request._id,
        status,
      });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Error updating request" });
  }
};

const respondToRequest = async (req, res) => {
  try {
    const request = await EmergencyRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.responders.includes(req.user._id)) {
      return res
        .status(400)
        .json({ message: "You already responded to this request" });
    }

    request.responders.push(req.user._id);
    request.status = "responding";
    await request.save();

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: "Error responding to request" });
  }
};

module.exports = {
  createRequest,
  getNearbyRequests,
  getMyRequests,
  updateRequestStatus,
  respondToRequest,
};
