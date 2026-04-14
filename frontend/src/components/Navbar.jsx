import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import socket from "../socket/socket";

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    socket.disconnect();
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-red-600 text-white px-6 py-4 flex items-center justify-between shadow-lg">
      {}
      <Link to="/" className="text-xl font-bold tracking-wide">
        🚨 EmergencyApp
      </Link>

      {}
      <div className="flex items-center gap-6">
        <Link to="/" className="text-sm hover:text-red-200 transition-colors">
          Live Map
        </Link>
        <Link
          to="/request"
          className="text-sm hover:text-red-200 transition-colors"
        >
          Request Help
        </Link>
        <Link
          to="/my-requests"
          className="text-sm hover:text-red-200 transition-colors"
        >
          My Requests
        </Link>

        {}
        <div className="flex items-center gap-3 ml-4 pl-4 border-l border-red-400">
          <span className="text-sm text-red-100">👤 {user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm bg-red-700 hover:bg-red-800 px-3 py-1 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
