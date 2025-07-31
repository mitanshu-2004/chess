"use client"

// Home.jsx - Brown Chess Theme with Responsive Design
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const Homepage = () => {
  const [username, setUsername] = useState("")
  const [isAnimating, setIsAnimating] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setTimeout(() => setIsAnimating(true), 100)
  }, [])

  const handlePlayBot = () => {
    if (!username.trim()) {
      alert("Please enter your name")
      return
    }
    navigate(`/bot?username=${encodeURIComponent(username)}`)
  }

  const handleMultiplayer = () => {
    if (!username.trim()) {
      alert("Please enter your name")
      return
    }
    // Navigate to the new multiplayer lobby instead of directly creating a room
    navigate(`/multiplayer-lobby?username=${encodeURIComponent(username)}`)
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
        {/* Hero Section */}
        <div style={styles.hero}>
          <div style={styles.logoContainer}>
            <div style={styles.chessIcon}>♚</div>
            <h1 style={styles.title}>
              <span style={styles.titleMain}>Chess</span>
              <span style={styles.titleAccent}>Master</span>
            </h1>
          </div>
          <p style={styles.subtitle}>Enter the battlefield of minds</p>
        </div>

        {/* Input Section */}
        <div style={styles.inputSection}>
          <div style={styles.inputContainer}>
            <div style={styles.inputIcon}>👤</div>
            <input
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              onKeyPress={(e) => e.key === "Enter" && handlePlayBot()}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.actionSection}>
          <button
            style={styles.primaryButton}
            onClick={handlePlayBot}
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
              <div style={styles.buttonIcon}>🤖</div>
              <div style={styles.buttonText}>
                <div style={styles.buttonTitle}>Challenge AI</div>
                <div style={styles.buttonSubtitle}>Test your skills against the engine</div>
              </div>
              <div style={styles.buttonArrow}>→</div>
            </div>
          </button>

          <button
            style={styles.secondaryButton}
            onClick={handleMultiplayer}
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
              <div style={styles.buttonIcon}>👥</div>
              <div style={styles.buttonText}>
                <div style={styles.buttonTitle}>Multiplayer</div>
                <div style={styles.buttonSubtitle}>Create room & battle friends</div>
              </div>
              <div style={styles.buttonArrow}>→</div>
            </div>
          </button>
        </div>
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
  },
  hero: {
    textAlign: "center",
    marginBottom: "4vh",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "2vw",
    marginBottom: "2vh",
    flexWrap: "wrap",
  },
  chessIcon: {
    fontSize: "clamp(3rem, 6vw, 5rem)",
    color: "#8d6e63",
    textShadow: "0 0.5vh 1vh rgba(141, 110, 99, 0.3)",
    animation: "glow 3s ease-in-out infinite alternate",
  },
  title: {
    fontSize: "clamp(2.5rem, 6vw, 4rem)",
    fontWeight: "900",
    margin: 0,
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
  inputSection: {
    marginBottom: "4vh",
  },
  inputContainer: {
    position: "relative",
    maxWidth: "80vw",
    margin: "0 auto",
  },
  inputIcon: {
    position: "absolute",
    left: "3vw",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "clamp(1rem, 2.5vw, 1.3rem)",
    color: "#8d6e63",
    zIndex: 2,
  },
  input: {
    width: "100%",
    padding: "2vh 2vw 2vh 6vw",
    fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
    border: "0.2vh solid #d7ccc8",
    borderRadius: "1.5vh",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    color: "#4e342e",
    outline: "none",
    transition: "all 0.3s ease",
    fontFamily: "inherit",
    boxSizing: "border-box",
    boxShadow: "inset 0 0.2vh 0.5vh rgba(141, 110, 99, 0.1)",
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
  .logoContainer {
    flex-direction: column !important;
    gap: 2vh !important;
  }
  .buttonContent {
    gap: 4vw !important;
  }
  .buttonIcon {
    min-width: 12vw !important;
  }
}

@media (max-width: 480px) {
  .buttonContent {
    flex-direction: column !important;
    text-align: center !important;
    gap: 2vh !important;
  }
  .buttonText {
    text-align: center !important;
  }
}
`
document.head.appendChild(styleSheet)

export default Homepage
