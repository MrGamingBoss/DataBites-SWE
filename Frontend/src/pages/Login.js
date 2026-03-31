import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  // toggle between login and sign up
  const [isLogin, setIsLogin] = useState(true);

  // store input values
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // message to show success or error
  const [message, setMessage] = useState("");

  // runs when form is submitted
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const url = isLogin
      ? "http://127.0.0.1:5000/login"
      : "http://127.0.0.1:5000/register";

    // ONLY email + password now
    const bodyData = { email, password };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "success");

        if (isLogin && data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
          navigate("/home");
        }
      } else {
        setMessage(data.error || "something went wrong");
      }
    } catch (error) {
      setMessage("could not connect to server");
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-card">

          {/* Title */}
          <div className="login-title-box">
            <h1 className="login-title">DataBites</h1>
          </div>

          {/* Subtitle */}
          <p className="login-subtitle">
            Please log in with existing credentials or create a new account.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">

            {/* Email */}
            <div className="login-form-group">
              <label className="login-label">Email</label>
              <input
                type="email"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="login-form-group">
              <label className="login-label">Password</label>
              <input
                type="password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Submit button */}
            <button type="submit" className="login-button login-button-primary">
              <span className="login-button-text">
                {isLogin ? "Enter" : "Sign Up"}
              </span>
            </button>
          </form>

          {/* Message */}
          {message && <p className="login-message">{message}</p>}

          {/* Toggle button */}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage("");
            }}
            className="login-button login-button-secondary"
          >
            <span className="login-button-text">
              {isLogin ? "Switch to Sign Up" : "Switch to Login"}
            </span>
          </button>

        </div>
      </div>
    </div>
  );
}

export default Login;