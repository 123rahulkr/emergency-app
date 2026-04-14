import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const EMERGENCY_ICONS = {
  medical: "🏥",
  accident: "🚗",
  fire: "🔥",
  crime: "🚨",
  flood: "🌊",
  other: "⚠️",
};

const MapComponent = ({ userLocation, emergencies }) => {
  const center = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : [28.6139, 77.209];

  return (
    <MapContainer
      center={center}
      zoom={14}
      className="w-full h-full rounded-xl"
      key={`${center[0]}-${center[1]}`}
    >
      {}
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {}
      {userLocation && (
        <>
          <Marker position={[userLocation.latitude, userLocation.longitude]}>
            <Popup>
              <div className="text-center">
                <p className="font-bold text-blue-600">📍 You are here</p>
              </div>
            </Popup>
          </Marker>

          {}
          <Circle
            center={[userLocation.latitude, userLocation.longitude]}
            radius={5000}
            pathOptions={{
              color: "#3B82F6",
              fillColor: "#3B82F6",
              fillOpacity: 0.05,
              weight: 1,
            }}
          />
        </>
      )}

      {}
      {emergencies.map((emergency) => (
        <Marker
          key={emergency._id}
          position={[
            emergency.location.coordinates[1],
            emergency.location.coordinates[0],
          ]}
          icon={redIcon}
        >
          <Popup>
            <div className="min-w-[180px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">
                  {EMERGENCY_ICONS[emergency.emergencyType]}
                </span>
                <span className="font-bold capitalize text-red-600">
                  {emergency.emergencyType}
                </span>
              </div>
              {emergency.description && (
                <p className="text-sm text-gray-600 mb-1">
                  {emergency.description}
                </p>
              )}
              {emergency.address && (
                <p className="text-xs text-gray-400">📍 {emergency.address}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                By: {emergency.requester?.name}
              </p>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full mt-2 inline-block
                ${emergency.status === "active" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}
              >
                {emergency.status}
              </span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
