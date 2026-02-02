import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Loader2, Zap } from "lucide-react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/auth/signup/request-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      console.log("STATUS:", res.status);
      console.log("RESPONSE:", data);

      if (!res.ok) {
        throw new Error(data.detail || "OTP request failed");
      }

      // ✅ move to OTP screen
      navigate("/verify-otp", {
        state: { email, password },
      });
    } catch (err) {
      console.error("❌ SIGNUP ERROR:", err);
      alert(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-medium">MinuteX</h1>
          </div>
          <p className="text-gray-500 text-sm">
            Transform meetings into actionable minutes
          </p>
        </div>

        <div className="bg-white border rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-medium mb-1">Create account</h2>
          <p className="text-gray-500 text-sm mb-6">
            Get started with MinuteX today
          </p>

          <form onSubmit={handleSignup} className="space-y-4">
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border rounded-lg"
            />

            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border rounded-lg"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-black text-white rounded-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  Send OTP
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-sm text-center text-gray-600 mt-6">
            Already have an account?{" "}
            <Link to="/" className="text-black font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
