import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import LogFood from "./pages/LogFood";
import History from "./pages/History";
import Insights from "./pages/Insights";

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
        <Route
          path="/insights"
          element={
            localStorage.getItem("user") ? <Insights /> : <Login />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
