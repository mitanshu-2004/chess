"use client"

import { useState } from "react"
import { useParams, useSearchParams, useNavigate } from "react-router-dom"
import useRealtimeChess from "../hooks/useRealtimeChess"
import ChessSquare from "../components/ChessSquare"
import MoveHistory from "../components/MoveHistory"
import Timer from "../components/Timer"
import "../styles/Chessboard.css"

const NewMultiplayerGame = () => {
  const { roomId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const playerColor = searchParams.get("color")
  const selectedTime = Number.parseInt(searchParams.get("time"), 10) || 5
  const username = searchParams.get("username") || "You"

  // UI state for buttons and dialogs
  const [isForfeiting, setIsForfeiting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(null)

  const {
    gameState,
    selectedSquare,
    possibleMoves,
    captureSquares,
    lastMove,
    moveCount,
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

  // Validate parameters
  if (!roomId || !playerColor || !username || !["w", "b"].includes(playerColor)) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>❌</div>
        <div style={styles.errorTitle}>Invalid Game Parameters</div>
        <div style={styles.errorMessage}>Please check your room link and try again</div>
        <button onClick={() => navigate("/")} style={styles.errorButton}>
          🏠 Return Home
        </button>
      </div>
    )
  }

  // Wait for game to start
  if (!isGameStarted) {
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
          <h2 style={styles.waitingTitle}>⚔️ Preparing Chess Arena</h2>
          <div style={styles.waitingDetails}>
            <div style={styles.waitingInfo}>
              <span style={styles.waitingLabel}>Room ID:</span>
              <span style={styles.waitingValue}>{roomId}</span>
            </div>
            <div style={styles.waitingInfo}>
              <span style={styles.waitingLabel}>Playing as:</span>
              <span style={styles.waitingValue}>{playerColor === "w" ? "⚪ White" : "⚫ Black"}</span>
            </div>
            <div style={styles.waitingInfo}>
              <span style={styles.waitingLabel}>Time Control:</span>
              <span style={styles.waitingValue}>{selectedTime} minutes</span>
            </div>
          </div>
          <div style={styles.waitingText}>Waiting for opponent to join the battle...</div>
          <button
            onClick={() => navigate("/")}
            style={styles.waitingLeaveButton}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px) scale(1.02)"
              e.target.style.boxShadow = "0 8px 25px rgba(244, 67, 54, 0.4)"
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0) scale(1)"
              e.target.style.boxShadow = "0 4px 15px rgba(244, 67, 54, 0.3)"
            }}
          >
            🚪 Leave Room
          </button>
        </div>
      </div>
    )
  }

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

  // Get display coordinates for a square based on player orientation
  const getDisplayCoords = (file, rank) => {
    if (playerColor === "w") {
      return { displayFile: file, displayRank: 7 - rank }
    } else {
      return { displayFile: 7 - file, displayRank: rank }
    }
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
    console.log(`🎯 Click: display(${displayRow},${displayCol}) -> actual(${file},${rank}) -> ${square}`)
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

  // Enhanced forfeit function
  const handleForfeitGame = async () => {
    if (isForfeiting) return
    setIsForfeiting(true)
    try {
      console.log("🏳️ Forfeiting game - opponent will win...")
      await forfeitGame()
      console.log("✅ Game forfeited successfully - opponent wins")
      setTimeout(() => {
        navigate("/")
      }, 2000)
    } catch (error) {
      console.error("❌ Failed to forfeit game:", error)
      alert("Failed to forfeit game. You can still leave the room.")
      navigate("/")
    } finally {
      setIsForfeiting(false)
    }
  }

  // Leave game (only when game is over)
  const handleLeaveGame = () => {
    console.log("🚪 Leaving game...")
    navigate("/")
  }

  // Reset game with better error handling
  const handleResetGame = async () => {
    try {
      console.log("🔄 Resetting game...")
      await resetGame()
      console.log("✅ Game reset successfully")
    } catch (error) {
      console.error("❌ Failed to reset game:", error)
      alert("Failed to reset game. Please try again.")
    }
  }

  // Updated render captured pieces function
  const renderCapturedPieces = (color, position) => {
    const pieces = gameState.capturedPieces[color] || []
    const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9 }
    const totalValue = pieces.reduce((sum, piece) => sum + (pieceValues[piece] || 0), 0)

    return (
      <div style={styles.capturedPiecesContainer}>
        {pieces.length > 0 ? (
          <div style={styles.capturedPiecesList}>
            {pieces.map((piece, index) => (
              <span key={index} style={styles.capturedPiece}>
                {getPieceSymbol(piece, color)}
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

  // Get piece symbol
  const getPieceSymbol = (piece, color) => {
    const symbols = {
      white: { p: "♙", r: "♖", n: "♘", b: "♗", q: "♕", k: "♔" },
      black: { p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚" },
    }
    return symbols[color][piece] || piece
  }

  // Confirmation dialog component
  const ConfirmDialog = ({ action, onConfirm, onCancel }) => (
    <div style={styles.dialogOverlay}>
      <div style={styles.dialogBox}>
        <div style={styles.dialogIcon}>🏳️</div>
        <div style={styles.dialogTitle}>Forfeit Game?</div>
        <div style={styles.dialogMessage}>
          This will end the game immediately and your opponent will win. This action cannot be undone.
        </div>
        <div style={styles.dialogButtons}>
          <button
            onClick={onCancel}
            style={styles.dialogCancelButton}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#757575"
              e.target.style.transform = "translateY(-1px)"
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#9e9e9e"
              e.target.style.transform = "translateY(0)"
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={styles.dialogConfirmButton}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#d32f2f"
              e.target.style.transform = "translateY(-1px)"
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#f44336"
              e.target.style.transform = "translateY(0)"
            }}
          >
            Forfeit Game
          </button>
        </div>
      </div>
    </div>
  )

  const displayBoard = createDisplayBoard()
  const opponentName = roomInfo?.hostPlayer === username ? roomInfo?.guestPlayer : roomInfo?.hostPlayer

  return (
    <>
      <div className="chess-game-wrapper">
        <div className="game-layout">
          {/* Left Panel - Board */}
          <div className="board-section">
            {/* Top Player Info */}
            <div style={styles.playerSection}>
              <div style={styles.playerInfo}>
                <div style={styles.playerAvatar}>
                  <span style={styles.playerIcon}>{playerColor === "w" ? "⚫" : "⚪"}</span>
                </div>
                
                <div style={styles.playerRightSection}>
                  <div style={styles.playerDetails}>
                    <div style={styles.playerName}>
                      {opponentName || (playerColor === "w" ? "Black Player" : "White Player")}
                    </div>
                    <div style={styles.connectionStatus}>
                      <span
                        style={{
                          ...styles.connectionDot,
                          backgroundColor: opponentConnected ? "#4caf50" : "#f44336",
                        }}
                      ></span>
                      {opponentConnected ? "Online" : "Offline"}
                    </div>
                  </div>
                  
                </div>
                <div style={styles.capturedFullWidth}>
                  {renderCapturedPieces(playerColor === "w" ? "white" : "black", "middle")}
                </div>
                <div style={styles.timerContainer}>
                    <Timer label="" time={playerColor === "w" ? timeLeft.black : timeLeft.white} />
                  </div>
              </div>
            </div>

            <div className="middle" style={styles.middle}>
              {/* Chess Board */}
              <div className="board-container" style={styles.enhancedBoard}>
                {displayBoard.map(({ piece, displayRow, displayCol }) => renderSquare(piece, displayRow, displayCol))}
              </div>

              
            </div>

            {/* Bottom Player Info */}
            <div style={styles.playerSection}>
              <div style={styles.playerInfo}>
                <div style={styles.playerAvatar}>
                  <span style={styles.playerIcon}>{playerColor === "w" ? "⚪" : "⚫"}</span>
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
                <div style={styles.capturedFullWidth}>
                  {renderCapturedPieces(playerColor === "w" ? "black" : "white", "middle")}
                </div>
                <div style={styles.timerContainer}>
                    <Timer label="" time={playerColor === "w" ? timeLeft.white : timeLeft.black} />
                  </div>
              </div>
            </div>
          </div>
          {/* Right Panel - Controls */}
              <div className="controls-section" style={styles.controlsSection}>
                {/* Move History */}
                <div style={styles.historySection}>
                  <div style={styles.sectionHeader}>
                    <h3 style={styles.sectionTitle}>📜 Move History</h3>
                  </div>
                  <MoveHistory moveHistory={gameState.history} />
                </div>

                {/* Forfeit Button */}
                {!gameState.isGameOver && (
                  <button
                    style={{
                      ...styles.forfeitButton,
                      opacity: isForfeiting ? 0.7 : 1,
                      cursor: isForfeiting ? "not-allowed" : "pointer",
                    }}
                    onClick={() => setShowConfirmDialog("forfeit")}
                    disabled={isForfeiting}
                    onMouseEnter={(e) => {
                      if (!isForfeiting) {
                        e.target.style.transform = "translateY(-2px) scale(1.02)"
                        e.target.style.boxShadow = "0 8px 25px rgba(244, 67, 54, 0.4)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isForfeiting) {
                        e.target.style.transform = "translateY(0) scale(1)"
                        e.target.style.boxShadow = "0 4px 15px rgba(244, 67, 54, 0.3)"
                      }
                    }}
                  >
                    <span style={styles.buttonIcon}>{isForfeiting ? "⏳" : "🏳️"}</span>
                    <div style={styles.buttonTextContainer}>
                      <span style={styles.buttonTitle}>{isForfeiting ? "Forfeiting..." : "Forfeit Game"}</span>
                    </div>
                  </button>
                )}

                {/* Game Over Section */}
                {gameState.isGameOver && (
                  <div style={styles.gameOverSection}>
                    <div style={styles.gameOverHeader}>
                      <div style={styles.gameOverIcon}>
                        {roomInfo?.forfeited
                          ? "🏳️"
                          : gameState.winner === "Draw"
                            ? "🤝"
                            : (gameState.winner === "White" && playerColor === "w") ||
                                (gameState.winner === "Black" && playerColor === "b")
                              ? "🏆"
                              : "💔"}
                      </div>
                      <div style={styles.gameOverTitle}>
                        {roomInfo?.forfeited
                          ? "Game Forfeited"
                          : gameState.winner === "Draw"
                            ? "Draw!"
                            : (gameState.winner === "White" && playerColor === "w") ||
                                (gameState.winner === "Black" && playerColor === "b")
                              ? "Victory!"
                              : "Defeat"}
                      </div>
                      <div style={styles.gameOverSubtitle}>{getGameStatusMessage()}</div>
                    </div>
                    <div style={styles.gameOverActions}>
                      <button
                        style={styles.playAgainButton}
                        onClick={handleResetGame}
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
                          <span style={styles.buttonTitle}>Rematch</span>
                          <span style={styles.buttonSubtitle}>Start a new battle</span>
                        </div>
                      </button>
                      <button
                        style={styles.leaveButton}
                        onClick={handleLeaveGame}
                        onMouseEnter={(e) => {
                          e.target.style.transform = "translateY(-3px) scale(1.02)"
                          e.target.style.boxShadow = "0 10px 30px rgba(158, 158, 158, 0.4)"
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "translateY(0) scale(1)"
                          e.target.style.boxShadow = "0 6px 20px rgba(158, 158, 158, 0.3)"
                        }}
                      >
                        <span style={styles.buttonIcon}>🏠</span>
                        <div style={styles.buttonTextContainer}>
                          <span style={styles.buttonTitle}>Leave Game</span>
                          <span style={styles.buttonSubtitle}>Return to main menu</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <ConfirmDialog
          action={showConfirmDialog}
          onConfirm={() => {
            setShowConfirmDialog(null)
            handleForfeitGame()
          }}
          onCancel={() => setShowConfirmDialog(null)}
        />
      )}
    </>
  )
}

const styles = {
  errorContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    gap: "2vh",
    padding: "2vh",
    textAlign: "center",
  },
  errorIcon: {
    fontSize: "clamp(3rem, 8vw, 6rem)",
    marginBottom: "1vh",
  },
  errorTitle: {
    fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
    fontWeight: "700",
    marginBottom: "1vh",
  },
  errorMessage: {
    fontSize: "clamp(1rem, 2.5vw, 1.3rem)",
    opacity: 0.9,
    marginBottom: "3vh",
    maxWidth: "600px",
    lineHeight: 1.5,
  },
  errorButton: {
    padding: "1.5vh 3vw",
    fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
    fontWeight: "600",
    borderRadius: "1.5vh",
    border: "none",
    cursor: "pointer",
    backgroundColor: "#f44336",
    color: "white",
    boxShadow: "0 1vh 2vh rgba(244, 67, 54, 0.3)",
    transition: "all 0.3s ease",
  },
  waitingContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    position: "relative",
    overflow: "hidden",
    padding: "2vh",
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
    opacity: 0.1,
    color: "white",
    animation: "float 8s ease-in-out infinite",
  },
  waitingCard: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    borderRadius: "3vh",
    padding: "4vh 3vw",
    boxShadow: "0 3vh 6vh rgba(0, 0, 0, 0.3)",
    maxWidth: "90vw",
    width: "500px",
    textAlign: "center",
    border: "1px solid rgba(255, 255, 255, 0.3)",
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
    border: "4px solid rgba(102, 126, 234, 0.3)",
    borderTop: "4px solid #667eea",
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
    border: "2px solid rgba(118, 75, 162, 0.5)",
    borderBottom: "2px solid #764ba2",
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
    background: "rgba(102, 126, 234, 0.1)",
    borderRadius: "1vh",
    border: "1px solid rgba(102, 126, 234, 0.2)",
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
    background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
    color: "white",
    border: "none",
    borderRadius: "1.5vh",
    fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 1vh 2vh rgba(244, 67, 54, 0.3)",
  },
  enhancedBoard: {
    boxShadow: "0 0 40px rgba(0, 0, 0, 0.4), inset 0 0 0 3px rgba(102, 126, 234, 0.3)",
    borderRadius: "1rem",
    overflow: "hidden",
  },
  // Updated player section styles
  playerSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
    margin: "0.5rem 0",
    padding: "1rem",
    background: "rgba(255, 255, 255, 0.1)",
    borderRadius: "1rem",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    width: "65%",
  },
  playerInfo: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    width: "100%",
  },
  // New style for full width captured pieces
  capturedFullWidth: {
    background: "linear-gradient(120deg, #188cd4ff 0%, #2982c2ff 50%, #9ac3ceff 100%)",
    flex: 1,
  },
  // New style for right section with name and timer
  playerRightSection: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  playerAvatar: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
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
    color: "#333",
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
    color: "#666",
    fontWeight: "600",
  },
  connectionDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    animation: "pulse 2s ease-in-out infinite",
  },
  // New style for captured pieces in middle
  capturedMiddleContainer: {
    flex: 1,
    maxWidth: "300px",
    minWidth: "200px",
  },
  timerContainer: {
    flex: "0 0 auto",
    minWidth: "80px",
  },
  controlsSection: {
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "1rem",
    padding: "1.5rem", // Changed from 10rem to 1.5rem
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    width: "50%",
},
  // Simple captured pieces container
  capturedPiecesContainer: {
    background: "rgba(255, 255, 255, 0.9)",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "8px",
    minHeight: "40px",
    display: "flex",
    alignItems: "center",
  },
  capturedPiecesList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    alignItems: "center",
    width: "100%",
  },
  capturedPiece: {
    fontSize: "18px",
  },
  capturedValue: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "#4caf50",
    background: "#e8f5e8",
    padding: "2px 6px",
    borderRadius: "4px",
    marginLeft: "8px",
  },
  noCapturedPieces: {
    fontSize: "14px",
    color: "#999",
    fontStyle: "italic",
  },
  historySection: {
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "1rem",
    padding: "1rem",
    border: "1px solid rgba(102, 126, 234, 0.2)",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.1)",
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
    background: "linear-gradient(135deg, #f44336 0%, #d32f2f 100%)",
    border: "none",
    borderRadius: "1rem",
    padding: "1rem",
    color: "white",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 15px rgba(244, 67, 54, 0.3)",
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
    border: "1px solid rgba(102, 126, 234, 0.2)",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.1)",
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
  gameOverSubtitle: {
    fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
    color: "#666",
    fontWeight: "500",
  },
  gameOverActions: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  playAgainButton: {
    background: "linear-gradient(135deg, #4caf50 0%, #45a049 100%)",
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
  leaveButton: {
    background: "linear-gradient(135deg, #9e9e9e 0%, #757575 100%)",
    border: "none",
    borderRadius: "1rem",
    padding: "1rem",
    color: "white",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 6px 20px rgba(158, 158, 158, 0.3)",
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
  dialogOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(8px)",
  },
  dialogBox: {
    background: "rgba(255, 255, 255, 0.98)",
    borderRadius: "2rem",
    padding: "3rem 2rem",
    maxWidth: "90vw",
    width: "400px",
    textAlign: "center",
    border: "1px solid rgba(102, 126, 234, 0.3)",
    boxShadow: "0 3rem 6rem rgba(0, 0, 0, 0.4)",
    animation: "dialogSlideIn 0.3s ease-out",
  },
  dialogIcon: {
    fontSize: "clamp(3rem, 8vw, 4rem)",
    marginBottom: "2rem",
  },
  dialogTitle: {
    fontSize: "clamp(1.3rem, 3.5vw, 1.8rem)",
    fontWeight: "700",
    color: "#333",
    marginBottom: "1.5rem",
  },
  dialogMessage: {
    fontSize: "clamp(1rem, 2.5vw, 1.1rem)",
    color: "#666",
    lineHeight: 1.5,
    marginBottom: "3rem",
  },
  dialogButtons: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
  },
  dialogCancelButton: {
    padding: "1rem 2rem",
    background: "#9e9e9e",
    color: "white",
    border: "none",
    borderRadius: "0.5rem",
    fontSize: "clamp(0.9rem, 2.2vw, 1rem)",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    minWidth: "120px",
  },
  dialogConfirmButton: {
    padding: "1rem 2rem",
    background: "#f44336",
    color: "white",
    border: "none",
    borderRadius: "0.5rem",
    fontSize: "clamp(0.9rem, 2.2vw, 1rem)",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    minWidth: "120px",
  },
}

