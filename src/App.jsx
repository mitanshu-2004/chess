// App.jsx - Updated with new multiplayer route
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Homepage from "./pages/Home";
import Chessboard from "./pages/Chessboard";
import MultiplayerRoom from "./pages/MultiplayerRoom";
import NewMultiplayerGame from "./pages/NewMultiplayerGame";
import RouteHandler from "./components/RouteHandler";

function App() {
  return (
    <BrowserRouter>
      <RouteHandler />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/bot" element={<Chessboard />} />
        <Route path="/multiplayer/:roomId" element={<MultiplayerRoom />} />
        <Route path="/play/:roomId" element={<NewMultiplayerGame />} />
        <Route path="*" element={<Homepage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;