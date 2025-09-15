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
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow-x: hidden; /* Hide horizontal scrollbar */
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
      min-height: 100vh;
      width: 100vw;
      background: linear-gradient(120deg, ${COLORS.bgLight1} 0%, ${COLORS.bgLight2} 50%, ${COLORS.bgLight1} 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem 1rem; /* Converted from 1vh 1vw */
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
      backdrop-filter: blur(1rem); /* Converted from 1vh */
      border-radius: 1.25rem; /* Converted from 2vh */
      padding: 1.5rem 1.5rem; /* Converted from 2vh 2vw */
      box-shadow: 0 1.25rem 2.5rem rgba(141, 110, 99, 0.2), 0 0 0 0.0625rem rgba(255, 255, 255, 0.3); /* Converted from vh */
      max-width: 95%; /* Changed from 95vw */
      min-width: unset;
      width: 60%; /* Changed from 80% for PC screens */
      max-height: 95%; /* Changed from 95vh */
      position: relative;
      z-index: 1;
      transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      border: 0.125rem solid ${COLORS.bgLight2}; /* Converted from 0.2vh */
      overflow-y: auto;
    }
    .hero {
      text-align: center;
      margin-bottom: 2.5rem; /* Converted from 4vh */
    }
    .logoContainer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.25rem; /* Converted from 2vw */
      margin-bottom: 1.25rem; /* Converted from 2vh */
      flex-wrap: wrap;
    }
    .chessIcon {
      font-size: clamp(3rem, 4.5rem, 5rem); /* Adjusted clamp values */
      color: ${COLORS.textLight};
      text-shadow: 0 0.3125rem 0.625rem rgba(141, 110, 99, 0.3); /* Converted from vh */
      animation: glow 3s ease-in-out infinite alternate;
    }
    .title {
      font-size: clamp(2.5rem, 4rem, 4rem); /* Adjusted clamp values */
      font-weight: 900;
      margin: 0;
      letter-spacing: -0.02em;
      line-height: 1.1;
    }
    .titleMain {
      color: ${COLORS.textLight};
      text-shadow: 0 0.125rem 0.3125rem rgba(141, 110, 99, 0.3); /* Converted from vh */
    }
    .titleAccent {
      color: ${COLORS.bgDark};
      margin-left: 0.3125rem; /* Converted from 0.5vw */
    }
    .subtitle {
      font-size: clamp(1rem, 1.5rem, 1.3rem); /* Adjusted clamp values */
      color: ${COLORS.textSecondary};
      font-weight: 500;
      margin: 0;
      line-height: 1.4;
      font-style: italic;
    }
    .inputSection {
      margin-bottom: 2.5rem; /* Converted from 4vh */
    }
    .inputContainer {
      position: relative;
      max-width: 90%; /* Converted from 90vw */
      margin: 0 auto;
    }
    .inputIcon {
      position: absolute;
      left: 1.875rem; /* Converted from 3vw */
      top: 50%;
      transform: translateY(-50%);
      font-size: clamp(1rem, 1.5rem, 1.3rem); /* Adjusted clamp values */
      color: ${COLORS.textLight};
      z-index: 2;
    }
    .input {
      width: 100%;
      padding: 1.25rem 1.25rem 1.25rem 3.75rem; /* Converted from 2vh 2vw 2vh 6vw */
      font-size: clamp(1rem, 1.5rem, 1.2rem); /* Adjusted clamp values */
      border: 0.125rem solid ${COLORS.bgMedium}; /* Converted from 0.2vh */
      border-radius: 0.9375rem; /* Converted from 1.5vh */
      background-color: rgba(255, 255, 255, 0.9);
      color: ${COLORS.bgDark};
      outline: none;
      transition: all 0.3s ease;
      font-family: inherit;
      box-sizing: border-box;
      box-shadow: inset 0 0.125rem 0.3125rem rgba(141, 110, 99, 0.1); /* Converted from vh */
    }
    .input:focus {
      border-color: ${COLORS.textLight} !important;
      box-shadow: 0 0 0 0.1875rem rgba(141, 110, 99, 0.2), inset 0 0.125rem 0.3125rem rgba(141, 110, 99, 0.1) !important; /* Converted from vh */
    }
    .actionSection {
      display: flex;
      flex-direction: column;
      gap: 1.25rem; /* Converted from 2vh */
      margin-bottom: 1.25rem; /* Converted from 2vh */
    }
    .primaryButton {
      background: linear-gradient(135deg, ${COLORS.textLight} 0%, ${COLORS.textSecondary} 100%);
      border: none;
      border-radius: 0.9375rem; /* Converted from 1.5vh */
      padding: 1.5625rem 1.875rem; /* Converted from 2.5vh 3vw */
      color: ${COLORS.textWhite};
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0.625rem 1.875rem rgba(141, 110, 99, 0.3); /* Converted from vh */
      position: relative;
      overflow: hidden;
    }
    .secondaryButton {
      background: linear-gradient(135deg, ${COLORS.textSecondary} 0%, ${COLORS.bgDark} 100%);
      border: none;
      border-radius: 0.9375rem; /* Converted from 1.5vh */
      padding: 1.5625rem 1.875rem; /* Converted from 2.5vh 3vw */
      color: ${COLORS.textWhite};
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0.625rem 1.875rem rgba(109, 76, 65, 0.3); /* Converted from vh */
      position: relative;
      overflow: hidden;
    }
    .primaryButton:hover, .secondaryButton:hover {
      transform: translateY(-0.3125rem) scale(1.02); /* Converted from 0.5vh */
      box-shadow: 0 1.25rem 2.5rem rgba(141, 110, 99, 0.4); /* Converted from vh */
    }
    .buttonContent {
      display: flex;
      align-items: center;
      gap: 1.875rem; /* Converted from 3vw */
      position: relative;
      z-index: 1;
    }
    .buttonIcon {
      font-size: clamp(2rem, 3rem, 3rem); /* Adjusted clamp values */
      min-width: 5rem; /* Converted from 8vw */
      text-align: center;
    }
    .buttonText {
      flex: 1;
      text-align: left;
    }
    .buttonTitle {
      font-size: clamp(1.1rem, 1.75rem, 1.4rem); /* Adjusted clamp values */
      font-weight: 700;
      margin-bottom: 0.3125rem; /* Converted from 0.5vh */
      letter-spacing: -0.01em;
    }
    .buttonSubtitle {
      font-size: clamp(0.85rem, 1.25rem, 1rem); /* Adjusted clamp values */
      opacity: 0.9;
      font-weight: 400;
    }
    .buttonArrow {
      font-size: clamp(1.2rem, 1.875rem, 1.8rem); /* Adjusted clamp values */
      font-weight: bold;
      transition: transform 0.3s ease;
    }
    button:hover .buttonArrow {
      transform: translateX(0.625rem) !important; /* Converted from 1vw */
    }

    @media (max-width: 768px) {
      .container {
        width: 85% !important; /* Set width to 85% for mobile screens */
      }
      .logoContainer {
        flex-direction: column !important;
        gap: 1.25rem !important; /* Converted from 2vh */
      }
      .buttonContent {
        gap: 2.5rem !important; /* Converted from 4vw */
      }
      .buttonIcon {
        min-width: 7.5rem !important; /* Converted from 12vw */
      }
    }
    @media (max-width: 480px) {
      .buttonContent {
        flex-direction: column !important;
        text-align: center !important;
        gap: 0.9375rem !important; /* Converted from 1.5vh */
      }
      .buttonText {
        text-align: center !important;
      }
      .container {
        padding: 0.9375rem 0.9375rem !important; /* Converted from 1.5vh 1.5vw */
      }
      .chessIcon {
        font-size: clamp(1.8rem, 2.5rem, 3rem) !important; /* Adjusted clamp values */
      }
      .title {
        font-size: clamp(1.5rem, 2.5rem, 2.5rem) !important; /* Adjusted clamp values */
      }
      .subtitle {
        font-size: clamp(0.7rem, 0.9rem, 0.9rem) !important; /* Adjusted clamp values */
      }
      .input {
        padding: 0.75rem 0.75rem 0.75rem 2.5rem !important; /* Converted from 1.2vh 1.2vw 1.2vh 4vw */
      }
      .inputIcon {
        left: 0.9375rem !important; /* Converted from 1.5vw */
      }
      .hero {
        margin-bottom: 1.25rem !important; /* Converted from 2vh */
      }
      .inputSection {
        margin-bottom: 1.25rem !important; /* Converted from 2vh */
      }
      .actionSection {
        gap: 0.9375rem !important; /* Converted from 1.5vh */
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
                left: `${5 + (i % 2) * 85}%`,
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
