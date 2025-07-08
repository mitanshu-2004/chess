// src/components/Homepage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const Homepage = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>♟️ React Chess ♟️</h1>
      <p style={styles.subtitle}>
        Choose your mode and start playing chess now!
      </p>

      <div style={styles.buttonsContainer}>
        <button
          style={{ ...styles.button, ...styles.botButton }}
          onClick={() => navigate("/bot")}
          aria-label="Play against Bot"
        >
          Play vs Bot
        </button>

        <button
          disabled
          style={{
            ...styles.button,
            ...styles.multiButton,
            cursor: "not-allowed",
            opacity: 0.6,
          }}
          aria-label="Play Multiplayer (Coming Soon)"
        >
          Play Multiplayer
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
    justifyContent: "center",
    alignItems: "center",
    background:
      "linear-gradient(135deg, #1f4037 0%, #99f2c8 100%)",
    padding: "20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  title: {
    fontSize: "3.5rem",
    fontWeight: "900",
    color: "#fff",
    marginBottom: "0.3em",
    textShadow: "2px 2px 5px rgba(0,0,0,0.5)",
  },
  subtitle: {
    fontSize: "1.2rem",
    color: "#e0f2f1",
    marginBottom: "2em",
    maxWidth: "320px",
    textAlign: "center",
  },
  buttonsContainer: {
    display: "flex",
    gap: "1.5rem",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
    maxWidth: "400px",
  },
  button: {
    flex: "1 1 140px",
    padding: "16px 28px",
    fontSize: "1.2rem",
    fontWeight: "700",
    borderRadius: "50px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  },
  botButton: {
    backgroundColor: "#4caf50",
    color: "#fff",
  },
  multiButton: {
    backgroundColor: "#2196f3",
    color: "#fff",
  },
  footer: {
    marginTop: "5rem",
    fontSize: "0.85rem",
    color: "rgba(255,255,255,0.8)",
  },
  
};

export default Homepage;
