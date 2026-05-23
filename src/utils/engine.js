// src/utils/engine.js
import axios from "axios";

export function initEngine() {
  console.log("✅ Engine initialized");
}

export async function getBestMoveFromStockfish(fen, callback) {
  console.log("📤 Sending FEN to backend:", fen);
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API}/api/bestmove`,  // ✅ Updated URL
      { fen },
      { headers: { "Content-Type": "application/json" } }
    );
    const move = response.data.bestMove;
    console.log("♟️ Engine move received:", move);
    callback(move);
  } catch (error) {
    console.error("❌ Error from backend:", error.message);
    callback(null);
  }
}
