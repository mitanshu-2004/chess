"use client"

// pages/MultiplayerLobby.jsx - New Multiplayer Lobby with Eye-Catching Design
import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

const MultiplayerLobby = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const username = searchParams.get("username")

  const [isAnimating, setIsAnimating] = useState(false)
  const [showJoinInput, setShowJoinInput] = useState(false)
  const [roomIdInput, setRoomIdInput] = useState("")
  const [inputError, setInputError] = useState("")

  useEffect(() => {
    setTimeout(() => setIsAnimating(true), 100)
  }, [])

  if (!username) {
    // Redirect to home if username is missing
    useEffect(() => {
      navigate("/")
    }, [navigate])
    return null // Or a loading/error message
  }

  const handleCreateRoom = () => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    navigate(`/multiplayer/${roomId}?username=${encodeURIComponent(username)}`)
  }

  const handleJoinRoom = () => {
    if (!roomIdInput.trim()) {
      setInputError("Room ID cannot be empty.")
      return
    }
    if (roomIdInput.trim().length !== 6) {
      setInputError("Room ID must be 6 characters.")
      return
    }
    setInputError("")
    navigate(`/multiplayer/${roomIdInput.trim().toUpperCase()}?username=${encodeURIComponent(username)}`)
  }

  return (
    <div style={styles.wrapper}>
      {/* Animated background elements */}
      <div style={styles.backgroundElements}>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.floatingPiece,
              top: `${10 + i * 12}%`,
              left: `${5 + (i % 2) * 90}%`,
              animationDelay: `${i * 0.7}s`,
            }}
          >
            {["♔", "♛", "♜", "♝", "♞", "♟", "♚", "♕"][i]}
          </div>
        ))}
      </div>

      <div
        style={{
          ...styles.container,
          transform: isAnimating ? "translateY(0) scale(1)" : "translateY(5vh) scale(0.95)",
          opacity: isAnimating ? 1 : 0,
        }}
      >
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerIcon}>⚔️</div>
          <h1 style={styles.title}>
            <span style={styles.titleMain}>Multiplayer</span>
            <span style={styles.titleAccent}>Lobby</span>
          </h1>
          <p style={styles.subtitle}>
            Welcome, <span style={styles.usernameHighlight}>{username}</span>! Choose your path to battle.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={styles.actionSection}>
          <button
            style={styles.primaryButton}
            onClick={handleCreateRoom}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-0.5vh) scale(1.02)"
              e.target.style.boxShadow = "0 2vh 4vh rgba(141, 110, 99, 0.4)"
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0) scale(1)"
              e.target.style.boxShadow = "0 1vh 3vh rgba(141, 110, 99, 0.3)"
            }}
          >
            <div style={styles.buttonContent}>
              <div style={styles.buttonIcon}>➕</div>
              <div style={styles.buttonText}>
                <div style={styles.buttonTitle}>Create New Room</div>
                <div style={styles.buttonSubtitle}>Host a game for your friends</div>
              </div>
              <div style={styles.buttonArrow}>→</div>
            </div>
          </button>

          <button
            style={styles.secondaryButton}
            onClick={() => setShowJoinInput(!showJoinInput)}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-0.5vh) scale(1.02)"
              e.target.style.boxShadow = "0 2vh 4vh rgba(109, 76, 65, 0.4)"
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0) scale(1)"
              e.target.style.boxShadow = "0 1vh 3vh rgba(109, 76, 65, 0.3)"
            }}
          >
            <div style={styles.buttonContent}>
              <div style={styles.buttonIcon}>🔗</div>
              <div style={styles.buttonText}>
                <div style={styles.buttonTitle}>Join Existing Room</div>
                <div style={styles.buttonSubtitle}>Enter a room ID to join</div>
              </div>
              <div style={styles.buttonArrow}>→</div>
            </div>
          </button>
        </div>

        {showJoinInput && (
          <div style={styles.joinInputSection}>
            <div style={styles.inputContainer}>
              <div style={styles.inputIcon}>#</div>
              <input
                type="text"
                placeholder="Enter 6-character Room ID"
                value={roomIdInput}
                onChange={(e) => {
                  setRoomIdInput(e.target.value.toUpperCase())
                  setInputError("") // Clear error on change
                }}
                style={styles.input}
                maxLength={6}
                onKeyPress={(e) => e.key === "Enter" && handleJoinRoom()}
              />
              <button
                style={styles.joinButton}
                onClick={handleJoinRoom}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px) scale(1.02)"
                  e.target.style.boxShadow = "0 8px 25px rgba(78, 52, 46, 0.4)"
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0) scale(1)"
                  e.target.style.boxShadow = "0 4px 15px rgba(78, 52, 46, 0.3)"
                }}
              >
                Join
              </button>
            </div>
            {inputError && <p style={styles.errorMessage}>{inputError}</p>}
          </div>
        )}

        <button
          style={styles.backButton}
          onClick={() => navigate("/")}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-0.5vh) scale(1.02)"
            e.target.style.boxShadow = "0 1vh 3vh rgba(109, 76, 65, 0.3)"
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0) scale(1)"
            e.target.style.boxShadow = "0 0.5vh 1.5vh rgba(109, 76, 65, 0.2)"
          }}
        >
          <div style={styles.buttonContent}>
            <div style={styles.buttonIcon}>🏠</div>
            <div style={styles.buttonText}>
              <div style={styles.buttonTitle}>Back to Home</div>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    width: "100vw",
    background: "linear-gradient(120deg, #f2e9e4 0%, #d8cfc4 50%, #f9f4ef 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2vh 2vw",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
  },
  backgroundElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    zIndex: 0,
  },
  floatingPiece: {
    position: "absolute",
    fontSize: "clamp(2rem, 4vw, 3.5rem)",
    opacity: 0.15,
    color: "#8d6e63",
    animation: "float 8s ease-in-out infinite",
  },
  container: {
    background: "rgba(252, 248, 243, 0.95)",
    backdropFilter: "blur(1vh)",
    borderRadius: "2vh",
    padding: "4vh 4vw",
    boxShadow: "0 2vh 4vh rgba(141, 110, 99, 0.2), 0 0 0 0.1vh rgba(255, 255, 255, 0.3)",
    maxWidth: "90vw",
    minWidth: 200,
    width: "50%",
    maxHeight: "90vh",
    position: "relative",
    zIndex: 1,
    transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
    border: "0.2vh solid #efebe9",
    overflowY: "auto",
  },
  header: {
    textAlign: "center",
    marginBottom: "4vh",
  },
  headerIcon: {
    fontSize: "clamp(3rem, 6vw, 5rem)",
    color: "#8d6e63",
    textShadow: "0 0.5vh 1vh rgba(141, 110, 99, 0.3)",
    animation: "glow 3s ease-in-out infinite alternate",
    marginBottom: "1vh",
  },
  title: {
    fontSize: "clamp(2.5rem, 6vw, 4rem)",
    fontWeight: "900",
    margin: "0 0 1vh 0",
    letterSpacing: "-0.02em",
    lineHeight: 1.1,
  },
  titleMain: {
    color: "#8d6e63",
    textShadow: "0 0.2vh 0.5vh rgba(141, 110, 99, 0.3)",
  },
  titleAccent: {
    color: "#4e342e",
    marginLeft: "0.5vw",
  },
  subtitle: {
    fontSize: "clamp(1rem, 2.5vw, 1.3rem)",
    color: "#5d4037",
    fontWeight: "500",
    margin: 0,
    lineHeight: 1.4,
    fontStyle: "italic",
  },
  usernameHighlight: {
    fontWeight: "700",
    color: "#4e342e",
  },
  actionSection: {
    display: "flex",
    flexDirection: "column",
    gap: "2vh",
    marginBottom: "2vh",
  },
  primaryButton: {
    background: "linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)",
    border: "none",
    borderRadius: "1.5vh",
    padding: "2.5vh 3vw",
    color: "white",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 1vh 3vh rgba(141, 110, 99, 0.3)",
    position: "relative",
    overflow: "hidden",
  },
  secondaryButton: {
    background: "linear-gradient(135deg, #6d4c41 0%, #5d4037 100%)",
    border: "none",
    borderRadius: "1.5vh",
    padding: "2.5vh 3vw",
    color: "white",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 1vh 3vh rgba(109, 76, 65, 0.3)",
    position: "relative",
    overflow: "hidden",
  },
  buttonContent: {
    display: "flex",
    alignItems: "center",
    gap: "3vw",
    position: "relative",
    zIndex: 1,
  },
  buttonIcon: {
    fontSize: "clamp(2rem, 4vw, 3rem)",
    minWidth: "8vw",
    textAlign: "center",
  },
  buttonText: {
    flex: 1,
    textAlign: "left",
  },
  buttonTitle: {
    fontSize: "clamp(1.1rem, 2.8vw, 1.4rem)",
    fontWeight: "700",
    marginBottom: "0.5vh",
    letterSpacing: "-0.01em",
  },
  buttonSubtitle: {
    fontSize: "clamp(0.85rem, 2vw, 1rem)",
    opacity: 0.9,
    fontWeight: "400",
  },
  buttonArrow: {
    fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
    fontWeight: "bold",
    transition: "transform 0.3s ease",
  },
  joinInputSection: {
    marginTop: "3vh",
    marginBottom: "2vh",
    padding: "2vh 2vw",
    background: "rgba(255, 255, 255, 0.8)",
    borderRadius: "1.5vh",
    border: "0.2vh solid #d7ccc8",
    boxShadow: "inset 0 0.2vh 0.5vh rgba(141, 110, 99, 0.1)",
  },
  inputContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "1vw",
  },
  inputIcon: {
    fontSize: "clamp(1rem, 2.5vw, 1.3rem)",
    color: "#8d6e63",
    paddingLeft: "1vw",
  },
  input: {
    flex: 1,
    padding: "1.5vh 1vw",
    fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
    border: "0.2vh solid #d7ccc8",
    borderRadius: "1vh",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    color: "#4e342e",
    outline: "none",
    transition: "all 0.3s ease",
    fontFamily: "inherit",
    boxSizing: "border-box",
    boxShadow: "inset 0 0.2vh 0.5vh rgba(141, 110, 99, 0.1)",
  },
  joinButton: {
    padding: "1.5vh 2vw",
    background: "linear-gradient(135deg, #4e342e 0%, #3e2723 100%)",
    color: "white",
    border: "none",
    borderRadius: "1vh",
    fontSize: "clamp(0.9rem, 2.2vw, 1.1rem)",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 0.5vh 1.5vh rgba(78, 52, 46, 0.3)",
    whiteSpace: "nowrap",
  },
  errorMessage: {
    color: "#d32f2f",
    fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
    marginTop: "1vh",
    textAlign: "center",
  },
  backButton: {
    background: "linear-gradient(135deg, #a1887f 0%, #8d6e63 100%)",
    border: "none",
    borderRadius: "1.5vh",
    padding: "1.5vh 2vw",
    color: "white",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 0.5vh 1.5vh rgba(141, 110, 99, 0.2)",
    position: "relative",
    overflow: "hidden",
    marginTop: "2vh",
  },
}

