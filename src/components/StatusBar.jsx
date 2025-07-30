// StatusBar.jsx - Updated for better game status display
import React from "react";

const StatusBar = ({ isGameOver, winner, abort, ifTimeout }) => {
  if (abort) {
    return <p style={styles.status}>❌ Game Aborted - Winner: {winner}</p>;
  }
  
  if (ifTimeout) {
    return <p style={styles.status}>⏰ Time's Up! - Winner: {winner}</p>;
  }
  
  if (isGameOver) {
    if (winner === "Draw") {
      return <p style={styles.status}>🤝 Game Over - Draw!</p>;
    }
    return <p style={styles.status}>🏁 Game Over - Winner: {winner}</p>;
  }

  return null;
};

const styles = {
  status: {
    fontSize: "1.1rem",
    fontWeight: "bold",
    textAlign: "center",
    padding: "10px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    margin: "10px 0",
  },
};

export default StatusBar;