// src/pages/MultiplayerRoom.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const MultiplayerRoom = () => {
  const [roomId, setRoomId] = useState("");
  const [playerColor, setPlayerColor] = useState("w");
  const [selectedTime, setSelectedTime] = useState(3); // default 3 minutes
  const navigate = useNavigate();

  const createRoom = () => {
    const newRoomId = uuidv4().slice(0, 6);
    navigate(`/multiplayer/${newRoomId}?${playerColor}&time=${selectedTime}`);
  };

  const joinRoom = () => {
    if (roomId.trim() !== "") {
      navigate(`/multiplayer/${roomId}?${playerColor}&time=${selectedTime}`);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>♟️ Create or Join Multiplayer Chess ♟️</h1>
      <p style={styles.subtitle}>
        Play live chess with friends using a simple room code.
      </p>

      <div style={styles.selectorSection}>
        <div style={styles.colorTimeBox}>
          <h3>Choose Color</h3>
          <div style={styles.toggle}>
            <button
              onClick={() => setPlayerColor("w")}
              style={{
                ...styles.smallButton,
                backgroundColor: playerColor === "w" ? "#4caf50" : "#ccc",
              }}
            >
              White
            </button>
            <button
              onClick={() => setPlayerColor("b")}
              style={{
                ...styles.smallButton,
                backgroundColor: playerColor === "b" ? "#2196f3" : "#ccc",
              }}
            >
              Black
            </button>
          </div>
        </div>

        <div style={styles.colorTimeBox}>
          <h3>Choose Time</h3>
          <div style={styles.toggle}>
            {[1, 3, 5, 10].map((min) => (
              <button
                key={min}
                onClick={() => setSelectedTime(min)}
                style={{
                  ...styles.smallButton,
                  backgroundColor: selectedTime === min ? "#ff9800" : "#ccc",
                }}
              >
                {min} min
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h2>Create Room</h2>
        <button style={styles.button} onClick={createRoom}>
          Create Room as {playerColor === "w" ? "White" : "Black"}
        </button>
      </div>

      <div style={styles.section}>
        <h2>Join Room</h2>
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          style={styles.input}
        />
        <button style={styles.button} onClick={joinRoom}>
          Join Room as {playerColor === "w" ? "White" : "Black"}
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
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    padding: 20,
    background: "linear-gradient(to right, #667eea, #764ba2)",
    color: "white",
    textAlign: "center",
  },
  title: {
    fontSize: "2.5rem",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: "1.1rem",
    marginBottom: 30,
    maxWidth: "500px",
  },
  selectorSection: {
    display: "flex",
    gap: 40,
    marginBottom: 30,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  colorTimeBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  toggle: {
    marginTop: 10,
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  smallButton: {
    padding: "10px 16px",
    fontWeight: "bold",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    color: "#fff",
  },
  section: {
    margin: 20,
  },
  input: {
    padding: "10px",
    fontSize: "1rem",
    marginBottom: "10px",
    width: "200px",
    borderRadius: "8px",
    border: "none",
  },
  button: {
    padding: "12px 20px",
    fontSize: "1rem",
    fontWeight: "bold",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    backgroundColor: "#ff9800",
    color: "white",
    marginTop: 8,
  },
};

export default MultiplayerRoom;
