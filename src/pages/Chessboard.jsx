"use client"
import PlayerCard from "../components/PlayerCard"
import ChessSquare from "../components/ChessSquare"
import MoveHistory from "../components/MoveHistory"
import GameSetup from "../components/GameSetup.jsx"
import GameOverModal from "../components/GameOverModal"
import Timer from "../components/Timer"
import useChessGame from "../hooks/useChessGame"
import { COLORS } from "../utils/colors"

const Chessboard = ({
  username = "mitanshu",
  engineName = "Stockfish",
  userRating = 1095,
  engineRating = 1500,
  gameType = "Chess vs Engine",
}) => {
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
        isLastMove={isLastMove}
        isInCheck={isInCheck}
        onClick={() => handleClick(row, col)}
      />
    )
  }

  // Determine which captured pieces to show for each player
  const getPlayerCapturedPieces = (isEngineCard) => {
    if (playAs === "w") {
      // User is white, engine is black
      // User's card shows black pieces they captured
      // Engine's card shows white pieces they captured
      return isEngineCard ? capturedPieces.black : capturedPieces.white
    } else {
      // User is black, engine is white
      // User's card shows white pieces they captured
      // Engine's card shows black pieces they captured
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

  html,
  body {
    margin: 0;
    padding: 0;
    height: 100%;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(120deg, #f2e9e4 0%, #d8cfc4 50%, #f9f4ef 100%);
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
    gap: 5rem;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }

  .board-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .player-card-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    max-width: 600px;
    padding: 0.8rem;
    background: rgba(252, 248, 243, 0.95);
    backdrop-filter: blur(10px);
    box-shadow: 0 0.5vh 1.5vh rgba(141, 110, 99, 0.2);
    border-radius: 12px;
    gap: 1rem;
    border: 0.1vh solid rgba(255, 255, 255, 0.3);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .player-card-container:hover {
    box-shadow: 0 0.8vh 2vh rgba(141, 110, 99, 0.25);
    transform: translateY(-1px);
  }

  .player-card-container.top {
    margin-bottom: 0.5rem;
  }

  .player-card-container.bottom {
    margin-top: 0.5rem;
  }

  .board-container {
    width: min(80vw, 80vh);
    max-width: 600px;
    aspect-ratio: 1 / 1;
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1vh 3vh rgba(141, 110, 99, 0.3), 0 0 0 0.2vh rgba(255, 255, 255, 0.2);
    flex-shrink: 0;
    border: 0.2vh solid rgba(141, 110, 99, 0.2);
  }

  .right-panel-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex-shrink: 0;
  }

  /* Media Queries */
  @media (max-width: 1024px) {
    .main-layout {
      padding: 0.5rem;
    }
    .game-content-area {
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }
    .board-container {
      width: 95vw;
      max-width: 95vw;
    }
    .player-card-container {
      width: 95vw;
      max-width: 95vw;
      flex-direction: row;
      justify-content: space-between;
      padding: 0.5rem;
    }
    .right-panel-wrapper {
      width: 100%;
      max-width: 400px;
      align-items: center;
    }
  }
  @media (max-width: 600px) {
    .board-container {
      width: 100%;
      max-width: 100%;
    }
    .player-card-container {
      width: 100%;
      max-width: 100%;
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
            {/* Top Player Card - Above Board */}
            <div className="player-card-container top">
              <PlayerCard name={engineName} isBot={true} isTop={true} capturedPieces={getPlayerCapturedPieces(true)} />
              <Timer time={playAs === "w" ? blackTime : whiteTime} isActive={currentTurn !== playAs && !gameOver} />
            </div>

            {/* Chess Board */}
            <div className="board-container">
              {displayBoard.flat().map((pieceObj, i) => renderSquare(pieceObj, Math.floor(i / 8), i % 8))}
            </div>

            {/* Bottom Player Card - Below Board */}
            <div className="player-card-container bottom">
              <PlayerCard name={username} isBot={false} isTop={false} capturedPieces={getPlayerCapturedPieces(false)} />
              <Timer time={playAs === "w" ? whiteTime : blackTime} isActive={currentTurn === playAs && !gameOver} />
            </div>
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
