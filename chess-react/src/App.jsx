// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Homepage from "./components/Home";
import Chessboard from "./components/Chessboard";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/bot" element={<Chessboard mode="bot" playerColor="w" />} />
        <Route
          path="/multiplayer"
          element={<Chessboard mode="multiplayer" gameId="room1" playerColor="w" />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
