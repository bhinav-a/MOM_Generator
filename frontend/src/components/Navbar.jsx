import { Link, useNavigate, useLocation } from "react-router-dom";
import { Upload, Clock, LogOut, Zap } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand - With Icon */}
          <Link to="/upload" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center group-hover:bg-gray-800 transition">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-medium text-black tracking-tight">
              MinuteX
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            <Link
              to="/upload"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                isActive("/upload")
                  ? "text-black bg-gray-100"
                  : "text-gray-600 hover:text-black hover:bg-gray-50"
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload
            </Link>

            <Link
              to="/history"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                isActive("/history")
                  ? "text-black bg-gray-100"
                  : "text-gray-600 hover:text-black hover:bg-gray-50"
              }`}
            >
              <Clock className="w-4 h-4" />
              History
            </Link>

            <div className="w-px h-6 bg-gray-200 mx-2"></div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-black hover:bg-gray-50 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}