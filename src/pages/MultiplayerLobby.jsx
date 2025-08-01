"use client"

import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { COLORS } from "../utils/colors"

const MultiplayerLobby = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const username = searchParams.get("username")

  const [isAnimating, setIsAnimating] = useState(false)
  const [showJoinInput, setShowJoinInput] = useState(false)
  const [roomIdInput, setRoomIdInput] = useState("")
  const [inputError, setInputError] = useState("")

  useEffect(() => {
    if (!username) {
      navigate("/")
    }
  }, [navigate, username])

  useEffect(() => {
    setTimeout(() => setIsAnimating(true), 100)
  }, [])

  if (!username) {
    return null
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
    
    // Validate room ID format (alphanumeric)
    const roomIdRegex = /^[A-Z0-9]{6}$/
    if (!roomIdRegex.test(roomIdInput.trim().toUpperCase())) {
      setInputError("Room ID must contain only letters and numbers.")
      return
    }
    
    setInputError("")
    navigate(`/multiplayer/${roomIdInput.trim().toUpperCase()}?username=${encodeURIComponent(username)}`)
  }

  const styles = `
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

    .wrapper {
      min-height: 100vh;
      width: 100vw;
      background: linear-gradient(120deg, ${COLORS.bgLight1} 0%, ${COLORS.bgLight2} 50%, ${COLORS.bgLight1} 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2vh 2vw;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
    }
    .backgroundElements {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 0;
    }
    .floatingPiece {
      position: absolute;
      font-size: clamp(2rem, 4vw, 3.5rem);
      opacity: 0.15;
      color: ${COLORS.textLight};
      animation: float 8s ease-in-out infinite;
    }
    .container {
      background: rgba(252, 248, 243, 0.95);
      backdrop-filter: blur(1vh);
      border-radius: 2vh;
      padding: 4vh 4vw;
      box-shadow: 0 2vh 4vh rgba(141, 110, 99, 0.2), 0 0 0 0.1vh rgba(255, 255, 255, 0.3);
      max-width: 90vw;
      min-width: 20rem;
      width: 50%;
      max-height: 90vh;
      position: relative;
      z-index: 1;
      transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      border: 0.2vh solid ${COLORS.bgLight2};
      overflow-y: auto;
    }
    .header {
      text-align: center;
      margin-bottom: 4vh;
    }
    .headerIcon {
      font-size: clamp(3rem, 6vw, 5rem);
      color: ${COLORS.textLight};
      text-shadow: 0 0.5vh 1vh rgba(141, 110, 99, 0.3);
      animation: glow 3s ease-in-out infinite alternate;
      margin-bottom: 1vh;
    }
    .title {
      font-size: clamp(2.5rem, 6vw, 4rem);
      font-weight: 900;
      margin: 0 0 1vh 0;
      letter-spacing: -0.02em;
      line-height: 1.1;
    }
    .titleMain {
      color: ${COLORS.textLight};
      text-shadow: 0 0.2vh 0.5vh rgba(141, 110, 99, 0.3);
    }
    .titleAccent {
      color: ${COLORS.bgDark};
      margin-left: 0.5vw;
    }
    .subtitle {
      font-size: clamp(1rem, 2.5vw, 1.3rem);
      color: ${COLORS.textSecondary};
      font-weight: 500;
      margin: 0;
      line-height: 1.4;
      font-style: italic;
    }
    .usernameHighlight {
      font-weight: 700;
      color: ${COLORS.bgDark};
    }
    .actionSection {
      display: flex;
      flex-direction: column;
      gap: 2vh;
      margin-bottom: 2vh;
    }
    .primaryButton {
      background: linear-gradient(135deg, ${COLORS.textLight} 0%, ${COLORS.textSecondary} 100%);
      border: none;
      border-radius: 1.5vh;
      padding: 2.5vh 3vw;
      color: ${COLORS.textWhite};
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1vh 3vh rgba(141, 110, 99, 0.3);
      position: relative;
      overflow: hidden;
    }
    .secondaryButton {
      background: linear-gradient(135deg, ${COLORS.textSecondary} 0%, ${COLORS.bgDark} 100%);
      border: none;
      border-radius: 1.5vh;
      padding: 2.5vh 3vw;
      color: ${COLORS.textWhite};
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1vh 3vh rgba(109, 76, 65, 0.3);
      position: relative;
      overflow: hidden;
    }
    .primaryButton:hover, .secondaryButton:hover {
      transform: translateY(-0.5vh) scale(1.02);
      box-shadow: 0 2vh 4vh rgba(141, 110, 99, 0.4);
    }
    .buttonContent {
      display: flex;
      align-items: center;
      gap: 3vw;
      position: relative;
      z-index: 1;
    }
    .buttonIcon {
      font-size: clamp(2rem, 4vw, 3rem);
      min-width: 8vw;
      text-align: center;
    }
    .buttonText {
      flex: 1;
      text-align: left;
    }
    .buttonTitle {
      font-size: clamp(1.1rem, 2.8vw, 1.4rem);
      font-weight: 700;
      margin-bottom: 0.5vh;
      letter-spacing: -0.01em;
    }
    .buttonSubtitle {
      font-size: clamp(0.85rem, 2vw, 1rem);
      opacity: 0.9;
      font-weight: 400;
    }
    .buttonArrow {
      font-size: clamp(1.2rem, 3vw, 1.8rem);
      font-weight: bold;
      transition: transform 0.3s ease;
    }
    button:hover .buttonArrow {
      transform: translateX(1vw) !important;
    }
    .joinInputSection {
      margin-top: 3vh;
      margin-bottom: 2vh;
      padding: 2vh 2vw;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 1.5vh;
      border: 0.2vh solid ${COLORS.bgMedium};
      box-shadow: inset 0 0.2vh 0.5vh rgba(141, 110, 99, 0.1);
    }
    .inputContainer {
      position: relative;
      display: flex;
      align-items: center;
      gap: 1vw;
    }
    .inputIcon {
      font-size: clamp(1rem, 2.5vw, 1.3rem);
      color: ${COLORS.textLight};
      padding-left: 1vw;
    }
    .input {
      flex: 1;
      padding: 1.5vh 1vw;
      font-size: clamp(1rem, 2.5vw, 1.2rem);
      border: 0.2vh solid ${COLORS.bgMedium};
      border-radius: 1vh;
      background-color: rgba(255, 255, 255, 0.9);
      color: ${COLORS.bgDark};
      outline: none;
      transition: all 0.3s ease;
      font-family: inherit;
      box-sizing: border-box;
      box-shadow: inset 0 0.2vh 0.5vh rgba(141, 110, 99, 0.1);
    }
    .input:focus {
      border-color: ${COLORS.textLight} !important;
      box-shadow: 0 0 0 0.3vh rgba(141, 110, 99, 0.2), inset 0 0.2vh 0.5vh rgba(141, 110, 99, 0.1) !important;
    }
    .joinButton {
      padding: 1.5vh 2vw;
      background: linear-gradient(135deg, ${COLORS.bgDark} 0%, ${COLORS.textSecondary} 100%);
      color: ${COLORS.textWhite};
      border: none;
      border-radius: 1vh;
      font-size: clamp(0.9rem, 2.2vw, 1.1rem);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0.5vh 1.5vh rgba(78, 52, 46, 0.3);
      white-space: nowrap;
    }
    .joinButton:hover {
      transform: translateY(-0.2rem) scale(1.02);
      box-shadow: 0 0.8rem 2.5rem rgba(78, 52, 46, 0.4);
    }
    .errorMessage {
      color: ${COLORS.dangerDark};
      font-size: clamp(0.8rem, 2vw, 0.9rem);
      margin-top: 1vh;
      text-align: center;
    }
    .backButton {
      background: linear-gradient(135deg, ${COLORS.textMuted} 0%, ${COLORS.textLight} 100%);
      border: none;
      border-radius: 1.5vh;
      padding: 1.5vh 2vw;
      color: ${COLORS.textWhite};
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0.5vh 1.5vh rgba(141, 110, 99, 0.2);
      position: relative;
      overflow: hidden;
      margin-top: 2vh;
    }
    .backButton:hover {
      transform: translateY(-0.5vh) scale(1.02);
      box-shadow: 0 1vh 3vh rgba(109, 76, 65, 0.3);
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

  return (
    <>
      <style>{styles}</style>
      <div className="wrapper">
        <div className="backgroundElements">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              style={{
                top: `${10 + i * 12}vh`,
                left: `${5 + (i % 2) * 90}vw`,
                animationDelay: `${i * 0.7}s`,
              }}
              className="floatingPiece"
            >
              {["♔", "♛", "♜", "♝", "♞", "♟", "♚", "♕"][i]}
            </div>
          ))}
        </div>

        <div
          style={{
            transform: isAnimating ? "translateY(0) scale(1)" : "translateY(5vh) scale(0.95)",
            opacity: isAnimating ? 1 : 0,
          }}
          className="container"
        >
          <div className="header">
            <div className="headerIcon">⚔️</div>
            <h1 className="title">
              <span className="titleMain">Multiplayer</span>
              <span className="titleAccent">Lobby</span>
            </h1>
            <p className="subtitle">
              Welcome, <span className="usernameHighlight">{username}</span>! Choose your path to battle.
            </p>
          </div>

          <div className="actionSection">
            <button className="primaryButton" onClick={handleCreateRoom}>
              <div className="buttonContent">
                <div className="buttonIcon">➕</div>
                <div className="buttonText">
                  <div className="buttonTitle">Create New Room</div>
                  <div className="buttonSubtitle">Host a game for your friends</div>
                </div>
                <div className="buttonArrow">→</div>
              </div>
            </button>

            <button className="secondaryButton" onClick={() => setShowJoinInput(!showJoinInput)}>
              <div className="buttonContent">
                <div className="buttonIcon">🔗</div>
                <div className="buttonText">
                  <div className="buttonTitle">Join Existing Room</div>
                  <div className="buttonSubtitle">Enter a room ID to join</div>
                </div>
                <div className="buttonArrow">→</div>
              </div>
            </button>
          </div>

          {showJoinInput && (
            <div className="joinInputSection">
              <div className="inputContainer">
                <div className="inputIcon">#</div>
                <input
                  type="text"
                  placeholder="Enter 6-character Room ID"
                  value={roomIdInput}
                  onChange={(e) => {
                    setRoomIdInput(e.target.value.toUpperCase())
                    setInputError("")
                  }}
                  className="input"
                  maxLength={6}
                  onKeyPress={(e) => e.key === "Enter" && handleJoinRoom()}
                />
                <button className="joinButton" onClick={handleJoinRoom}>
                  Join
                </button>
              </div>
              {inputError && <p className="errorMessage">{inputError}</p>}
            </div>
          )}

          <button className="backButton" onClick={() => navigate("/")}>
            <div className="buttonContent">
              <div className="buttonIcon">🏠</div>
              <div className="buttonText">
                <div className="buttonTitle">Back to Home</div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </>
  )
}

export default MultiplayerLobby
