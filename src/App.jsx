// App.jsx - Updated with new multiplayer route
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./pages/Home";
import Chessboard from "./pages/Chessboard";
import MultiplayerRoom from "./pages/MultiplayerRoom";
import MultiplayerGame from "./pages/MultiplayerGame"; // Old version
import NewMultiplayerGame from "./pages/NewMultiplayerGame"; // New version

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/bot" element={<Chessboard />} />
        <Route path="/multiplayer/:roomId" element={<MultiplayerRoom />} />
        

        {/* New improved multiplayer game route */}
        <Route path="/play/:roomId" element={<NewMultiplayerGame />} />
      </Routes>
    </Router>
  );
}

export default App;