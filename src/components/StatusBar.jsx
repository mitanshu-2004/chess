// src/components/StatusBar.jsx
import React from "react";

const StatusBar = ({ isGameOver, winner, turn, isPlayerTurn, abort }) => {
  if (abort) return <p>❌ Game Aborted</p>;
  if (isGameOver) {
    return <p>🏁 Game Over — Winner: {winner}</p>;
  }

  if (!turn) return null;

  return (
    <p>
      {isPlayerTurn ? "👉 Your turn" : "⏳ Waiting for opponent..."} (
      {turn === "w" ? "White" : "Black"})
    </p>
  );
};

export default StatusBar;
