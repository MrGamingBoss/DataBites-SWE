import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  // toggle between login and sign up
  const [isLogin, setIsLogin] = useState(true);

  // store input values
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // message to show success or error
  const [message, setMessage] = useState("");

  // runs when form is submitted
  const handleSubmit = async (e) => {
    e.preventDefault(); // stop page refresh
    setMessage("");

    // choose correct endpoint based on mode
    const url = isLogin
      ? "http://127.0.0.1:5000/login"
      : "http://127.0.0.1:5000/register";

    // build request body
    const bodyData = isLogin
      ? { email, password }
      : { username, email, password };

    try {
      // send request to backend
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();

      if (response.ok) {
        // show success message
        setMessage(data.message || "success");

        // if login worked, store user and go to home page
        if (isLogin && data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
          navigate("/home");
        }
      } else {
        // show error from backend
        setMessage(data.error || "something went wrong");
      }
    } catch (error) {
      // if server isn't running or fails
      setMessage("could not connect to server");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "40px auto" }}>
      {/* title changes based on mode */}
      <h2>{isLogin ? "Login" : "Sign Up"}</h2>

      <form onSubmit={handleSubmit}>
        {/* only show username for sign up */}
        {!isLogin && (
          <div style={{ marginBottom: "10px" }}>
            <label>Username</label>
            <br />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required={!isLogin}
            />
          </div>
        )}

        {/* email input */}
        <div style={{ marginBottom: "10px" }}>
          <label>Email</label>
          <br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* password input */}
        <div style={{ marginBottom: "10px" }}>
          <label>Password</label>
          <br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* submit button */}
        <button type="submit">
          {isLogin ? "Login" : "Sign Up"}
        </button>
      </form>

      {/* show success/error message */}
      <p>{message}</p>

      {/* button to switch between login/sign up */}
      <button
        onClick={() => {
          setIsLogin(!isLogin);
          setMessage("");
        }}
        style={{ marginTop: "10px" }}
      >
        Switch to {isLogin ? "Sign Up" : "Login"}
      </button>
    </div>
  );
}

export default Login;