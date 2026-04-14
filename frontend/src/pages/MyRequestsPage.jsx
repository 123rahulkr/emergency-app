import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import toast from "react-hot-toast";

const STATUS_STYLES = {
  active: "bg-red-100 text-red-600",
  responding: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const MyRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyRequests = async () => {
      try {
        const { data } = await api.get("/requests/mine");
        setRequests(data);
      } catch (error) {
        toast.error("Failed to load your requests");
      } finally {
        setLoading(false);
      }
    };

    fetchMyRequests();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/requests/${id}/status`, { status });

      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status } : r)),
      );
      toast.success(`Request marked as ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-800 mb-6">
          My Emergency Requests
        </h1>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-gray-500">No emergency requests yet</p>
            <p className="text-sm text-gray-400 mt-1">Stay safe out there!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request._id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold capitalize text-gray-800">
                        {request.emergencyType}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[request.status]}`}
                      >
                        {request.status}
                      </span>
                    </div>

                    {request.description && (
                      <p className="text-sm text-gray-500 mb-1">
                        {request.description}
                      </p>
                    )}

                    {request.address && (
                      <p className="text-xs text-gray-400">
                        📍 {request.address}
                      </p>
                    )}

                    <p className="text-xs text-gray-400 mt-1">
                      🕐 {new Date(request.createdAt).toLocaleString()}
                    </p>

                    {request.responders?.length > 0 && (
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        🙋 {request.responders.length} person(s) responding
                      </p>
                    )}
                  </div>

                  {/* Status action buttons */}
                  {request.status === "active" ||
                  request.status === "responding" ? (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => updateStatus(request._id, "resolved")}
                        className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        ✅ Resolved
                      </button>
                      <button
                        onClick={() => updateStatus(request._id, "cancelled")}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRequestsPage;
