"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams, useNavigate } from "react-router-dom"
import useRealtimeChess from "../hooks/useRealtimeChess"
import ChessSquare from "../components/ChessSquare"
import MoveHistory from "../components/MoveHistory"
import PlayerCard from "../components/PlayerCard"
import GameOverModal from "../components/GameOverModal"
import { COLORS } from "../utils/colors"

const NewMultiplayerGame = () => {
  const { roomId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const playerColor = searchParams.get("color")
  const selectedTime = Number.parseInt(searchParams.get("time"), 10) || 5
  const username = searchParams.get("username") || "You"

  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false)
  const [error, setError] = useState(null)
  const [isForfeiting, setIsForfeiting] = useState(false)

  const {
    gameState,
    selectedSquare,
    possibleMoves,
    captureSquares,
    lastMove,
    roomInfo,
    isGameStarted,
    isMyTurn,
    timeLeft,
    opponentConnected,
    handleSquareClick,
    forfeitGame,
    resetGame,
    getGameStatusMessage,
  } = useRealtimeChess(roomId, playerColor, username, selectedTime)

  // Validate required parameters
  useEffect(() => {
    if (!roomId || !playerColor || !username) {
      setError("Missing required game parameters. Please return to the lobby.")
      return
    }

    if (!["w", "b"].includes(playerColor)) {
      setError("Invalid player color. Please return to the lobby.")
      return
    }

    if (selectedTime < 1 || selectedTime > 60) {
      setError("Invalid time control. Please return to the lobby.")
      return
    }
  }, [roomId, playerColor, username, selectedTime])

  // Handle errors
  if (error) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(120deg, #f5f5dc 0%, #e6d7c3 50%, #f5f5dc 100%)",
          fontFamily: "'Segoe UI', sans-serif",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
        <div style={{ fontSize: "1.5rem", marginBottom: "1rem", textAlign: "center" }}>Game Error</div>
        <div style={{ fontSize: "1rem", marginBottom: "2rem", textAlign: "center", color: "#666" }}>{error}</div>
        <button
          onClick={() => navigate("/multiplayer-lobby?username=" + encodeURIComponent(username))}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            backgroundColor: "#8d6e63",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }}
        >
          Return to Lobby
        </button>
      </div>
    )
  }

  const customStyles = `
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      25% { transform: translateY(-2vh) rotate(5deg); }
      50% { transform: translateY(-1vh) rotate(-3deg); }
      75% { transform: translateY(-3vh) rotate(8deg); }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.8; }
    }

    @keyframes dialogSlideIn {
      0% { opacity: 0; transform: translateY(-5rem) scale(0.9); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes boardGlow {
      0%, 100% { 
        box-shadow: 0 1vh 3vh rgba(141, 110, 99, 0.3), 
                    0 0 0 0.2vh rgba(255, 255, 255, 0.2),
                    0 0 20px rgba(76, 175, 80, 0.1);
      }
      50% { 
        box-shadow: 0 1.2vh 3.5vh rgba(141, 110, 99, 0.4), 
                    0 0 0 0.2vh rgba(255, 255, 255, 0.3),
                    0 0 30px rgba(76, 175, 80, 0.2);
      }
    }

    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      font-family: 'Segoe UI', sans-serif;
      cursor: default;
    }

    .main-layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      width: 100%;
      background: linear-gradient(120deg, ${COLORS.bgLight1} 0%, ${COLORS.bgLight2} 50%, ${COLORS.bgLight1} 100%);
      color: ${COLORS.textPrimary};
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 1rem;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
    }

    .background-elements {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 0;
    }

    .floating-piece {
      position: absolute;
      font-size: clamp(1.5rem, 3vw, 2.5rem);
      opacity: 0.08;
      color: #8d6e63;
      animation: float 8s ease-in-out infinite;
    }

    .game-content-area {
      display: flex;
      flex-grow: 1;
      justify-content: center;
      align-items: flex-start;
      gap: 2rem;
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }

    .board-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      flex: 1;
      max-width: 700px;
    }

    .board-container {
      width: min(90vw, 90vh, 600px);
      aspect-ratio: 1 / 1;
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      border-radius: 12px;
      overflow: hidden;
      border: 0.3vh solid rgba(141, 110, 99, 0.3);
      flex-shrink: 0;
      animation: boardGlow 3s ease-in-out infinite;
      transition: all 0.3s ease;
      cursor: crosshair;
    }

    .board-container:hover {
      transform: translateY(-2px);
      animation-duration: 1.5s;
    }

    .right-panel-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      flex-shrink: 0;
      width: 300px;
    }

    .errorContainer {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, ${COLORS.danger} 0%, ${COLORS.dangerDark} 100%);
      color: ${COLORS.textWhite};
      gap: 2vh;
      padding: 2vh;
      text-align: center;
    }
    .errorIcon {
      font-size: clamp(3rem, 8vw, 6rem);
      margin-bottom: 1vh;
    }
    .errorTitle {
      font-size: clamp(1.5rem, 4vw, 2.5rem);
      font-weight: 700;
      margin-bottom: 1vh;
    }
    .errorMessage {
      font-size: clamp(1rem, 2.5vw, 1.3rem);
      opacity: 0.9;
      margin-bottom: 3vh;
      max-width: 60rem;
      line-height: 1.5;
    }
    .errorButton {
      padding: 1.5vh 3vw;
      font-size: clamp(1rem, 2.5vw, 1.2rem);
      font-weight: 600;
      border-radius: 1.5vh;
      border: none;
      cursor: pointer;
      background-color: ${COLORS.bgDark};
      color: ${COLORS.textWhite};
      box-shadow: 0 1vh 2vh rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;
    }
    .errorButton:hover {
      transform: translateY(-0.2rem) scale(1.02);
      box-shadow: 0 1.5vh 3vh rgba(0, 0, 0, 0.4);
    }
    .waitingContainer {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, ${COLORS.textLight} 0%, ${COLORS.textSecondary} 100%);
      position: relative;
      overflow: hidden;
      padding: 2vh;
    }
    .backgroundPattern {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 0;
    }
    .waitingCard {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(2rem);
      border-radius: 3vh;
      padding: 4vh 3vw;
      box-shadow: 0 3vh 6vh rgba(0, 0, 0, 0.3);
      max-width: 90vw;
      width: 50rem;
      text-align: center;
      border: 0.1rem solid rgba(255, 255, 255, 0.3);
      position: relative;
      z-index: 1;
    }
    .waitingAnimation {
      display: flex;
      justify-content: center;
      margin-bottom: 3vh;
    }
    .spinnerRing {
      width: 8rem;
      height: 8rem;
      border: 0.4rem solid rgba(141, 110, 99, 0.3);
      border-top: 0.4rem solid ${COLORS.textLight};
      border-radius: 50%;
      animation: spin 1s linear infinite;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .spinnerCore {
      width: 4rem;
      height: 4rem;
      border: 0.2rem solid rgba(109, 76, 65, 0.5);
      border-bottom: 0.2rem solid ${COLORS.textSecondary};
      border-radius: 50%;
      animation: spin 2s linear infinite reverse;
    }
    .waitingTitle {
      font-size: clamp(1.5rem, 4vw, 2rem);
      font-weight: 700;
      color: ${COLORS.textPrimary};
      margin-bottom: 2vh;
      margin: 0;
    }
    .waitingDetails {
      display: flex;
      flex-direction: column;
      gap: 1vh;
      margin-bottom: 3vh;
    }
    .waitingInfo {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1vh 2vw;
      background: rgba(141, 110, 99, 0.1);
      border-radius: 1vh;
      border: 0.1rem solid rgba(141, 110, 99, 0.2);
    }
    .waitingLabel {
      font-size: clamp(0.9rem, 2.2vw, 1.1rem);
      color: ${COLORS.textSecondary};
      font-weight: 600;
    }
    .waitingValue {
      font-size: clamp(0.9rem, 2.2vw, 1.1rem);
      color: ${COLORS.textPrimary};
      font-weight: 700;
      font-family: monospace;
    }
    .waitingText {
      font-size: clamp(1rem, 2.5vw, 1.2rem);
      color: ${COLORS.textSecondary};
      margin-bottom: 3vh;
      line-height: 1.4;
    }
    .waitingLeaveButton {
      padding: 1.5vh 3vw;
      background: linear-gradient(135deg, ${COLORS.danger} 0%, ${COLORS.dangerDark} 100%);
      color: ${COLORS.textWhite};
      border: none;
      border-radius: 1.5vh;
      font-size: clamp(1rem, 2.5vw, 1.2rem);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1vh 2vh rgba(244, 67, 54, 0.3);
    }
    .waitingLeaveButton:hover {
      transform: translateY(-0.2rem) scale(1.02);
      box-shadow: 0 0.8rem 2.5rem rgba(244, 67, 54, 0.4);
    }
    .forfeitButton {
      background: linear-gradient(135deg, ${COLORS.danger} 0%, ${COLORS.dangerDark} 100%);
      border: none;
      border-radius: 1rem;
      padding: 1rem;
      color: ${COLORS.textWhite};
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0.4rem 1.5rem rgba(244, 67, 54, 0.3);
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 1rem;
      font-weight: 600;
      width: 100%;
    }
    .forfeitButton:hover {
      transform: translateY(-0.2rem) scale(1.02);
      box-shadow: 0 0.8rem 2.5rem rgba(244, 67, 54, 0.4);
    }
    .buttonIcon {
      font-size: clamp(1.2rem, 3vw, 1.5rem);
      min-width: 4rem;
      text-align: center;
    }
    .buttonTextContainer {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.2rem;
    }
    .buttonTitle {
      font-size: clamp(1rem, 2.5vw, 1.2rem);
      font-weight: 700;
      line-height: 1;
    }
    .buttonSubtitle {
      font-size: clamp(0.8rem, 2vw, 0.9rem);
      opacity: 0.9;
      font-weight: 400;
      line-height: 1;
    }
    .dialogOverlay {
      position: fixed;
      inset: 0;
      background-color: ${COLORS.dialogOverlay};
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(0.8rem);
    }
    .dialogBox {
      background: ${COLORS.dialogBg};
      border-radius: 2rem;
      padding: 3rem 2rem;
      max-width: 90vw;
      width: 40rem;
      text-align: center;
      border: 0.1rem solid rgba(141, 110, 99, 0.3);
      box-shadow: 0 3rem 6rem rgba(0, 0, 0, 0.4);
      animation: dialogSlideIn 0.3s ease-out;
    }
    .dialogIcon {
      font-size: clamp(3rem, 8vw, 4rem);
      margin-bottom: 2rem;
    }
    .dialogTitle {
      font-size: clamp(1.3rem, 3.5vw, 1.8rem);
      font-weight: 700;
      color: ${COLORS.textPrimary};
      margin-bottom: 1.5rem;
    }
    .dialogMessage {
      font-size: clamp(1rem, 2.5vw, 1.1rem);
      color: ${COLORS.textSecondary};
      line-height: 1.5;
      margin-bottom: 3rem;
    }
    .dialogButtons {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }
    .dialogCancelButton {
      padding: 1rem 2rem;
      background: ${COLORS.textMuted};
      color: ${COLORS.textWhite};
      border: none;
      border-radius: 0.5rem;
      font-size: clamp(0.9rem, 2.2vw, 1rem);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      min-width: 12rem;
    }
    .dialogCancelButton:hover {
      background-color: ${COLORS.textSecondary};
      transform: translateY(-0.1rem);
    }
    .dialogConfirmButton {
      padding: 1rem 2rem;
      background: ${COLORS.danger};
      color: ${COLORS.textWhite};
      border: none;
      border-radius: 0.5rem;
      font-size: clamp(0.9rem, 2.2vw, 1rem);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      min-width: 12rem;
    }
    .dialogConfirmButton:hover {
      background-color: ${COLORS.dangerDark};
      transform: translateY(-0.1rem);
    }

    /* Enhanced button and interactive element cursors */
    button {
      cursor: pointer !important;
      transition: all 0.2s ease;
    }

    button:hover {
      transform: translateY(-1px);
    }

    button:active {
      transform: translateY(0);
    }

    input {
      cursor: text !important;
    }

    .clickable {
      cursor: pointer !important;
    }

    .draggable {
      cursor: grab !important;
    }

    .draggable:active {
      cursor: grabbing !important;
    }

    /* Media Queries for better mobile support */
    @media (max-width: 1200px) {
      .game-content-area {
        gap: 1.5rem;
      }
      
      .right-panel-wrapper {
        width: 280px;
      }
    }

    @media (max-width: 1024px) {
      .main-layout {
        padding: 0.5rem;
      }
      
      .game-content-area {
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }
      
      .board-section {
        width: 100%;
        max-width: none;
      }
      
      .board-container {
        width: min(95vw, 95vh, 500px);
        cursor: pointer;
      }
      
      .right-panel-wrapper {
        width: 100%;
        max-width: 400px;
        align-items: center;
      }
    }

    @media (max-width: 768px) {
      .main-layout {
        padding: 0.25rem;
      }
      
      .game-content-area {
        gap: 0.75rem;
      }
      
      .board-container {
        width: min(98vw, 98vh, 450px);
        border-radius: 8px;
      }
      
      .board-section {
        gap: 0.75rem;
      }
    }

    @media (max-width: 600px) {
      .board-container {
        width: min(100vw - 1rem, 100vh - 200px, 400px);
        cursor: pointer;
      }
      
      .game-content-area {
        gap: 0.5rem;
      }
      
      .board-section {
        gap: 0.5rem;
      }
    }

    @media (max-width: 480px) {
      .main-layout {
        padding: 0.125rem;
      }
      
      .board-container {
        width: min(100vw - 0.5rem, 100vh - 180px, 350px);
        border-radius: 6px;
      }
    }

    /* Landscape orientation adjustments */
    @media (max-height: 600px) and (orientation: landscape) {
      .game-content-area {
        flex-direction: row;
        gap: 1rem;
      }
      
      .board-container {
        width: min(70vh, 400px);
      }
      
      .right-panel-wrapper {
        width: 250px;
      }
      
      .board-section {
        gap: 0.5rem;
      }
    }

    @media (max-height: 500px) and (orientation: landscape) {
      .board-container {
        width: min(60vh, 350px);
      }
      
      .right-panel-wrapper {
        width: 220px;
      }
    }
  `

  // Convert square name to file/rank indices
  const squareToIndices = (square) => {
    const file = square.charCodeAt(0) - 97
    const rank = Number.parseInt(square[1]) - 1
    return { file, rank }
  }

  // Convert file/rank indices to square name
  const indicesToSquare = (file, rank) => {
    return String.fromCharCode(97 + file) + (rank + 1)
  }

  // Get actual coordinates from display coordinates
  const getActualCoords = (displayFile, displayRank) => {
    if (playerColor === "w") {
      return { file: displayFile, rank: 7 - displayRank }
    } else {
      return { file: 7 - displayFile, rank: displayRank }
    }
  }

  // Handle square click with proper coordinate conversion
  const handleSquareClickWithCoords = (displayRow, displayCol) => {
    const { file, rank } = getActualCoords(displayCol, displayRow)
    const square = indicesToSquare(file, rank)
    handleSquareClick(square)
  }

  const renderSquare = (piece, displayRow, displayCol) => {
    const { file, rank } = getActualCoords(displayCol, displayRow)
    const square = indicesToSquare(file, rank)
    const isDark = (displayRow + displayCol) % 2 === 1
    const isSelected = selectedSquare === square
    const isLegal = possibleMoves.includes(square)
    const isCapture = captureSquares.includes(square)
    const isLastMove = lastMove.includes(square)
    const isInCheck = gameState.isCheck && piece?.type === "k" && piece?.color === gameState.turn

    return (
      <ChessSquare
        key={`${displayRow}-${displayCol}`}
        pieceObj={piece}
        square={square}
        isDark={isDark}
        isSelected={isSelected}
        isLegal={isLegal}
        isCapture={isCapture}
        isLastMove={isLastMove}
        isInCheck={isInCheck}
        onClick={() => handleSquareClickWithCoords(displayRow, displayCol)}
      />
    )
  }

  // Create the display board based on player orientation
  const createDisplayBoard = () => {
    const board = gameState.board
    const displayBoard = []
    for (let displayRow = 0; displayRow < 8; displayRow++) {
      for (let displayCol = 0; displayCol < 8; displayCol++) {
        const { file, rank } = getActualCoords(displayCol, displayRow)
        const piece = board[7 - rank] ? board[7 - rank][file] : null
        displayBoard.push({ piece, displayRow, displayCol })
      }
    }
    return displayBoard
  }

  const handleForfeitConfirm = async () => {
    setShowForfeitConfirm(false)
    setIsForfeiting(true)
    try {
      await forfeitGame()
    } catch (error) {
      console.error("❌ Failed to forfeit game:", error)
      alert("Failed to forfeit game. You can still leave the room.")
    } finally {
      setIsForfeiting(false)
    }
  }

  const handlePlayAgain = async () => {
    try {
      await resetGame()
    } catch (error) {
      console.error("❌ Failed to reset game:", error)
      alert("Failed to reset game. Please try again.")
    }
  }

  const handleCloseGameOverModal = () => {
    // Optionally navigate away or just close the modal
    // For now, we'll just let the game state handle it.
    // If you want to force navigation, uncomment: navigate("/");
  }

  const displayBoard = createDisplayBoard()
  const opponentName = roomInfo?.hostPlayer === username ? roomInfo?.guestPlayer : roomInfo?.hostPlayer
  const opponentColor = playerColor === "w" ? "b" : "w"
  const myColor = playerColor

  const getWinnerForModal = () => {
    if (roomInfo?.forfeited) {
      return roomInfo.forfeitedBy === playerColor ? "You" : "Opponent"
    }
    if (roomInfo?.timeoutWinner) {
      return roomInfo.winner === (playerColor === "w" ? "White" : "Black") ? "You" : "Opponent"
    }
    if (gameState.winner === "Draw") return "Draw"
    if (gameState.winner === (playerColor === "w" ? "White" : "Black")) return "You"
    return "Opponent"
  }

  const getWasAbortedForModal = () => {
    return roomInfo?.forfeited || false
  }

  const getIfTimeoutForModal = () => {
    return roomInfo?.timeoutWinner || false
  }

  // Wait for game to start
  if (!isGameStarted) {
    return (
      <>
        <style>{customStyles}</style>
        <div className="waitingContainer">
          <div className="backgroundPattern">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="floating-piece"
                style={{
                  top: `${10 + i * 12}vh`,
                  left: `${5 + (i % 2) * 85}vw`,
                  animationDelay: `${i * 0.6}s`,
                }}
              >
                {["♔", "♛", "♜", "♝", "♞", "♟", "♕", "♖"][i]}
              </div>
            ))}
          </div>
          <div className="waitingCard">
            <div className="waitingAnimation">
              <div className="spinnerRing">
                <div className="spinnerCore"></div>
              </div>
            </div>
            <h2 className="waitingTitle">⚔️ Preparing Chess Arena</h2>
            <div className="waitingDetails">
              <div className="waitingInfo">
                <span className="waitingLabel">Room ID:</span>
                <span className="waitingValue">{roomId}</span>
              </div>
              <div className="waitingInfo">
                <span className="waitingLabel">Playing as:</span>
                <span className="waitingValue">{playerColor === "w" ? "⚪ White" : "⚫ Black"}</span>
              </div>
              <div className="waitingInfo">
                <span className="waitingLabel">Time Control:</span>
                <span className="waitingValue">{selectedTime} minutes</span>
              </div>
            </div>
            <div className="waitingText">Waiting for opponent to join the battle...</div>
            <button
              onClick={() => navigate("/multiplayer-lobby?username=" + encodeURIComponent(username))}
              className="waitingLeaveButton"
            >
              🚪 Leave Room
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{customStyles}</style>
      <div className="main-layout">
        {/* Animated background elements */}
        <div className="background-elements">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="floating-piece"
              style={{
                top: `${5 + i * 8}%`,
                left: `${2 + (i % 3) * 45}%`,
                animationDelay: `${i * 0.8}s`,
              }}
            >
              {["♔", "♛", "♜", "♝", "♞", "♟", "♚", "♕", "♖", "♗", "♘", "♙"][i]}
            </div>
          ))}
        </div>

        {gameState.isGameOver && (
          <GameOverModal
            winner={getWinnerForModal()}
            wasAborted={getWasAbortedForModal()}
            ifTimeout={getIfTimeoutForModal()}
            onPlayAgain={handlePlayAgain}
            onClose={() => navigate("/")}
          />
        )}

        {showForfeitConfirm && (
          <div className="dialogOverlay">
            <div className="dialogBox">
              <div className="dialogIcon">🏳️</div>
              <div className="dialogTitle">Forfeit Game?</div>
              <div className="dialogMessage">
                This will end the game immediately and your opponent will win. This action cannot be undone.
              </div>
              <div className="dialogButtons">
                <button
                  onClick={() => setShowForfeitConfirm(false)}
                  className="dialogCancelButton"
                  disabled={isForfeiting}
                >
                  Cancel
                </button>
                <button onClick={handleForfeitConfirm} className="dialogConfirmButton" disabled={isForfeiting}>
                  {isForfeiting ? "Forfeiting..." : "Forfeit Game"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="game-content-area">
          <div className="board-section">
            {/* Top Player Card - Opponent */}
            <PlayerCard
              name={opponentName || "Opponent"}
              rating={1200}
              isBot={false}
              isTop={true}
              capturedPieces={gameState.capturedPieces[playerColor === "w" ? "white" : "black"]}
              time={opponentColor === "w" ? timeLeft.white : timeLeft.black}
              isActive={gameState.turn === opponentColor && !gameState.isGameOver}
            />

            {/* Chess Board */}
            <div className="board-container">
              {displayBoard.map(({ piece, displayRow, displayCol }) => renderSquare(piece, displayRow, displayCol))}

              {/* Game status indicator */}
              {gameState.isCheck && !gameState.isCheckmate && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "rgba(255, 87, 34, 0.9)",
                    color: "white",
                    padding: "0.5rem 1rem",
                    borderRadius: "1rem",
                    fontSize: "1rem",
                    fontWeight: "700",
                    zIndex: 10,
                    textShadow: "0 0 10px rgba(255, 87, 34, 0.5)",
                  }}
                >
                  ⚡ CHECK!
                </div>
              )}
              {gameState.isCheckmate && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "rgba(244, 67, 54, 0.9)",
                    color: "white",
                    padding: "0.5rem 1rem",
                    borderRadius: "1rem",
                    fontSize: "1rem",
                    fontWeight: "700",
                    zIndex: 10,
                    textShadow: "0 0 10px rgba(244, 67, 54, 0.5)",
                  }}
                >
                  💀 CHECKMATE!
                </div>
              )}
            </div>

            {/* Bottom Player Card - You */}
            <PlayerCard
              name={username}
              rating={1200}
              isBot={false}
              isTop={false}
              capturedPieces={gameState.capturedPieces[playerColor === "w" ? "black" : "white"]}
              time={myColor === "w" ? timeLeft.white : timeLeft.black}
              isActive={gameState.turn === myColor && !gameState.isGameOver}
            />
          </div>

          <div className="right-panel-wrapper">
            <MoveHistory
              moveHistory={gameState.history}
              onResign={() => setShowForfeitConfirm(true)}
              onNewGame={handlePlayAgain}
              playerName={username}
              opponentName={opponentName || "Opponent"}
              playerRating={1200}
              opponentRating={1200}
              timeControl={selectedTime}
              gameType="Multiplayer"
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default NewMultiplayerGame
