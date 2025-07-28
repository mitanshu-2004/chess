// App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Homepage from "./pages/Home";
import Chessboard from "./pages/Chessboard";
import MultiplayerRoom from "./pages/MultiplayerRoom";
import MultiplayerGame from "./pages/MultiplayerGame";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/bot" element={<Chessboard mode="bot" playerColor="w" />} />
        <Route path="/multiplayer" element={<MultiplayerRoom />} />
        <Route path="/multiplayer/:roomId" element={<MultiplayerRoom />} />
        <Route path="/multiplayer-game/:roomId" element={<MultiplayerGame />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
