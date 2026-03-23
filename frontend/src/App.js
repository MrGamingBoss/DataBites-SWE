import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import LogFood from "./pages/LogFood";
import History from "./pages/History";

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
        <Route
          path="/history"
          element={
            localStorage.getItem("user") ? <History /> : <Login />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
