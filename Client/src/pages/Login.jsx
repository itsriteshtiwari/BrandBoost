import React, { useState } from "react";
import "./login.css";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

const Login = () => {
  const navigate = useNavigate();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    // Basic Empty Check
    if (!usernameOrEmail || !loginPassword) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernameOrEmail: usernameOrEmail,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard/home"); // ✔ redirect to dashboard
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card slide-in-right">
        <div className="auth-logo">BrandBoost</div>

        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            className="form-input"
            placeholder="Username or email"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
          />

          <input
            type="password"
            className="form-input"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
          />

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-btn" disabled={loading} onClick={handleLogin}>
            {loading ? "Logging in..." : "Login"}
          </button>
          <a href="#" className="auth-link" onClick={() => navigate("/forgot-password")}>
            Forgot password?
          </a>

        </form>

        <div className="auth-divider"><span>OR</span></div>

        <div>
          <GoogleLogin text='continue_with'
             onSuccess={async (credentialResponse) => {
             try {
                const res = await fetch("http://localhost:8000/auth/google", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ token: credentialResponse.credential }),
                });

                const data = await res.json();

                if (!res.ok) throw new Error(data.detail);

                localStorage.setItem("user", JSON.stringify(data.user));
                navigate("/dashboard/home");
              } catch (err) {
                alert("Google login failed");
              }
            }}
            onError={() => alert("Google Login Failed")}
          />
        </div>

        <div className="auth-footer">
          Don’t have an account?
          <a href="#" className="auth-link" onClick={() => navigate("/signup")}>
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;