"use client"
import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import PlayerCard from "../components/PlayerCard"
import ChessSquare from "../components/ChessSquare"
import MoveHistory from "../components/MoveHistory"
import GameSetup from "../components/GameSetup.jsx"
import GameOverModal from "../components/GameOverModal"
import useChessGame from "../hooks/useChessGame"
import { COLORS } from "../utils/colors"

const Chessboard = ({
  username: defaultUsername = "mitanshu",
  engineName = "Stockfish",
  userRating = 1095,
  engineRating = 1500,
  gameType = "Chess vs Engine",
}) => {
  const location = useLocation()
  const [username, setUsername] = useState(defaultUsername)

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const usernameFromUrl = urlParams.get("username")
    if (usernameFromUrl) {
      setUsername(usernameFromUrl)
    }
  }, [location.search])

  const {
    gameStarted,
    playAs,
    selectedTime,
    gameOver,
    winner,
    whiteTime,
    blackTime,
    moveHistory,
    selected,
    legalMoves,
    captureTargets,
    lastMoveSquares,
    currentTurn,
    inCheck,
    displayBoard,
    capturedPieces,
    setPlayAs,
    setSelectedTime,
    startGameWithTime,
    handleClick,
    resetGame,
    abortGame,
    wasAborted,
    ifTimeout,
  } = useChessGame()

  const squareName = (row, col) => "abcdefgh"[col] + (8 - row)

  const renderSquare = (pieceObj, row, col) => {
    const trueRow = playAs === "w" ? row : 7 - row
    const square = squareName(trueRow, col)
    const isDark = (trueRow + col) % 2 === 1
    const isSelected = selected === square
    const isLegal = legalMoves.includes(square)
    const isCapture = captureTargets.includes(square)
    const isLastMove = lastMoveSquares.includes(square)
    const isInCheck = inCheck && pieceObj?.type === "k" && pieceObj?.color === currentTurn

    return (
      <ChessSquare
        key={square}
        pieceObj={pieceObj}
        square={square}
        isDark={isDark}
        isSelected={isSelected}
        isLegal={isLegal}
        isCapture={isCapture}
        isLastMove={isLastMove}
        isInCheck={isInCheck}
        onClick={() => handleClick(row, col)}
      />
    )
  }

  // Determine which captured pieces to show for each player
  const getPlayerCapturedPieces = (isEngineCard) => {
    if (playAs === "w") {
      return isEngineCard ? capturedPieces.black : capturedPieces.white
    } else {
      return isEngineCard ? capturedPieces.white : capturedPieces.black
    }
  }

  // Determine player names for move history based on playing color
  const getPlayerNames = () => {
    if (playAs === "w") {
      return {
        playerName: username,
        opponentName: engineName,
        playerRating: userRating,
        opponentRating: engineRating,
      }
    } else {
      return {
        playerName: username,
        opponentName: engineName,
        playerRating: userRating,
        opponentRating: engineRating,
      }
    }
  }

  const { playerName, opponentName, playerRating, opponentRating } = getPlayerNames()

  const customStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    25% { transform: translateY(-1vh) rotate(3deg); }
    50% { transform: translateY(-0.5vh) rotate(-2deg); }
    75% { transform: translateY(-1.5vh) rotate(4deg); }
  }

  @keyframes glow {
    0% { filter: drop-shadow(0 0 0.3vh rgba(141, 110, 99, 0.5)); }
    100% { filter: drop-shadow(0 0 0.8vh rgba(141, 110, 99, 0.8)); }
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

  html,
  body {
    margin: 0;
    padding: 0;
    height: 100%;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(120deg, #f2e9e4 0%, #d8cfc4 50%, #f9f4ef 100%);
    cursor: default;
  }

  .main-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    width: 100%;
    background: linear-gradient(120deg, #f2e9e4 0%, #d8cfc4 50%, #f9f4ef 100%);
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

  if (!gameStarted) {
    return (
      <GameSetup
        playAs={playAs}
        setPlayAs={setPlayAs}
        selectedTime={selectedTime}
        setSelectedTime={setSelectedTime}
        onStartGame={startGameWithTime}
        username={username}
      />
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

        {gameOver && (
          <GameOverModal
            winner={winner}
            wasAborted={wasAborted}
            ifTimeout={ifTimeout}
            onPlayAgain={resetGame}
            onClose={() => {}}
          />
        )}

        <div className="game-content-area">
          <div className="board-section">
            {/* Top Player Card - Engine */}
            <PlayerCard
              name={engineName}
              rating={engineRating}
              isBot={true}
              isTop={true}
              capturedPieces={getPlayerCapturedPieces(true)}
              time={playAs === "w" ? blackTime : whiteTime}
              isActive={currentTurn !== playAs && !gameOver}
            />

            {/* Chess Board */}
            <div className="board-container">
              {displayBoard.flat().map((pieceObj, i) => renderSquare(pieceObj, Math.floor(i / 8), i % 8))}
            </div>

            {/* Bottom Player Card - Player */}
            <PlayerCard
              name={username}
              rating={userRating}
              isBot={false}
              isTop={false}
              capturedPieces={getPlayerCapturedPieces(false)}
              time={playAs === "w" ? whiteTime : blackTime}
              isActive={currentTurn === playAs && !gameOver}
            />
          </div>

          <div className="right-panel-wrapper">
            <MoveHistory
              moveHistory={moveHistory}
              onResign={abortGame}
              onNewGame={resetGame}
              playerName={playerName}
              opponentName={opponentName}
              playerRating={playerRating}
              opponentRating={opponentRating}
              timeControl={selectedTime}
              gameType={gameType}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default Chessboard
