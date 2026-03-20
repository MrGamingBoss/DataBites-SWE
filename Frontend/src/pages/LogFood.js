import React from "react";

function LogFood() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div style={{ padding: "20px" }}>
      <h2>Home / Log Food</h2>

      {user && <p>Welcome, {user.username}</p>}

      <p>This is where food logging will go.</p>
    </div>
  );
}

export default LogFood;