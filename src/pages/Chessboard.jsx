"use client"
import { useSearchParams } from "react-router-dom"
import Timer from "../components/Timer"
import MoveHistory from "../components/MoveHistory"
import ChessSquare from "../components/ChessSquare"
import useChessGame from "../hooks/useChessGame"
import "../styles/Chessboard.css"

const squareName = (row, col) => "abcdefgh"[col] + (8 - row)

const Chessboard = () => {
  const [searchParams] = useSearchParams()
  const username = searchParams.get("username") || "You"

  const {
    game,
    displayBoard: board,
    selected,
    legalMoves,
    captureTargets,
    inCheck,
    playerScore,
    engineScore,
    gameOver,
    winner,
    gameStarted,
    whiteTime,
    blackTime,
    playAs,
    selectedTime,
    moveHistory,
    wasAborted,
    ifTimeout,
    lastMoveSquares,
    capturedPieces,
    handleClick,
    resetGame,
    abortGame,
    setPlayAs,
    setSelectedTime,
    startGameWithTime,
    initialTime,
  } = useChessGame()

  const renderSquare = (pieceObj, row, col) => {
    const trueRow = playAs === "w" ? row : 7 - row
    const square = squareName(trueRow, col)
    const isDark = (trueRow + col) % 2 === 1
    const isSelected = selected === square
    const isCapture = captureTargets.includes(square)
    const isLegal = legalMoves.includes(square)
    const isInCheck = inCheck && pieceObj?.type === "k" && pieceObj?.color === game.turn()
    const isLastMove = lastMoveSquares.includes(square)

    return (
      <ChessSquare
        key={square}
        pieceObj={pieceObj}
        square={square}
        isDark={isDark}
        isSelected={isSelected}
        isCapture={isCapture}
        isLegal={isLegal}
        isInCheck={isInCheck}
        isLastMove={isLastMove}
        onClick={() => handleClick(row, col)}
      />
    )
  }

  const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9 }

  // Get piece symbol
  const getPieceSymbol = (piece, color) => {
    const symbols = {
      white: { p: "♙", r: "♖", n: "♘", b: "♗", q: "♕", k: "♔" },
      black: { p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚" },
    }
    return symbols[color][piece] || piece
  }

  // Render captured pieces
  const renderCapturedPieces = (playerType) => {
    const isHumanPlayer = playerType === "player"
    const capturedPiecesArray = isHumanPlayer
      ? playAs === "w"
        ? capturedPieces.white
        : capturedPieces.black // Pieces captured by human
      : playAs === "w"
        ? capturedPieces.black
        : capturedPieces.white // Pieces captured by engine

    const capturedPieceColor = isHumanPlayer
      ? playAs === "w"
        ? "black"
        : "white" // Human (white) captures black pieces, Human (black) captures white pieces
      : playAs === "w"
        ? "white"
        : "black" // Engine (black) captures white pieces, Engine (white) captures black pieces

    const totalValue = capturedPiecesArray.reduce((sum, piece) => sum + (pieceValues[piece] || 0), 0)
    const pieceOrder = { p: 1, n: 2, b: 3, r: 4, q: 5 }
    const sortedCaptured = [...capturedPiecesArray].sort((a, b) => pieceOrder[a] - pieceOrder[b])

    return (
      <div style={styles.capturedPiecesContainer}>
        {sortedCaptured.length > 0 ? (
          <div style={styles.capturedPiecesList}>
            {sortedCaptured.map((piece, index) => (
              <span key={index} style={styles.capturedPiece}>
                <span key={index} style={{ ...styles.capturedPiece, color: capturedPieceColor === "white" ? "#fff" : "#000" }}>
                  {getPieceSymbol(piece, capturedPieceColor)}
                </span>

              </span>
            ))}
            {totalValue > 0 && <span style={styles.capturedValue}>+{totalValue}</span>}
          </div>
        ) : (
          <div style={styles.noCapturedPieces}>No captures</div>
        )}
      </div>
    )
  }

  if (!gameStarted) {
    return (
      <div style={styles.waitingContainer}>
        <div style={styles.backgroundPattern}>
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              style={{
                ...styles.floatingPiece,
                top: `${10 + i * 12}%`,
                left: `${5 + (i % 2) * 85}%`,
                animationDelay: `${i * 0.6}s`,
              }}
            >
              {["♔", "♛", "♜", "♝", "♞", "♟", "♕", "♖"][i]}
            </div>
          ))}
        </div>
        <div style={styles.waitingCard}>
          <div style={styles.waitingAnimation}>
            <div style={styles.spinnerRing}>
              <div style={styles.spinnerCore}></div>
            </div>
          </div>
          <h2 style={styles.waitingTitle}>⚔️ Chess vs Engine</h2>
          <div style={styles.waitingDetails}>
            <div style={styles.waitingInfo}>
              <span style={styles.waitingLabel}>Player:</span>
              <span style={styles.waitingValue}>{username}</span>
            </div>
            <div style={styles.waitingInfo}>
              <span style={styles.waitingLabel}>Playing as:</span>
              <span style={styles.waitingValue}>{playAs === "w" ? "⚪ White" : "⚫ Black"}</span>
            </div>
            <div style={styles.waitingInfo}>
              <span style={styles.waitingLabel}>Time Control:</span>
              <span style={styles.waitingValue}>
                {selectedTime || "Not selected"} {selectedTime ? "minutes" : ""}
              </span>
            </div>
          </div>

          <div className="options" style={styles.gameOptions}>
            <div style={styles.colorSelection}>
              <h3 style={styles.optionTitle}>Choose Color</h3>
              <div style={styles.colorButtons}>
                <button
                  style={{
                    ...styles.optionButton,
                    ...(playAs === "w" ? styles.selectedButton : {}),
                  }}
                  onClick={() => setPlayAs("w")}
                >
                  ⚪ White
                </button>
                <button
                  style={{
                    ...styles.optionButton,
                    ...(playAs === "b" ? styles.selectedButton : {}),
                  }}
                  onClick={() => setPlayAs("b")}
                >
                  ⚫ Black
                </button>
              </div>
            </div>

            <div style={styles.timeSelection}>
              <h3 style={styles.optionTitle}>Time Control</h3>
              <div style={styles.timeButtons}>
                {[1, 3, 5, 10].map((min) => (
                  <button
                    key={min}
                    style={{
                      ...styles.timeButton,
                      ...(selectedTime === min ? styles.selectedTimeButton : {}),
                    }}
                    onClick={() => setSelectedTime(min)}
                  >
                    {min} min
                  </button>
                ))}
              </div>
            </div>

            <button
              style={{
                ...styles.startButton,
                opacity: selectedTime ? 1 : 0.5,
                cursor: selectedTime ? "pointer" : "not-allowed",
              }}
              onClick={() => selectedTime && startGameWithTime(selectedTime)}
              disabled={!selectedTime}
              onMouseEnter={(e) => {
                if (selectedTime) {
                  e.target.style.transform = "translateY(-3px) scale(1.02)"
                  e.target.style.boxShadow = "0 10px 30px rgba(76, 175, 80, 0.4)"
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTime) {
                  e.target.style.transform = "translateY(0) scale(1)"
                  e.target.style.boxShadow = "0 6px 20px rgba(76, 175, 80, 0.3)"
                }
              }}
            >
              <span style={styles.buttonIcon}>🚀</span>
              <div style={styles.buttonTextContainer}>
                <span style={styles.buttonTitle}>Start Game</span>
                <span style={styles.buttonSubtitle}>Begin the battle!</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="chess-game-wrapper">
        <div className="game-layout">
          {/* Left Panel - Board */}
          <div className="board-section">
            {/* Top Player Info - Engine */}
            <div style={styles.playerSection}>
              <div style={styles.playerInfo}>
                <div style={styles.playerAvatar}>
                  <span style={styles.playerIcon}>🤖</span>
                </div>

                <div style={styles.playerRightSection}>
                  <div style={styles.playerDetails}>
                    <div style={styles.playerName}>Engine</div>
                    <div style={styles.connectionStatus}>
                      <span
                        style={{
                          ...styles.connectionDot,
                          backgroundColor: "#4caf50",
                        }}
                      ></span>
                      Online
                    </div>
                  </div>
                </div>

                <div style={styles.capturedFullWidth}>{renderCapturedPieces("engine")}</div>

                <div style={styles.timerContainer}>
                  <Timer label="" time={playAs === "w" ? blackTime : whiteTime} />
                </div>
              </div>
            </div>

            <div className="middle" style={styles.middle}>
              {/* Chess Board */}
              <div className="board-container" style={styles.enhancedBoard}>
                {board.flat().map((pieceObj, i) => renderSquare(pieceObj, Math.floor(i / 8), i % 8))}
              </div>

              {/* Right Panel - Controls */}
              <div className="controls-section" style={styles.controlsSection}>
                {/* Move History */}
                <div style={styles.historySection}>
                  <div style={styles.sectionHeader}>
                    <h3 style={styles.sectionTitle}>📜 Move History</h3>
                  </div>
                  <MoveHistory moveHistory={moveHistory} />
                </div>

                {/* Game Status */}
                {gameOver && (
                  <div style={styles.gameOverSection}>
                    <div style={styles.gameOverHeader}>
                      <div style={styles.gameOverIcon}>
                        {wasAborted ? "🏳️" : winner === "Draw" ? "🤝" : winner === "Player" ? "🏆" : "💔"}
                      </div>
                      <div style={styles.gameOverTitle}>
                        {wasAborted
                          ? "Game Aborted"
                          : winner === "Draw"
                            ? "Draw!"
                            : winner === "Player"
                              ? "Victory!"
                              : "Defeat"}
                      </div>
                    </div>
                    <div style={styles.gameOverActions}>
                      <button
                        style={styles.playAgainButton}
                        onClick={resetGame}
                        onMouseEnter={(e) => {
                          e.target.style.transform = "translateY(-3px) scale(1.02)"
                          e.target.style.boxShadow = "0 10px 30px rgba(76, 175, 80, 0.4)"
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "translateY(0) scale(1)"
                          e.target.style.boxShadow = "0 6px 20px rgba(76, 175, 80, 0.3)"
                        }}
                      >
                        <span style={styles.buttonIcon}>🔄</span>
                        <div style={styles.buttonTextContainer}>
                          <span style={styles.buttonTitle}>Play Again</span>
                          <span style={styles.buttonSubtitle}>New challenge</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Abort Button */}
                {!gameOver && (
                  <button
                    style={styles.forfeitButton}
                    onClick={abortGame}
                    onMouseEnter={(e) => {
                      e.target.style.transform = "translateY(-2px) scale(1.02)"
                      e.target.style.boxShadow = "0 8px 25px rgba(244, 67, 54, 0.4)"
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = "translateY(0) scale(1)"
                      e.target.style.boxShadow = "0 4px 15px rgba(244, 67, 54, 0.3)"
                    }}
                  >
                    <span style={styles.buttonIcon}>🏳️</span>
                    <div style={styles.buttonTextContainer}>
                      <span style={styles.buttonTitle}>Abort Game</span>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Player Info - Human Player */}
            <div style={styles.playerSection}>
              <div style={styles.playerInfo}>
                <div style={styles.playerAvatar}>
                  <span style={styles.playerIcon}>{playAs === "w" ? "⚪" : "⚫"}</span>
                </div>

                <div style={styles.playerRightSection}>
                  <div style={styles.playerDetails}>
                    <div style={styles.playerName}>{username}</div>
                    <div style={styles.connectionStatus}>
                      <span
                        style={{
                          ...styles.connectionDot,
                          backgroundColor: "#4caf50",
                        }}
                      ></span>
                      Online
                    </div>
                  </div>
                </div>

                <div style={styles.capturedFullWidth}>{renderCapturedPieces("player")}</div>

                <div style={styles.timerContainer}>
                  <Timer label="" time={playAs === "w" ? whiteTime : blackTime} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const styles = {
  waitingContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #4A2C2A 0%, #2C1B1A 100%)", // Darker, richer brown
    position: "relative",
    overflow: "hidden",
  },
  backgroundPattern: {
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
    fontSize: "clamp(2rem, 4vw, 3rem)",
    opacity: 0.08, // More subtle
    color: "rgba(255, 255, 255, 0.8)", // Lighter color
    animation: "float 8s ease-in-out infinite",
  },
  waitingCard: {
    background: "rgba(255, 255, 255, 0.98)", // Almost opaque white
    backdropFilter: "blur(15px)", // Slightly less blur
    borderRadius: "2vh", // Slightly less rounded
    padding: "4vh 3vw",
    boxShadow: "0 2vh 5vh rgba(0, 0, 0, 0.3)", // Softer shadow
    maxWidth: "90vw",
    width: "500px",
    textAlign: "center",
    border: "1px solid rgba(0, 0, 0, 0.1)", // Subtle border
    position: "relative",
    zIndex: 1,
  },
  waitingAnimation: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "3vh",
  },
  spinnerRing: {
    width: "80px",
    height: "80px",
    border: "4px solid rgba(74, 44, 42, 0.3)", // Brownish border
    borderTop: "4px solid #4A2C2A", // Darker brown
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerCore: {
    width: "40px",
    height: "40px",
    border: "2px solid rgba(44, 27, 26, 0.5)", // Darker brown
    borderBottom: "2px solid #2C1B1A", // Even darker brown
    borderRadius: "50%",
    animation: "spin 2s linear infinite reverse",
  },
  waitingTitle: {
    fontSize: "clamp(1.5rem, 4vw, 2rem)",
    fontWeight: "700",
    color: "#333",
    marginBottom: "2vh",
    margin: 0,
  },
  waitingDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "1vh",
    marginBottom: "3vh",
  },
  waitingInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1vh 2vw",
    background: "rgba(74, 44, 42, 0.05)", // Very subtle brown background
    borderRadius: "1vh",
    border: "1px solid rgba(74, 44, 42, 0.1)", // Subtle brown border
  },
  waitingLabel: {
    fontSize: "clamp(0.9rem, 2.2vw, 1.1rem)",
    color: "#666",
    fontWeight: "600",
  },
  middle: {
    display: "flex",
    alignItems: "center",
    gap: "3rem",
    width: "100%",
    justifyContent: "center",
  },
  waitingValue: {
    fontSize: "clamp(0.9rem, 2.2vw, 1.1rem)",
    color: "#333",
    fontWeight: "700",
    fontFamily: "monospace",
  },
  waitingText: {
    fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
    color: "#666",
    marginBottom: "3vh",
    lineHeight: 1.4,
  },
  waitingLeaveButton: {
    padding: "1.5vh 3vw",
    background: "linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)", // Red for leave
    color: "white",
    border: "none",
    borderRadius: "1.5vh",
    fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 1vh 2vh rgba(211, 47, 47, 0.3)",
  },
  enhancedBoard: {
    boxShadow: "0 0 40px rgba(0, 0, 0, 0.4), inset 0 0 0 3px rgba(74, 44, 42, 0.3)", // Brownish border
    borderRadius: "1rem",
    overflow: "hidden",
  },
  playerSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
    margin: "0.5rem 0",
    padding: "1rem",
    background: "rgba(255, 255, 255, 0.05)", // More transparent
    borderRadius: "1rem",
    backdropFilter: "blur(8px)", // Slightly less blur
    border: "1px solid rgba(255, 255, 255, 0.1)", // Lighter border
    width: "65%",
  },
  playerInfo: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    width: "100%",
  },
  capturedFullWidth: {
    background: "rgba(0, 0, 0, 0.1)", // Darker, more subtle background for captured pieces
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.5rem 1rem",
    borderRadius: "0.75rem",
    boxShadow: "inset 0 0 8px rgba(0,0,0,0.2)",
    marginTop: "0.5rem",
    width: "100%",
  },
  playerRightSection: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  playerAvatar: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #6D4C41 0%, #4E342E 100%)", // Brown gradient
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 15px rgba(78, 52, 46, 0.4)", // Brown shadow
    border: "3px solid rgba(255, 255, 255, 0.3)",
    flexShrink: 0,
  },
  playerIcon: {
    fontSize: "28px",
    color: "white",
  },
  playerDetails: {
    textAlign: "right",
  },
  playerName: {
    fontSize: "clamp(1.1rem, 2.8vw, 1.4rem)",
    fontWeight: "700",
    color: "#EFEBE9", // Lighter text for contrast
    marginBottom: "5px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  connectionStatus: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "clamp(0.8rem, 2vw, 1rem)",
    color: "#BCAAA4", // Muted brown
    fontWeight: "600",
  },
  connectionDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    animation: "pulse 2s ease-in-out infinite",
  },
  timerContainer: {
    flex: "0 0 auto",
    minWidth: "80px",
  },
  controlsSection: {
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "1rem",
    padding: "1.5rem",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    width: "15%",
  },
  capturedPiecesContainer: {
    background: "transparent",
    border: "none",
    borderRadius: "0",
    padding: "0",
    minHeight: "unset",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "4px",
  },
  capturedPiecesList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    alignItems: "center",
    width: "100%",
  },
  capturedPiece: {
    fontSize: "20px",
    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
  },
  capturedValue: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#E8F5E8",
    background: "rgba(76, 175, 80, 0.3)",
    padding: "2px 8px",
    borderRadius: "12px",
    marginLeft: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
  },
  noCapturedPieces: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.7)",
    fontStyle: "italic",
  },
  historySection: {
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "1rem",
    padding: "1rem",
    border: "1px solid rgba(78, 52, 46, 0.2)", // Brown border
    boxShadow: "0 4px 15px rgba(78, 52, 46, 0.1)", // Brown shadow
  },
  sectionHeader: {
    marginBottom: "1rem",
  },
  sectionTitle: {
    fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
    fontWeight: "700",
    color: "#333",
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  forfeitButton: {
    background: "linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)", // Red gradient
    border: "none",
    borderRadius: "1rem",
    padding: "1rem",
    color: "white",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 15px rgba(211, 47, 47, 0.3)",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    fontSize: "1rem",
    fontWeight: "600",
    width: "100%",
  },
  gameOverSection: {
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "1rem",
    padding: "2rem",
    border: "1px solid rgba(78, 52, 46, 0.2)", // Brown border
    boxShadow: "0 4px 15px rgba(78, 52, 46, 0.1)", // Brown shadow
    textAlign: "center",
  },
  gameOverHeader: {
    marginBottom: "2rem",
  },
  gameOverIcon: {
    fontSize: "clamp(3rem, 8vw, 5rem)",
    marginBottom: "1rem",
  },
  gameOverTitle: {
    fontSize: "clamp(1.5rem, 4vw, 2rem)",
    fontWeight: "700",
    color: "#333",
    marginBottom: "0.5rem",
  },
  gameOverActions: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  playAgainButton: {
    background: "linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)", // Green gradient
    border: "none",
    borderRadius: "1rem",
    padding: "1rem",
    color: "white",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 6px 20px rgba(76, 175, 80, 0.3)",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    fontSize: "1rem",
    fontWeight: "600",
  },
  buttonIcon: {
    fontSize: "clamp(1.2rem, 3vw, 1.5rem)",
    minWidth: "40px",
    textAlign: "center",
  },
  buttonTextContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "0.2rem",
  },
  buttonTitle: {
    fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
    fontWeight: "700",
    lineHeight: 1,
  },
  buttonSubtitle: {
    fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
    opacity: 0.9,
    fontWeight: "400",
    lineHeight: 1,
  },
  gameOptions: {
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
    marginTop: "2rem",
  },
  colorSelection: {
    textAlign: "center",
  },
  timeSelection: {
    textAlign: "center",
  },
  optionTitle: {
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "#333",
    marginBottom: "1rem",
  },
  colorButtons: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
  },
  timeButtons: {
    display: "flex",
    gap: "0.5rem",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  optionButton: {
    padding: "0.75rem 1.5rem",
    background: "rgba(78, 52, 46, 0.1)", // Brownish transparent
    border: "2px solid rgba(78, 52, 46, 0.3)",
    borderRadius: "0.5rem",
    color: "#333",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "1rem",
  },
  selectedButton: {
    background: "linear-gradient(135deg, #6D4C41 0%, #4E342E 100%)", // Darker brown
    color: "white",
    border: "2px solid #4E342E",
  },
  timeButton: {
    padding: "0.5rem 1rem",
    background: "rgba(78, 52, 46, 0.1)", // Brownish transparent
    border: "2px solid rgba(78, 52, 46, 0.3)",
    borderRadius: "0.5rem",
    color: "#333",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "0.9rem",
    minWidth: "70px",
  },
  selectedTimeButton: {
    background: "linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)", // Green
    color: "white",
    border: "2px solid #388E3C",
  },
  startButton: {
    background: "linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)", // Green
    border: "none",
    borderRadius: "1rem",
    padding: "1rem 2rem",
    color: "white",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 6px 20px rgba(76, 175, 80, 0.3)",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    fontSize: "1rem",
    fontWeight: "600",
    justifyContent: "center",
    marginTop: "1rem",
  },
}

