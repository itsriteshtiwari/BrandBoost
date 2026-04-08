import React, { useState } from "react";
import "./login.css";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

const Signup = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateForm = () => {
    // 1. Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }

    // 2. Name: Alphabets only, Max 50
    if (!/^[a-zA-Z\s]+$/.test(fullName)) {
      setError("Full Name must contain only alphabets.");
      return false;
    }
    if (fullName.length > 50) {
      setError("Full Name cannot exceed 50 characters.");
      return false;
    }

    // 3. Username: Lowercase only, Max 20
    if (!/^[a-z]+$/.test(username)) {
      setError("Username must be lowercase letters only (no numbers/spaces).");
      return false;
    }
    if (username.length > 20) {
      setError("Username cannot exceed 20 characters.");
      return false;
    }

    // 4. Password: 8-20 chars, Upper+Lower+(Num or Special)
    if (signupPassword.length < 8 || signupPassword.length > 20) {
      setError("Password must be between 8 and 20 characters.");
      return false;
    }
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).+$/;
    if (!pwdRegex.test(signupPassword)) {
      setError("Password must have 1 Uppercase, 1 Lowercase, and 1 Number or Special char.");
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    // 1. CLEAR PREVIOUS ERRORS
    setError("");
    
    // 2. RUN VALIDATION BEFORE FETCH
    if (!validateForm()) {
      return; // Stop if validation fails
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fullName,
          username,
          password: signupPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Use the detailed error from backend if available
        throw new Error(data.detail || "Signup failed");
      }

      navigate("/login"); 
    } catch (err) {
      // If validation error comes from backend (Array of errors), show first one
      if (Array.isArray(err.message)) {
         setError(err.message[0].msg);
      } else {
         setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card slide-in-left">
        <div className="auth-logo">BrandBoost</div>

        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <input type="email" className="form-input" placeholder="Email"
            value={email} onChange={(e) => setEmail(e.target.value)} />

          <input type="text" className="form-input" placeholder="Full Name"
            value={fullName} onChange={(e) => setFullName(e.target.value)} />

          <input type="text" className="form-input" placeholder="Username"
            value={username} onChange={(e) => setUsername(e.target.value)} />

          <input type="password" className="form-input" placeholder="Password"
            value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} />

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-btn" disabled={loading} onClick={handleSignup}>
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <div className="auth-divider"><span>OR</span></div>

        <GoogleLogin text="continue_with"
            onSuccess={async (credentialResponse) => {
              try {
                const res = await fetch("http://localhost:8000/auth/google", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ token: credentialResponse.credential }),
                });

                const data = await res.json();

                localStorage.setItem("user", JSON.stringify(data.user));
                navigate("/dashboard/home");
              } catch {
                alert("Google signup failed");
              }
            }}
            onError={() => alert("Google Signup Failed")}
          />

        <div className="auth-footer">
          Already have an account?
          <a href="#" className="auth-link" onClick={() => navigate("/login")}>Login</a>
        </div>
      </div>
    </div>
  );
};

export default Signup;
