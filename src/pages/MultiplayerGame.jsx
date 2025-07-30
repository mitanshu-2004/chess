// MultiplayerGame.jsx - Fixed version with proper sync and turn handling
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { Chess } from "chess.js";
import { firestore } from "../utils/firebase";

import ChessSquare from "../components/ChessSquare";
import MoveHistory from "../components/MoveHistory";
import Timer from "../components/Timer";
import StatusBar from "../components/StatusBar";
import "../styles/Chessboard.css";

const squareName = (row, col) => "abcdefgh"[col] + (8 - row);

const MultiplayerGame = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const playerColor = searchParams.get("color");
  const selectedTime = parseInt(searchParams.get("time"), 10) || 5;
  const username = searchParams.get("username") || "You";

  // Game state
  const gameRef = useRef(new Chess());
  const [board, setBoard] = useState(gameRef.current.board());
  const [selected, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [captureTargets, setCaptureTargets] = useState([]);
  const [lastMoveSquares, setLastMoveSquares] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  
  // Room state
  const [roomData, setRoomData] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [wasAborted, setWasAborted] = useState(false);
  const [ifTimeout, setIfTimeout] = useState(false);
  
  // Timer state
  const [whiteTime, setWhiteTime] = useState(selectedTime * 60);
  const [blackTime, setBlackTime] = useState(selectedTime * 60);
  
  const intervalRef = useRef(null);
  const roomRef = doc(firestore, "rooms", roomId);
  const isMakingMove = useRef(false);
  const lastUpdateTime = useRef(0);

  // Validate parameters
  if (!roomId || !playerColor || !username) {
    return (
      <div style={styles.errorContainer}>
        <div>❌ Missing required parameters in URL</div>
        <button onClick={() => navigate("/")} style={styles.button}>Go Home</button>
      </div>
    );
  }

  if (playerColor !== "w" && playerColor !== "b") {
    return (
      <div style={styles.errorContainer}>
        <div>❌ Invalid player color in URL</div>
        <button onClick={() => navigate("/")} style={styles.button}>Go Home</button>
      </div>
    );
  }

  // Firebase listener with better sync
  useEffect(() => {
    console.log("🔌 Setting up Firebase listener for", playerColor);
    
    const unsubscribe = onSnapshot(roomRef, (docSnapshot) => {
      if (!docSnapshot.exists()) {
        alert("Room not found");
        navigate("/");
        return;
      }

      const data = docSnapshot.data();
      const updateTime = data.lastUpdateTime || 0;
      
      // Prevent processing old updates
      if (updateTime <= lastUpdateTime.current) {
        return;
      }
      lastUpdateTime.current = updateTime;

      console.log("📡 Firebase update received:", {
        gameState: data.gameState?.substring(0, 20) + "...",
        turn: data.gameState ? new Chess(data.gameState).turn() : "unknown",
        gameStarted: data.gameStarted,
        lastMove: data.lastMoveSquares
      });

      // Update room data
      setRoomData(data);
      setGameStarted(data.gameStarted || false);
      setGameOver(data.gameOver || false);
      setWinner(data.winner || null);
      setWasAborted(data.wasAborted || false);
      setIfTimeout(data.ifTimeout || false);
      setLastMoveSquares(data.lastMoveSquares || []);

      // Update timers
      if (typeof data.whiteTime === 'number') {
        setWhiteTime(data.whiteTime);
      }
      if (typeof data.blackTime === 'number') {
        setBlackTime(data.blackTime);
      }

      // Update game state if it changed
      if (data.gameState && data.gameState !== gameRef.current.fen()) {
        try {
          gameRef.current.load(data.gameState);
          setBoard(gameRef.current.board());
          setMoveHistory(gameRef.current.history());
          
          // Clear selection after move
          setSelected(null);
          setLegalMoves([]);
          setCaptureTargets([]);
          
          console.log("✅ Game state updated, turn:", gameRef.current.turn());
        } catch (error) {
          console.error("❌ Failed to load game state:", error);
        }
      }
    }, (error) => {
      console.error("❌ Firebase listener error:", error);
    });

    return () => {
      console.log("🔌 Cleaning up Firebase listener");
      unsubscribe();
    };
  }, [roomRef, navigate, playerColor]);

  // Timer logic - only the player whose turn it is should decrement
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (!gameStarted || gameOver) {
      return;
    }

    const currentTurn = gameRef.current.turn();
    const isMyTurn = currentTurn === playerColor;
    
    // Only start timer if it's my turn
    if (!isMyTurn) {
      return;
    }

    console.log("⏰ Starting timer for", playerColor, "turn:", currentTurn);

    intervalRef.current = setInterval(async () => {
      // Double check it's still my turn
      if (gameRef.current.turn() !== playerColor || isMakingMove.current) {
        return;
      }

      const timeKey = playerColor === "w" ? "whiteTime" : "blackTime";
      const currentTime = playerColor === "w" ? whiteTime : blackTime;
      const newTime = Math.max(0, currentTime - 1);
      
      // Update local state immediately
      if (playerColor === "w") {
        setWhiteTime(newTime);
      } else {
        setBlackTime(newTime);
      }

      // Update Firebase periodically or when time runs out
      if (newTime % 5 === 0 || newTime === 0) {
        try {
          const updateData = {
            [timeKey]: newTime,
            lastUpdateTime: Date.now()
          };

          if (newTime === 0) {
            const winnerColor = playerColor === "w" ? "Black" : "White";
            updateData.gameOver = true;
            updateData.ifTimeout = true;
            updateData.winner = winnerColor;
          }

          await updateDoc(roomRef, updateData);
        } catch (error) {
          console.error("❌ Timer update error:", error);
        }
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [gameStarted, gameOver, playerColor, whiteTime, blackTime, roomRef]);

  // Check if it's my turn
  const isMyTurn = useCallback(() => {
    const currentTurn = gameRef.current.turn();
    const myTurn = currentTurn === playerColor;
    const canPlay = gameStarted && !gameOver && !isMakingMove.current;
    
    console.log("🎯 Turn check:", {
      currentTurn,
      playerColor,
      myTurn,
      gameStarted,
      gameOver,
      canPlay: myTurn && canPlay
    });
    
    return myTurn && canPlay;
  }, [playerColor, gameStarted, gameOver]);

  const handleClick = async (row, col) => {
    if (!isMyTurn()) {
      console.log("❌ Not my turn or game not ready");
      return;
    }

    // Convert display coordinates to actual coordinates
    const actualRow = row;
    const actualCol = col;
    const square = squareName(actualRow, actualCol);
    const piece = gameRef.current.get(square);

    console.log("🎯 Square clicked:", {
      displayCoords: [row, col],
      actualCoords: [actualRow, actualCol],
      square,
      piece: piece ? `${piece.color}${piece.type}` : "empty",
      selected
    });

    // Selection logic
    if (!selected) {
      if (piece && piece.color === playerColor) {
        const moves = gameRef.current.moves({ square, verbose: true });
        setSelected(square);
        setLegalMoves(moves.map(m => m.to));
        setCaptureTargets(moves.filter(m => m.captured).map(m => m.to));
        console.log("✅ Piece selected:", square, "Legal moves:", moves.length);
      } else {
        console.log("❌ Invalid piece selection");
      }
      return;
    }

    // Deselect if clicking same square
    if (square === selected) {
      setSelected(null);
      setLegalMoves([]);
      setCaptureTargets([]);
      console.log("❌ Deselected piece");
      return;
    }

    // Attempt move
    if (isMakingMove.current) {
      console.log("❌ Already making a move");
      return;
    }

    isMakingMove.current = true;
    console.log("🚀 Attempting move:", selected, "->", square);

    try {
      const moveAttempt = gameRef.current.move({
        from: selected,
        to: square,
        promotion: "q"
      });

      if (moveAttempt) {
        console.log("✅ Valid move executed:", moveAttempt.san);
        
        // Update local state immediately for responsive UI
        setBoard(gameRef.current.board());
        setMoveHistory(gameRef.current.history());
        setSelected(null);
        setLegalMoves([]);
        setCaptureTargets([]);

        // Check for game end
        let gameOverState = false;
        let winnerState = null;

        if (gameRef.current.isGameOver()) {
          gameOverState = true;
          if (gameRef.current.isCheckmate()) {
            winnerState = gameRef.current.turn() === "w" ? "Black" : "White";
          } else if (gameRef.current.isStalemate()) {
            winnerState = "Draw";
          } else if (gameRef.current.isDraw()) {
            winnerState = "Draw";
          }
          console.log("🏁 Game over:", winnerState);
        }

        // Update Firebase
        const updateData = {
          gameState: gameRef.current.fen(),
          lastMoveSquares: [moveAttempt.from, moveAttempt.to],
          lastUpdateTime: Date.now()
        };

        if (gameOverState) {
          updateData.gameOver = true;
          updateData.winner = winnerState;
        }

        await updateDoc(roomRef, updateData);
        console.log("✅ Firebase updated successfully");
      } else {
        console.log("❌ Invalid move attempted");
        setSelected(null);
        setLegalMoves([]);
        setCaptureTargets([]);
      }
    } catch (error) {
      console.error("❌ Move execution error:", error);
      setSelected(null);
      setLegalMoves([]);
      setCaptureTargets([]);
    } finally {
      isMakingMove.current = false;
    }
  };

  const renderSquare = (pieceObj, row, col) => {
    // Create square name from actual board position
    const square = squareName(row, col);
    
    const isDark = (row + col) % 2 === 1;
    const isSelected = selected === square;
    const isCapture = captureTargets.includes(square);
    const isLegal = legalMoves.includes(square);
    const isInCheck = gameRef.current.inCheck() && 
                     pieceObj?.type === "k" && 
                     pieceObj?.color === gameRef.current.turn();
    const isLastMove = lastMoveSquares.includes(square);

    return (
      <ChessSquare
        key={`${row}-${col}`}
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
    );
  };

  const abortGame = async () => {
    try {
      const opponentWins = playerColor === "w" ? "Black" : "White";
      await updateDoc(roomRef, {
        gameOver: true,
        wasAborted: true,
        winner: opponentWins,
        lastUpdateTime: Date.now()
      });
    } catch (error) {
      console.error("❌ Abort error:", error);
    }
  };

  const resetGame = async () => {
    try {
      const newGame = new Chess();
      await updateDoc(roomRef, {
        gameState: newGame.fen(),
        gameStarted: false,
        gameOver: false,
        wasAborted: false,
        ifTimeout: false,
        winner: null,
        lastMoveSquares: [],
        status: "waiting",
        whiteTime: selectedTime * 60,
        blackTime: selectedTime * 60,
        lastUpdateTime: Date.now()
      });
      
      navigate(`/multiplayer/${roomId}?username=${encodeURIComponent(username)}`);
    } catch (error) {
      console.error("❌ Reset error:", error);
    }
  };

  const opponentName = roomData?.hostPlayer === username ? 
    roomData?.guestPlayer : roomData?.hostPlayer;

  if (!gameStarted) {
    return (
      <div style={styles.waitingContainer}>
        <div>⏳ Waiting for game to start...</div>
        <div>Room: {roomId}</div>
        <div>You are: {playerColor === "w" ? "White" : "Black"}</div>
        <button onClick={() => navigate("/")} style={styles.button}>
          Leave Game
        </button>
      </div>
    );
  }

  // Create display board - always show from white's perspective, but flip pieces for black
  const displayBoard = playerColor === "w" ? 
    board : 
    [...board].reverse().map(row => [...row].reverse());

  return (
    <div className="wrapper">
      <div className="board-section">
        <Timer
          label={playerColor === "b" ? username : (opponentName || "Opponent")}
          time={blackTime}
        />
        
        <div className="board-container">
          {displayBoard.map((rowArr, rowIdx) =>
            rowArr.map((pieceObj, colIdx) => {
              // Adjust coordinates based on player orientation
              const actualRow = playerColor === "w" ? rowIdx : 7 - rowIdx;
              const actualCol = playerColor === "w" ? colIdx : 7 - colIdx;
              return renderSquare(pieceObj, actualRow, actualCol);
            })
          )}
        </div>
        
        <Timer
          label={playerColor === "w" ? username : (opponentName || "Opponent")}
          time={whiteTime}
        />
      </div>

      <div className="controls">
        <h3>Move History</h3>
        <MoveHistory moveHistory={moveHistory} />

        <div style={styles.gameInfo}>
          <p><strong>Room:</strong> <code>{roomId}</code></p>
          <p><strong>You:</strong> {playerColor === "w" ? "White" : "Black"}</p>
          <p><strong>Turn:</strong> {gameRef.current.turn() === "w" ? "White" : "Black"}</p>
          <p style={{
            color: isMyTurn() ? "#4caf50" : "#ff9800",
            fontWeight: "bold"
          }}>
            {isMyTurn() ? 
              "👉 Your turn" : 
              `⏳ ${opponentName || "Opponent"}'s turn`
            }
          </p>
        </div>

        {gameOver && (
          <>
            <StatusBar
              isGameOver={gameOver}
              abort={wasAborted}
              ifTimeout={ifTimeout}
              winner={winner}
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

        {!gameOver && (
          <div style={styles.activeGameButtons}>
            <button className="time-btn" onClick={abortGame}>
              Abort Game
            </button>
            <button className="time-btn" onClick={() => navigate("/")}>
              Leave Game
            </button>
          </div>
        )}
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
    textAlign: "center",
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
};

export default MultiplayerGame;

