// NewMultiplayerGame.jsx - Clean implementation using the new hook
import React from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import useRealtimeChess from "../hooks/useRealtimeChess";
import ChessSquare from "../components/ChessSquare";
import MoveHistory from "../components/MoveHistory";
import Timer from "../components/Timer";
import StatusBar from "../components/StatusBar";
import "../styles/Chessboard.css";

const NewMultiplayerGame = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const playerColor = searchParams.get("color");
  const selectedTime = parseInt(searchParams.get("time"), 10) || 5;
  const username = searchParams.get("username") || "You";

  // Validate parameters
  if (!roomId || !playerColor || !username || !["w", "b"].includes(playerColor)) {
    return (
      <div style={styles.errorContainer}>
        <div>❌ Invalid game parameters</div>
        <button onClick={() => navigate("/")} style={styles.button}>
          Go Home
        </button>
      </div>
    );
  }

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
    handleSquareClick,
    abortGame,
    resetGame
  } = useRealtimeChess(roomId, playerColor, username, selectedTime);

  // Wait for game to start
  if (!isGameStarted) {
    return (
      <div style={styles.waitingContainer}>
        <h2>⏳ Waiting for game to start...</h2>
        <div>Room: {roomId}</div>
        <div>You are: {playerColor === "w" ? "White" : "Black"}</div>
        <button onClick={() => navigate("/")} style={styles.button}>
          Leave Room
        </button>
      </div>
    );
  }

  // Convert square name to coordinates
  const squareToCoords = (square) => {
    const file = square.charCodeAt(0) - 97; // a=0, b=1, etc.
    const rank = 8 - parseInt(square[1]); // 8=0, 7=1, etc.
    return [rank, file];
  };

  // Convert coordinates to square name
  const coordsToSquare = (row, col) => {
    return String.fromCharCode(97 + col) + (8 - row);
  };

  const renderSquare = (pieceObj, row, col) => {
    // Adjust coordinates based on player color
    const displayRow = playerColor === "w" ? row : 7 - row;
    const displayCol = playerColor === "w" ? col : 7 - col;
    const square = coordsToSquare(row, col);
    
    const isDark = (row + col) % 2 === 1;
    const isSelected = selectedSquare === square;
    const isLegal = possibleMoves.includes(square);
    const isCapture = captureSquares.includes(square);
    const isLastMove = lastMove.includes(square);
    const isInCheck = gameState.isCheck && pieceObj?.type === "k" && pieceObj?.color === gameState.turn;

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
        onClick={() => handleSquareClick(square)}
      />
    );
  };

  // Create display board based on player orientation
  const createDisplayBoard = () => {
    const board = gameState.board;
    if (playerColor === "w") {
      return board;
    } else {
      // Flip board for black player
      return [...board].reverse().map(row => [...row].reverse());
    }
  };

  const displayBoard = createDisplayBoard();
  const opponentName = roomInfo?.hostPlayer === username ? 
    roomInfo?.guestPlayer : roomInfo?.hostPlayer;

  return (
    <div className="wrapper">
      <div className="board-section">
        {/* Top timer - opponent for current player */}
        <Timer
          label={playerColor === "w" ? (opponentName || "Black") : (opponentName || "White")}
          time={playerColor === "w" ? timeLeft.black : timeLeft.white}
        />
        
        {/* Chess board */}
        <div className="board-container">
          {displayBoard.map((rowArr, rowIdx) =>
            rowArr.map((pieceObj, colIdx) =>
              renderSquare(pieceObj, rowIdx, colIdx)
            )
          )}
        </div>
        
        {/* Bottom timer - current player */}
        <Timer
          label={playerColor === "w" ? username : username}
          time={playerColor === "w" ? timeLeft.white : timeLeft.black}
        />
      </div>

      <div className="controls">
        <h3>Move History</h3>
        <MoveHistory moveHistory={gameState.history} />

        <div style={styles.gameInfo}>
          <div><strong>Room:</strong> {roomId}</div>
          <div><strong>You:</strong> {playerColor === "w" ? "White" : "Black"}</div>
          <div><strong>Turn:</strong> {gameState.turn === "w" ? "White" : "Black"}</div>
          <div style={{ 
            color: isMyTurn ? "#4caf50" : "#ff9800",
            fontWeight: "bold",
            marginTop: "10px"
          }}>
            {isMyTurn ? "🟢 Your Turn" : "🟡 Opponent's Turn"}
          </div>
        </div>

        {gameState.isGameOver && (
          <>
            <StatusBar
              isGameOver={true}
              winner={gameState.winner}
              abort={roomInfo?.aborted}
              ifTimeout={roomInfo?.timeoutWinner}
            />
            <div style={styles.gameOverButtons}>
              <button className="time-btn" onClick={resetGame}>
                Play Again
              </button>
              <button className="time-btn" onClick={() => navigate("/")}>
                Leave Game
              </button>
            </div>
          </>
        )}

        {!gameState.isGameOver && (
          <div style={styles.activeGameButtons}>
            <button 
              className="time-btn" 
              onClick={abortGame}
              style={{ backgroundColor: "#f44336" }}
            >
              Abort Game
            </button>
            <button 
              className="time-btn" 
              onClick={() => navigate("/")}
              style={{ backgroundColor: "#666" }}
            >
              Leave Game
            </button>
          </div>
        )}

        {/* Debug info */}
        <div style={styles.debugInfo}>
          <small>
            Turn: {gameState.turn} | 
            My Color: {playerColor} | 
            My Turn: {isMyTurn ? "Yes" : "No"}
          </small>
        </div>
      </div>
    </div>
  );
};

const styles = {
  errorContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#212121",
    color: "white",
    gap: "20px",
  },
  waitingContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#212121",
    color: "white",
    gap: "20px",
    textAlign: "center"
  },
  button: {
    padding: "14px 24px",
    fontSize: "16px",
    fontWeight: "bold",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    backgroundColor: "#f44336",
    color: "white",
  },
  gameInfo: {
    background: "rgba(255, 255, 255, 0.1)",
    padding: "15px",
    borderRadius: "8px",
    margin: "15px 0",
    textAlign: "center",
  },
  gameOverButtons: {
    display: "flex",
    gap: "10px",
    marginTop: "15px",
  },
  activeGameButtons: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "15px",
  },
  debugInfo: {
    marginTop: "10px",
    padding: "5px",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: "4px",
    fontSize: "12px",
    color: "#ccc"
  }
};

export default NewMultiplayerGame;