"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { COLORS } from "../utils/colors"

const Homepage = () => {
  const [username, setUsername] = useState("")
  const [isAnimating, setIsAnimating] = useState(false)
  const navigate = useNavigate()

  // Load saved username on component mount
  useEffect(() => {
    const savedUsername = localStorage.getItem("chessUsername")
    if (savedUsername) {
      setUsername(savedUsername)
    }
    setTimeout(() => setIsAnimating(true), 100)
  }, [])

  // Save username whenever it changes
  useEffect(() => {
    if (username.trim()) {
      localStorage.setItem("chessUsername", username.trim())
    }
  }, [username])

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
    navigate(`/multiplayer-lobby?username=${encodeURIComponent(username)}`)
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
      min-width: 200px;
      width: 50%;
      max-height: 90vh;
      position: relative;
      z-index: 1;
      transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      border: 0.2vh solid ${COLORS.bgLight2};
    }
    .hero {
      text-align: center;
      margin-bottom: 4vh;
    }
    .logoContainer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2vw;
      margin-bottom: 2vh;
      flex-wrap: wrap;
    }
    .chessIcon {
      font-size: clamp(3rem, 6vw, 5rem);
      color: ${COLORS.textLight};
      text-shadow: 0 0.5vh 1vh rgba(141, 110, 99, 0.3);
      animation: glow 3s ease-in-out infinite alternate;
    }
    .title {
      font-size: clamp(2.5rem, 6vw, 4rem);
      font-weight: 900;
      margin: 0;
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
    .inputSection {
      margin-bottom: 4vh;
    }
    .inputContainer {
      position: relative;
      max-width: 80vw;
      margin: 0 auto;
    }
    .inputIcon {
      position: absolute;
      left: 3vw;
      top: 50%;
      transform: translateY(-50%);
      font-size: clamp(1rem, 2.5vw, 1.3rem);
      color: ${COLORS.textLight};
      z-index: 2;
    }
    .input {
      width: 100%;
      padding: 2vh 2vw 2vh 6vw;
      font-size: clamp(1rem, 2.5vw, 1.2rem);
      border: 0.2vh solid ${COLORS.bgMedium};
      border-radius: 1.5vh;
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

  return (
    <>
      <style>{`${styles}`}</style>
      <div className="wrapper">
        <div className="backgroundElements">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              style={{
                top: `${10 + i * 12}%`,
                left: `${5 + (i % 2) * 90}%`,
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
          <div className="hero">
            <div className="logoContainer">
              <div className="chessIcon">♚</div>
              <h1 className="title">
                <span className="titleMain">Chess</span>
                <span className="titleAccent">Master</span>
              </h1>
            </div>
            <p className="subtitle">Enter the battlefield of minds</p>
          </div>

          <div className="inputSection">
            <div className="inputContainer">
              <div className="inputIcon">👤</div>
              <input
                type="text"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                onKeyPress={(e) => e.key === "Enter" && handlePlayBot()}
              />
            </div>
          </div>

          <div className="actionSection">
            <button className="primaryButton" onClick={handlePlayBot}>
              <div className="buttonContent">
                <div className="buttonIcon">🤖</div>
                <div className="buttonText">
                  <div className="buttonTitle">Challenge AI</div>
                  <div className="buttonSubtitle">Test your skills against the engine</div>
                </div>
                <div className="buttonArrow">→</div>
              </div>
            </button>

            <button className="secondaryButton" onClick={handleMultiplayer}>
              <div className="buttonContent">
                <div className="buttonIcon">👥</div>
                <div className="buttonText">
                  <div className="buttonTitle">Multiplayer</div>
                  <div className="buttonSubtitle">Create room & battle friends</div>
                </div>
                <div className="buttonArrow">→</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Homepage