// Add CSS animations
const styleSheet = document.createElement("style")
styleSheet.type = "text/css"
styleSheet.innerText = `
  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    25% { transform: translateY(-2vh) rotate(5deg); }
    50% { transform: translateY(-1vh) rotate(-3deg); }
    75% { transform: translateY(-3vh) rotate(8deg); }
  }
  
  @keyframes glow {
    0% { filter: drop-shadow(0 0 0.5vh rgba(141, 110, 99, 0.5)); }
    100% { filter: drop-shadow(0 0 1.5vh rgba(141, 110, 99, 0.8)); }
  }
  
  input:focus {
    border-color: #8d6e63 !important;
    box-shadow: 0 0 0 0.3vh rgba(141, 110, 99, 0.2), inset 0 0.2vh 0.5vh rgba(141, 110, 99, 0.1) !important;
  }
  
  button:hover .buttonArrow {
    transform: translateX(1vw) !important;
  }
  
  @media (max-width: 768px) {
    .buttonContent {
      flex-direction: column !important;
      text-align: center !important;
      gap: 2vh !important;
    }
    .buttonIcon {
      min-width: 12vw !important;
    }
    .buttonText {
      text-align: center !important;
    }
    .inputContainer {
      flex-direction: column;
      gap: 1.5vh;
    }
    .inputIcon {
      padding-left: 0;
    }
    .input {
      width: 100%;
      text-align: center;
    }
    .joinButton {
      width: 100%;
    }
  }
  
  @media (max-width: 480px) {
    .container {
      padding: 3vh 3vw !important;
    }
    .headerIcon {
      font-size: clamp(2.5rem, 5vw, 4rem) !important;
    }
    .title {
      font-size: clamp(2rem, 5vw, 3rem) !important;
    }
    .subtitle {
      font-size: clamp(0.9rem, 2.2vw, 1.1rem) !important;
    }
    .primaryButton, .secondaryButton, .backButton {
      padding: 2vh 2.5vw !important;
    }
    .buttonIcon {
      font-size: clamp(1.8rem, 3.5vw, 2.5rem) !important;
    }
    .buttonTitle {
      font-size: clamp(1rem, 2.5vw, 1.2rem) !important;
    }
    .buttonSubtitle {
      font-size: clamp(0.8rem, 1.8vw, 0.9rem) !important;
    }
    .input {
      font-size: clamp(0.9rem, 2.2vw, 1.1rem) !important;
    }
    .joinButton {
      font-size: clamp(0.8rem, 2vw, 1rem) !important;
    }
  }
`
document.head.appendChild(styleSheet)

export default MultiplayerLobby
