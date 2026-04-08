import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./ForgotPassword.css";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const validate = () => {
    if (!password) {
      setError("Enter new password");
      return false;
    }

    // 2. Check Length (Min 8, Max 20)
    if (password.length < 8 || password.length > 20) {
      setError("Password must be between 8 and 20 characters");
      return false;
    }

    // 3. Check Complexity (Upper + Lower + Number/Special)
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).+$/;
    if (!regex.test(password)) {
      setError("Password must have 1 Uppercase, 1 Lowercase, and 1 Number or Special char");
      return false;
    }

    return true;
  };

  const reset = async () => {
    setError("");
    
    if (!validate()) return;

    try {
      const res = await fetch(
        `http://localhost:8000/reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ new_password: password })
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert("Password reset successful");
        navigate("/");
      } else {
        setError(data.detail || "Invalid or expired link");
      }
    } catch (err) {
      setError("Something went wrong");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Reset Password</h2>

        <input
          type="password"
          className="form-input"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* ✅ Error Message Display */}
        {error && <p style={{color: "red", fontSize: "14px", marginTop: "5px"}}>{error}</p>}

        <button className="auth-btn" onClick={reset}>Reset Password</button>
      </div>
    </div>
  );
}

export default ResetPassword;