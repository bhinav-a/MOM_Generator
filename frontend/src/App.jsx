import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./auth/Login";
import Signup from "./auth/Signup";
import VerifyOTP from "./auth/VerifyOTP";
import Upload from "./pages/Upload";
import History from "./pages/History";
import ProtectedRoute from "./auth/ProtectedRoute";
import ProtectedLayout from "./components/ProtectedLayout";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />

        {/* Protected */}
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Upload />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <History />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
