const EMERGENCY_ICONS = {
  medical: "🏥",
  accident: "🚗",
  fire: "🔥",
  crime: "🚨",
  flood: "🌊",
  other: "⚠️",
};

const EmergencyAlert = ({ alert, onRespond, onDismiss }) => {
  if (!alert) return null;

  const icon = EMERGENCY_ICONS[alert.emergencyType] || "⚠️";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-bounce-once">
        {}
        <div className="bg-red-600 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <div>
              <p className="text-xs uppercase tracking-widest text-red-200">
                Emergency Nearby
              </p>
              <h2 className="text-xl font-bold capitalize">
                {alert.emergencyType} Emergency
              </h2>
            </div>
          </div>
        </div>

        {}
        <div className="px-6 py-5 space-y-3">
          {alert.description && (
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">{alert.description}</p>
            </div>
          )}

          {alert.address && (
            <div className="flex items-start gap-2">
              <span className="text-lg">📍</span>
              <p className="text-sm text-gray-600">{alert.address}</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-lg">👤</span>
            <p className="text-sm text-gray-600">
              <span className="font-medium">{alert.requester?.name}</span>
              {alert.requester?.phone && (
                <span className="text-gray-400 ml-2">
                  • {alert.requester.phone}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-lg">🕐</span>
            <p className="text-sm text-gray-400">
              {new Date(alert.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={() => onRespond(alert)}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            🙋 I'll Help
          </button>
          <button
            onClick={onDismiss}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyAlert;
