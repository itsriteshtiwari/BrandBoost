import { useState } from "react";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState(""); // ✅ Track errors

  const validate = () => {
    // 1. Check if empty
    if (!email.trim()) {
      setError("Please enter your email address.");
      return false;
    }
    // 2. Check email format using Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const submit = async () => {
    // Clear previous messages
    setMsg("");
    setError("");

    // Run validation
    if (!validate()) return;

    try {
      const res = await fetch("http://localhost:8000/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ Send as an object: { "email": "..." }
        body: JSON.stringify({ email: email }) 
      });

      const data = await res.json();
      
      if (!res.ok) {
        // Show error from backend if available (e.g., validation error)
        setError(data.detail || "Request failed");
      } else {
        setMsg(data.message);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card slide-in-top"> {/* added animation class if you have it */}
        <h2>Forgot Password</h2>
        <p style={{fontSize: "14px", color: "#ccc", marginBottom: "15px"}}>
          Enter your email and we'll send you a link to reset your password.
        </p>

        <input
          className="form-input" /* Matches your other inputs */
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        />

        {/* ✅ Error Message */}
        {error && <p style={{color: "red", fontSize: "14px", marginTop: "5px"}}>{error}</p>}
        
        {/* ✅ Success Message */}
        {msg && <p style={{color: "#4ade80", fontSize: "14px", marginTop: "5px"}}>{msg}</p>}

        <button className="auth-btn" onClick={submit} style={{marginTop: "15px"}}>
          Send Reset Link
        </button>
      </div>
    </div>
  );
}

export default ForgotPassword;