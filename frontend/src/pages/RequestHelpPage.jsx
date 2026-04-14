import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import socket from "../socket/socket";
import toast from "react-hot-toast";

const EMERGENCY_TYPES = [
  { value: "medical", label: "Medical Emergency", icon: "🏥" },
  { value: "accident", label: "Accident", icon: "🚗" },
  { value: "fire", label: "Fire", icon: "🔥" },
  { value: "crime", label: "Crime / Unsafe", icon: "🚨" },
  { value: "flood", label: "Flood", icon: "🌊" },
  { value: "other", label: "Other", icon: "⚠️" },
];

const RequestHelpPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    emergencyType: "",
    description: "",
    address: "",
  });
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(true);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setGettingLocation(false);
      },
      () => {
        toast.error("Could not get your location");
        setGettingLocation(false);
      },
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.emergencyType) {
      toast.error("Please select an emergency type");
      return;
    }

    if (!location) {
      toast.error("Location is required to send an emergency request");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post("/requests", {
        ...form,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      socket.emit("emergency-created", {
        requestId: data._id,
        latitude: location.latitude,
        longitude: location.longitude,
        emergencyType: form.emergencyType,
        description: form.description,
        address: form.address,
      });

      toast.success("🚨 Help request sent! Nearby users are being alerted.");
      navigate("/my-requests");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {}
          <div className="bg-red-600 px-6 py-5 text-white">
            <h1 className="text-xl font-bold">🚨 Request Emergency Help</h1>
            <p className="text-red-200 text-sm mt-1">
              Nearby users will be alerted instantly
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {}
            <div
              className={`flex items-center gap-3 p-3 rounded-xl text-sm
              ${
                gettingLocation
                  ? "bg-yellow-50 text-yellow-700"
                  : location
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
              }`}
            >
              <span className="text-lg">
                {gettingLocation ? "⏳" : location ? "✅" : "❌"}
              </span>
              <span>
                {gettingLocation
                  ? "Getting your location..."
                  : location
                    ? `Location found (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`
                    : "Location unavailable"}
              </span>
            </div>

            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Type of Emergency *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {EMERGENCY_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      setForm({ ...form, emergencyType: type.value })
                    }
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
                      ${
                        form.emergencyType === type.value
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What's happening? (optional)
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Brief description to help responders understand the situation..."
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition resize-none"
              />
            </div>

            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address / Landmark (optional)
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Near the main gate, opposite the hospital..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading || gettingLocation || !location}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-4 rounded-xl transition-colors text-lg"
            >
              {loading ? "Sending Alert..." : "🚨 Send Emergency Alert"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestHelpPage;