// Enhanced CSS animations - Add this to your CSS file or inject as a style element
const styleSheet = document.createElement("style")
styleSheet.type = "text/css"
styleSheet.innerText = `
  .chess-game-wrapper {
    min-height: 100vh;
    background: linear-gradient(135deg, #EFEBE9 0%, #D7CCC8 100%); /* Lighter, warmer background */
    padding: 0;
  }
  
  .game-layout {
    display: flex;
    gap: 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .board-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .controls-section {
    width: 350px;
    min-width: 350px;
  }
  
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
  
  /* Enhanced board styling */
  .board-container {
    transition: all 0.3s ease;
  }
  
  .board-container .square {
    transition: background-color 0.2s, transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .board-container .square:hover {
    background-color: rgba(255, 235, 59, 0.2) !important; /* Softer hover yellow */
    transform: scale(1.02);
    z-index: 10;
  }
  
  .board-container .square.selected {
    outline: 3px solid #FFB74D; /* Orange highlight */
    box-shadow: 0 0 15px rgba(255, 183, 77, 0.4);
    animation: selectedPulse 1.5s ease-in-out infinite;
  }
  
  @keyframes selectedPulse {
    0%, 100% {
       outline-color: #FFB74D;
      box-shadow: 0 0 15px rgba(255, 183, 77, 0.4);
    }
    50% {
       outline-color: #FF9800; /* Darker orange */
      box-shadow: 0 0 25px rgba(255, 152, 0, 0.6);
    }
  }
  
  .board-container .square.last-move {
    background-color: rgba(76, 175, 80, 0.1) !important; /* Greenish tint */
    box-shadow: inset 0 0 0 2px rgba(76, 175, 80, 0.3);
    animation: lastMovePulse 2s ease-in-out infinite;
  }
  
  @keyframes lastMovePulse {
    0%, 100% {
       background-color: rgba(76, 175, 80, 0.1) !important;
      box-shadow: inset 0 0 0 2px rgba(76, 175, 80, 0.3);
    }
    50% {
       background-color: rgba(76, 175, 80, 0.2) !important;
      box-shadow: inset 0 0 0 3px rgba(76, 175, 80, 0.5);
    }
  }
  
  /* Enhanced move history */
  .move-history {
    background: linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 100%) !important; /* Clean white */
    border: 1px solid rgba(78, 52, 46, 0.2) !important; /* Brown border */
    box-shadow: 0 4px 15px rgba(78, 52, 46, 0.1) !important; /* Brown shadow */
    border-radius: 0.5rem !important;
    max-height: 300px !important;
    overflow-y: auto !important;
  }
  
  .move-history div {
    background-color: rgba(78, 52, 46, 0.05) !important; /* Very subtle brown */
  }
  
  .move-history div:hover {
    background-color: rgba(78, 52, 46, 0.1) !important; /* Slightly darker hover */
    transform: translateX(3px);
  }
  
  /* Captured pieces hover effects */
  .capturedPiece:hover {
    transform: scale(1.3) !important;
    opacity: 1 !important;
  }
  
  /* Button hover effects */
  .optionButton:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(78, 52, 46, 0.3); /* Brown shadow */
  }
  
  .timeButton:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(78, 52, 46, 0.3); /* Brown shadow */
  }
  
  /* Responsive design */
  @media (max-width: 1200px) {
    .game-layout {
      flex-direction: column;
      gap: 1rem;
    }
    
    .controls-section {
      width: 100%;
      min-width: auto;
    }
    
    .board-container {
      width: 90vw;
      max-width: 600px;
    }
    
    .middle {
      flex-direction: column;
      gap: 2rem !important;
    }
  }
  
  @media (max-width: 768px) {
    .game-layout {
      padding: 0 1rem 1rem;
    }
    
    .playerSection {
      padding: 0.75rem !important;
      margin: 0.25rem 0 !important;
      width: 90% !important;
    }
    
    .playerInfo {
      flex-wrap: wrap;
      gap: 0.75rem !important;
    }
    
    .playerAvatar {
      width: 45px !important;
      height: 45px !important;
    }
    
    .playerIcon {
      font-size: 20px !important;
    }
    
    .capturedFullWidth {
      order: 3;
      width: 100%;
    }
    
    .playerRightSection {
      order: 2;
      width: 100%;
      justify-content: space-between;
    }
    
    .playerDetails {
      text-align: left !important;
    }
    
    .controlsSection {
      padding: 1rem;
    }
    
    .capturedPiecesContainer {
      padding: 0.75rem;
    }
    
    .historySection {
      padding: 0.75rem;
    }
    
    .gameOverSection {
      padding: 1.5rem;
    }
    
    .colorButtons {
      flex-direction: column;
      gap: 0.75rem !important;
    }
    
    .timeButtons {
      gap: 0.5rem !important;
      flex-wrap: wrap;
    }
    
    .timeButton {
      min-width: 60px !important;
      padding: 0.5rem 0.75rem !important;
      font-size: 0.8rem !important;
    }
    
    .waitingCard {
      width: 95vw !important;
      padding: 3vh 2vw !important;
    }
    
    .gameOptions {
      gap: 1.5rem !important;
    }
  }
  
  @media (max-width: 480px) {
    .board-container {
      width: 95vw;
      max-width: 400px;
    }
    
    .playerInfo {
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.5rem !important;
    }
    
    .playerDetails {
      min-width: auto;
      text-align: center !important;
    }
    
    .capturedFullWidth {
      order: 2;
      width: 100%;
      margin: 0.25rem 0;
    }
    
    .playerRightSection {
      order: 3;
      width: 100%;
      justify-content: center;
    }
    
    .capturedPiecesContainer {
      padding: 0.5rem;
      min-height: 50px;
    }
    
    .capturedPiece {
      font-size: 16px !important;
    }
    
    .capturedValue {
      font-size: 0.7rem !important;
      padding: 1px 6px !important;
    }
    
    .buttonTextContainer {
      align-items: center;
      text-align: center;
    }
    
    .forfeitButton {
      padding: 0.75rem;
    }
    
    .playAgainButton {
      padding: 0.75rem;
    }
  }
  
  /* Additional enhancement styles */
  .playerSection {
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }
  
  .playerSection:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
  
  .controlsSection {
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }
  
  .historySection {
    transition: all 0.3s ease;
  }
  
  .historySection:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(78, 52, 46, 0.15) !important; /* Brown shadow */
  }
  
  /* Enhanced game over animations */
  .gameOverSection {
    animation: gameOverSlideIn 0.5s ease-out;
  }
  
  @keyframes gameOverSlideIn {
    0% {
      opacity: 0;
      transform: translateY(30px) scale(0.9);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  /* Waiting screen enhancements */
  .waitingCard {
    animation: cardSlideIn 0.6s ease-out;
  }
  
  @keyframes cardSlideIn {
    0% {
      opacity: 0;
      transform: translateY(50px) scale(0.9);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  /* Enhanced button animations */
  .startButton:hover {
    animation: buttonPulse 1s ease-in-out infinite;
  }
  
  @keyframes buttonPulse {
    0%, 100% {
      box-shadow: 0 6px 20px rgba(76, 175, 80, 0.3);
    }
    50% {
      box-shadow: 0 8px 30px rgba(76, 175, 80, 0.5);
    }
  }
  
  /* Loading spinner enhancements */
  .spinnerRing {
    box-shadow: 0 4px 15px rgba(74, 44, 42, 0.3); /* Brown shadow */
  }
  
  /* Smooth transitions for all interactive elements */
  * {
    transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  }
  
  /* Focus states for accessibility */
  button:focus {
    outline: 2px solid #4E342E; /* Brown outline */
    outline-offset: 2px;
  }
  
  /* Custom scrollbar for move history */
  .move-history::-webkit-scrollbar {
    width: 6px;
  }
  
  .move-history::-webkit-scrollbar-track {
    background: rgba(78, 52, 46, 0.1); /* Brownish track */
    border-radius: 3px;
  }
  
  .move-history::-webkit-scrollbar-thumb {
    background: rgba(78, 52, 46, 0.3); /* Brownish thumb */
    border-radius: 3px;
  }
  
  .move-history::-webkit-scrollbar-thumb:hover {
    background: rgba(78, 52, 46, 0.5); /* Darker brownish thumb on hover */
  }
  
  /* Board square colors */
  .square.dark {
    background-color: #6D4C41; /* Darker brown */
  }
  
  .square.light {
    background-color: #D7CCC8; /* Lighter, warmer brown */
  }
  
  .square.in-check {
    background-color: #EF5350 !important; /* Brighter red for check */
  }
  
  .dot {
    background-color: rgba(44, 27, 26, 0.5); /* Darker brown dot */
  }
  
  .capture-ring {
    border: 3px solid rgba(255, 87, 34, 0.6); /* Orange ring */
  }
`

if (!document.querySelector("#enhanced-chess-styles")) {
  styleSheet.id = "enhanced-chess-styles"
  document.head.appendChild(styleSheet)
}

export default Chessboard
