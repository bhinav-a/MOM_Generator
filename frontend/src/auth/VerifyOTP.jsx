import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../api/api";

export default function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { email, password } = location.state || {};

  if (!email || !password) {
    return <p>Invalid access. Please signup again.</p>;
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post("/auth/signup/verify-otp", {
        email,
        password,
        otp,
      });

      localStorage.setItem("token", res.data.access_token);
      navigate("/upload");
    } catch (err) {
      alert(err.response?.data?.detail || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleVerify}
        className="bg-white p-8 rounded-xl shadow w-96"
      >
        <h2 className="text-xl font-semibold mb-4">Verify OTP</h2>

        <input
          type="text"
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full border p-3 rounded mb-4"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    </div>
  );
}