// Enhanced CSS animations
const styleSheet = document.createElement("style")
styleSheet.type = "text/css"
styleSheet.innerText = `
  .chess-game-wrapper {
    min-height: 100vh;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    padding: 0;
  }
  
  .game-layout {
    display: flex;
    gap: 2rem;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem 2rem;
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
  
  @keyframes dialogSlideIn {
    0% {
       opacity: 0;
       transform: translateY(-50px) scale(0.9);
     }
    100% {
       opacity: 1;
       transform: translateY(0) scale(1);
     }
  }
  
  /* Enhanced board styling */
  .board-container {
    transition: all 0.3s ease;
  }
  
  .board-container .square {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .board-container .square:hover {
    transform: scale(1.02);
    z-index: 10;
  }
  
  .board-container .square.selected {
    animation: selectedPulse 1.5s ease-in-out infinite;
  }
  
  @keyframes selectedPulse {
    0%, 100% {
       outline: 3px solid #667eea;
      box-shadow: 0 0 15px rgba(102, 126, 234, 0.4);
    }
    50% {
       outline: 4px solid #764ba2;
      box-shadow: 0 0 25px rgba(118, 75, 162, 0.6);
    }
  }
  
  .board-container .square.last-move {
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
    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%) !important;
    border: 1px solid rgba(102, 126, 234, 0.2) !important;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.1) !important;
    border-radius: 0.5rem !important;
    max-height: 300px !important;
    overflow-y: auto !important;
  }
  
  .move-history div:hover {
    background-color: rgba(102, 126, 234, 0.1) !important;
    transform: translateX(3px);
  }
  
  /* Captured pieces hover effects */
  .capturedPiece:hover {
    transform: scale(1.3) !important;
    opacity: 1 !important;
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
  }
  
  @media (max-width: 768px) {
    .game-layout {
      padding: 0 1rem 1rem;
    }
    
    .playerSection {
      padding: 0.75rem !important;
      margin: 0.25rem 0 !important;
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
    
    .dialogBox {
      margin: 1rem;
      width: calc(100vw - 2rem);
      max-width: 400px;
      padding: 2rem 1.5rem;
    }
    
    .dialogButtons {
      flex-direction: column;
      gap: 1rem;
    }
    
    .dialogCancelButton,
    .dialogConfirmButton {
      width: 100%;
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
      text-align: center;
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
    
    .capturedPiecesHeader {
      flex-direction: column;
      gap: 0.5rem;
      text-align: center;
    }
    
    .forfeitButton {
      padding: 0.75rem;
    }
    
    .playAgainButton,
    .leaveButton {
      padding: 0.75rem;
    }
  }
    // Add to the existing media queries in styleSheet.innerText
  @media (max-width: 380px) {
    .game-layout {
      padding: 0;
    }
    
    .board-container {
      width: 100vw;
      max-width: 100vw;
      border-radius: 0;
    }
    
    .playerSection {
      width: 100% !important;
      border-radius: 0;
    }
    
    .controlsSection {
      border-radius: 0;
      width: 100% !important;
    }
    
    .playerName {
      font-size: 1rem !important;
    }
    
    .playerAvatar {
      width: 40px !important;
      height: 40px !important;
    }
  }
`

if (!document.querySelector("#enhanced-chess-styles")) {
  styleSheet.id = "enhanced-chess-styles"
  document.head.appendChild(styleSheet)
}

export default NewMultiplayerGame