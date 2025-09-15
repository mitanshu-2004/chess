"use client"

import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { COLORS } from "../utils/colors"

const MultiplayerLobby = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const username = searchParams.get("username")

  const [showJoinInput, setShowJoinInput] = useState(false)
  const [roomIdInput, setRoomIdInput] = useState("")
  const [inputError, setInputError] = useState("")

  useEffect(() => {
    if (!username) {
      navigate("/")
    }
  }, [navigate, username])

  if (!username) return null

  const handleCreateRoom = () => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    navigate(`/multiplayer/${roomId}?username=${encodeURIComponent(username)}`)
  }

  const handleJoinRoom = () => {
    const trimmed = roomIdInput.trim().toUpperCase()
    if (!trimmed) {
      setInputError("Room ID cannot be empty.")
      return
    }
    if (trimmed.length !== 6) {
      setInputError("Room ID must be 6 characters.")
      return
    }
    if (!/^[A-Z0-9]{6}$/.test(trimmed)) {
      setInputError("Room ID must contain only letters and numbers.")
      return
    }
    setInputError("")
    navigate(`/multiplayer/${trimmed}?username=${encodeURIComponent(username)}`)
  }

  const styles = `
        html, body {
          margin: 0;
          padding: 0;
          height: 100%; /* Use 100% for scrollable content */
          width: 100%;
          overflow-x: hidden; /* Hide horizontal scrollbar */
        }
    
        *, *::before, *::after {
          box-sizing: border-box; /* Apply globally */
        }
    
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
              min-height: 100vh; /* Use min-height for full viewport coverage */
              width: 100%;
              background: linear-gradient(120deg, ${COLORS.bgLight1} 0%, ${COLORS.bgLight2} 50%, ${COLORS.bgLight1} 100%);
              display: flex;
              flex-direction: column; /* Changed to column for vertical centering */
              align-items: center;
              justify-content: center;
              padding: 1rem;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              position: relative; /* Revert to relative */
              overflow-x: hidden; /* Keep overflow hidden for background elements */
              box-sizing: border-box;
              overflow-y: auto; /* Allow vertical scrolling for wrapper content */
            }

    .container {
      background: rgba(252, 248, 243, 0.95);
      backdrop-filter: blur(0.625rem);
      border-radius: 1.5rem; /* Increased border-radius */
      padding: 1rem;
      box-shadow: 0 0.5rem 1.5rem rgba(141, 110, 99, 0.2), /* Adjusted shadow for depth */
                  0 0 0 0.125rem rgba(255, 255, 255, 0.3), /* Inner white border */
                  0 0 0.5rem rgba(141, 110, 99, 0.5); /* Subtle glow */
      max-width: 60%;
      min-width: unset;
      width: 60%;
      max-height: 95%;
      position: relative;
      z-index: 1;
      transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      border: 0.1875rem solid ${COLORS.bgLight2}; /* Increased border-width */
      overflow-y: auto;
    }

    .header { text-align: center; margin-bottom: 2rem; }
    .headerIcon {
      font-size: clamp(2rem, 3rem, 5rem); /* Adjusted clamp values */
      color: ${COLORS.textLight};
      text-shadow: 0 0.3125rem 0.625rem rgba(141, 110, 99, 0.3);
      animation: glow 3s ease-in-out infinite alternate;
      margin-bottom: 0.625rem;
    }
    .title {
      font-size: clamp(1.8rem, 2.5rem, 4rem); /* Adjusted clamp values */
      font-weight: 900;
      margin: 0 0 0.625rem 0;
      letter-spacing: -0.02em;
      line-height: 1.1;
    }
    .titleMain {
      color: ${COLORS.textLight};
      text-shadow: 0 0.125rem 0.3125rem rgba(141, 110, 99, 0.3);
    }
    .titleAccent {
      color: ${COLORS.bgDark};
      margin-left: 0.3125rem;
    }
    .subtitle {
      font-size: clamp(0.8rem, 1rem, 1.3rem); /* Adjusted clamp values */
      color: ${COLORS.textSecondary};
      font-weight: 500;
      margin: 0;
      line-height: 1.4;
      font-style: italic;
    }
    .usernameHighlight { font-weight: 700; color: ${COLORS.bgDark}; }

    .actionSection { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1rem; }

    button { cursor: pointer; border: none; border-radius: 0.9375rem; transition: all 0.3s ease; position: relative; overflow: hidden; }

    .primaryButton { background: linear-gradient(135deg, ${COLORS.textLight} 0%, ${COLORS.textSecondary} 100%); color: ${COLORS.textWhite}; padding: 1rem; box-shadow: 0 0.625rem 1.875rem rgba(141, 110, 99, 0.3); }
    .secondaryButton { background: linear-gradient(135deg, ${COLORS.textSecondary} 0%, ${COLORS.bgDark} 100%); color: ${COLORS.textWhite}; padding: 1rem; box-shadow: 0 0.625rem 1.875rem rgba(109, 76, 65, 0.3); }

    button:hover { transform: translateY(-0.25rem) scale(1.02); }

    .buttonContent { display: flex; align-items: center; gap: 1rem; }
    .buttonIcon { font-size: clamp(2rem, 3rem, 3rem); min-width: 2rem; text-align: center; }
    .buttonText { flex: 1; text-align: left; }
    .buttonTitle { font-size: clamp(1.1rem, 1.75rem, 1.4rem); font-weight: 700; margin-bottom: 0.3125rem; }
    .buttonSubtitle { font-size: clamp(0.85rem, 1.25rem, 1rem); opacity: 0.9; font-weight: 400; }

    .buttonArrow { font-size: clamp(1.2rem, 1.875rem, 1.8rem); font-weight: bold; transition: transform 0.3s ease; }
    button:hover .buttonArrow { transform: translateX(0.625rem); }

    .joinInputSection { margin-top: 1.5rem; margin-bottom: 1rem; padding: 1rem; background: rgba(255,255,255,0.8); border-radius: 0.9375rem; border: 0.125rem solid ${COLORS.bgMedium}; box-shadow: inset 0 0.125rem 0.3125rem rgba(141, 110, 99, 0.1); }
    .inputContainer { display: flex; align-items: center; gap: 0.5rem; }
    .inputIcon { font-size: clamp(1rem, 1.5rem, 1.3rem); color: ${COLORS.textLight}; }
    .input { flex: 1; padding: 0.5rem; font-size: clamp(1rem, 1.5rem, 1.2rem); border: 0.125rem solid ${COLORS.bgMedium}; border-radius: 0.625rem; background-color: rgba(255,255,255,0.9); color: ${COLORS.bgDark}; outline: none; }
    .input:focus { border-color: ${COLORS.textLight}; box-shadow: 0 0 0 0.1875rem rgba(141,110,99,0.2); }

    .joinButton { padding: 0.5rem 0.8rem; background: linear-gradient(135deg, ${COLORS.bgDark} 0%, ${COLORS.textSecondary} 100%); color: ${COLORS.textWhite}; border-radius: 0.625rem; font-weight: 600; }
    .errorMessage { color: ${COLORS.dangerDark}; font-size: clamp(0.7rem,1rem,0.9rem); margin-top: 0.625rem; text-align: center; }

    .backButton { background: linear-gradient(135deg, ${COLORS.textMuted} 0%, ${COLORS.textLight} 100%); color: ${COLORS.textWhite}; padding: 0.8rem 1rem; box-shadow: 0 0.3125rem 0.9375rem rgba(141,110,99,0.2); margin-top: 1rem; }

    @media (max-width: 768px) {
      .container { max-width: 90%; width: 90%; }
      .buttonContent { flex-direction: column; text-align: center; gap: 1rem; }
      .inputContainer { flex-direction: column; gap: 0.5rem; }
      .input { text-align: center; width: 100%; }
      .joinButton { width: 100%; }
    }
  `

  return (
    <>
      <style>{styles}</style>
      <div className="wrapper">
        <div
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
