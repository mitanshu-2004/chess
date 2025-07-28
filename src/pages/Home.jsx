// Homepage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const Homepage = () => {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const handleMultiplayer = () => {
    if (!username.trim()) {
      alert("Please enter your name");
      return;
    }
    const roomId = uuidv4().slice(0, 6); // Generate short room ID
    navigate(`/multiplayer/${roomId}?username=${encodeURIComponent(username)}&color=w`);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>♟️ React Chess ♟️</h1>
      <input
        type="text"
        placeholder="Enter your name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={styles.input}
      />
      <div style={styles.buttonsContainer}>
        <button
          style={{ ...styles.button, backgroundColor: "#4caf50" }}
          onClick={() => navigate(`/bot?username=${username}`)}
        >
          Play vs Bot
        </button>
        <button
          style={{ ...styles.button, backgroundColor: "#2196f3" }}
          onClick={handleMultiplayer}
        >
          Create Multiplayer Game
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#212121",
    color: "white",
  },
  input: {
    padding: "10px",
    marginBottom: "20px",
    fontSize: "16px",
  },
  buttonsContainer: {
    display: "flex",
    gap: "1rem",
  },
  button: {
    padding: "14px 24px",
    fontSize: "16px",
    fontWeight: "bold",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
  },
  title: {
    fontSize: "3rem",
    marginBottom: "20px",
  },
};

export default Homepage;
