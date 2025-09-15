import { useEffect } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import axios from "axios"

import Homepage from "./pages/Home"
import Chessboard from "./pages/Chessboard"
import MultiplayerRoom from "./pages/MultiplayerRoom"
import NewMultiplayerGame from "./pages/NewMultiplayerGame"
import MultiplayerLobby from "./pages/MultiplayerLobby"

function App() {
  useEffect(() => {
    const wakeUpBackend = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API}/api/health`)
        console.log("🌐 Backend health:", res.data)
      } catch (err) {
        console.error("❌ Health check failed:", err.message)
      }
    }

    wakeUpBackend()
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/bot" element={<Chessboard />} />
        <Route path="/multiplayer-lobby" element={<MultiplayerLobby />} />
        <Route path="/multiplayer/:roomId" element={<MultiplayerRoom />} />
        <Route path="/play/:roomId" element={<NewMultiplayerGame />} />
      </Routes>
    </Router>
  )
}

export default App
