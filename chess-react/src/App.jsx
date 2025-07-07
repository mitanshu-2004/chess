import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Chessboard from "./components/Chessboard";

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Chessboard />} />
    </Routes>
  </Router>
);

export default App;
