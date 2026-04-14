import { useState, useEffect } from "react";
import MapComponent from "../components/MapComponent";
import EmergencyAlert from "../components/EmergencyAlert";
import Navbar from "../components/Navbar";
import useAuthStore from "../store/authStore";
import socket from "../socket/socket";
import api from "../api/axios";
import toast from "react-hot-toast";

const HomePage = () => {
  const { user, updateLocation } = useAuthStore();

  const [userLocation, setUserLocation] = useState(null);

  const [emergencies, setEmergencies] = useState([]);

  const [activeAlert, setActiveAlert] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setUserLocation(coords);
        updateLocation(coords);
        if (socket.connected) {
          socket.emit("update-location", coords);
        }

        api
          .put("/auth/location", {
            latitude: coords.latitude,
            longitude: coords.longitude,
          })
          .catch(() => {});
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Could not get your location. Please enable GPS.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (!userLocation) return;

    const fetchNearby = async () => {
      try {
        const { data } = await api.get("/requests/nearby", {
          params: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            radius: 5000,
          },
        });
        setEmergencies(data);
      } catch (error) {
        console.error("Failed to fetch nearby emergencies:", error);
      }
    };

    fetchNearby();

    const interval = setInterval(fetchNearby, 30000);
    return () => clearInterval(interval);
  }, [userLocation]);

  useEffect(() => {
    socket.on("new-emergency-alert", (alertData) => {
      console.log("🚨 New emergency alert received:", alertData);

      setActiveAlert(alertData);

      setEmergencies((prev) => [
        {
          _id: alertData.requestId,
          emergencyType: alertData.emergencyType,
          description: alertData.description,
          address: alertData.address,
          location: {
            coordinates: [
              alertData.location.longitude,
              alertData.location.latitude,
            ],
          },
          requester: alertData.requester,
          status: "active",
          createdAt: alertData.createdAt,
        },
        ...prev,
      ]);

      try {
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        oscillator.frequency.setValueAtTime(440, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + 0.5,
        );
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
      } catch (e) {}
    });

    socket.on("emergency-status-changed", ({ requestId, status }) => {
      setEmergencies((prev) =>
        prev.map((e) => (e._id === requestId ? { ...e, status } : e)),
      );

      if (status === "resolved") {
        toast.success("An emergency nearby has been resolved ✅");
      }
    });

    return () => {
      socket.off("new-emergency-alert");
      socket.off("emergency-status-changed");
    };
  }, []);

  const handleRespond = async (alert) => {
    try {
      await api.put(`/requests/${alert.requestId}/respond`);

      socket.emit("respond-to-emergency", {
        requestId: alert.requestId,
      });

      toast.success("You're responding to this emergency! 🙋");
      setActiveAlert(null);
    } catch (error) {
      toast.error("Could not register your response");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex-1 flex gap-0 overflow-hidden">
        {}
        <div className="flex-1 relative">
          {userLocation ? (
            <MapComponent
              userLocation={userLocation}
              emergencies={emergencies}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-3 animate-pulse">📍</div>
                <p className="text-gray-500">Getting your location...</p>
                <p className="text-xs text-gray-400 mt-1">
                  Please allow location access
                </p>
              </div>
            </div>
          )}
        </div>

        {}
        <div className="w-80 bg-white border-l border-gray-100 overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Nearby Emergencies</h2>
            <p className="text-xs text-gray-400 mt-0.5">Within 5km radius</p>
          </div>

          {emergencies.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm text-gray-500">
                No active emergencies nearby
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {emergencies.map((emergency) => (
                <div
                  key={emergency._id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">
                      {emergency.emergencyType === "medical"
                        ? "🏥"
                        : emergency.emergencyType === "accident"
                          ? "🚗"
                          : emergency.emergencyType === "fire"
                            ? "🔥"
                            : "⚠️"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm capitalize text-gray-800">
                        {emergency.emergencyType}
                      </p>
                      {emergency.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {emergency.description}
                        </p>
                      )}
                      {emergency.address && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          📍 {emergency.address}
                        </p>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block font-medium
                        ${
                          emergency.status === "active"
                            ? "bg-red-100 text-red-600"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        {emergency.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {}
      {activeAlert && (
        <EmergencyAlert
          alert={activeAlert}
          onRespond={handleRespond}
          onDismiss={() => setActiveAlert(null)}
        />
      )}
    </div>
  );
};

export default HomePage;
