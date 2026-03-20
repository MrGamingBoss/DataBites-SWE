import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import LogFood from "./pages/LogFood";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/home"
          element={
            localStorage.getItem("user") ? <LogFood /> : <Login />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;