// src/hooks/useRealtimeChess.js - Completely new approach
import { useState, useEffect, useRef, useCallback } from "react";
import { Chess } from "chess.js";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { firestore } from "../utils/firebase";

const useRealtimeChess = (roomId, playerColor, username, timeLimit) => {
  // Game state
  const [gameState, setGameState] = useState({
    fen: new Chess().fen(),
    board: new Chess().board(),
    turn: "w",
    history: [],
    isCheck: false,
    isGameOver: false,
    winner: null
  });

  // UI state
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [captureSquares, setCaptureSquares] = useState([]);
  const [lastMove, setLastMove] = useState([]);

  // Room state
  const [roomInfo, setRoomInfo] = useState(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isMyTurn, setIsMyTurn] = useState(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState({
    white: timeLimit * 60,
    black: timeLimit * 60
  });

  // Refs
  const gameInstance = useRef(new Chess());
  const timerInterval = useRef(null);
  const roomRef = useRef(doc(firestore, "rooms", roomId));
  const isProcessingMove = useRef(false);

  // Create game instance from FEN
  const createGameFromFen = useCallback((fen) => {
    try {
      const game = new Chess();
      game.load(fen);
      return game;
    } catch (error) {
      console.error("Invalid FEN:", error);
      return new Chess();
    }
  }, []);

  // Update game state from Firebase
  const updateGameFromFirebase = useCallback((data) => {
    if (!data) return;

    console.log("🔄 Updating from Firebase:", data);
    
    const game = createGameFromFen(data.gameState || new Chess().fen());
    gameInstance.current = game;

    setGameState({
      fen: game.fen(),
      board: game.board(),
      turn: game.turn(),
      history: game.history(),
      isCheck: game.inCheck(),
      isGameOver: game.isGameOver(),
      winner: data.winner || null
    });

    setRoomInfo(data);
    setIsGameStarted(data.gameStarted || false);
    setIsMyTurn(game.turn() === playerColor && data.gameStarted && !game.isGameOver());
    setLastMove(data.lastMove || []);
    
    setTimeLeft({
      white: data.whiteTime || timeLimit * 60,
      black: data.blackTime || timeLimit * 60
    });

    // Clear selection when game updates
    setSelectedSquare(null);
    setPossibleMoves([]);
    setCaptureSquares([]);
  }, [playerColor, timeLimit, createGameFromFen]);

  // Firebase listener
  useEffect(() => {
    console.log("🔌 Setting up Firebase listener");
    
    const unsubscribe = onSnapshot(
      roomRef.current,
      (snapshot) => {
        if (snapshot.exists()) {
          updateGameFromFirebase(snapshot.data());
        } else {
          console.error("Room does not exist");
        }
      },
      (error) => {
        console.error("Firebase listener error:", error);
      }
    );

    return () => {
      console.log("🔌 Cleaning up Firebase listener");
      unsubscribe();
    };
  }, [updateGameFromFirebase]);

  // Timer logic
  useEffect(() => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }

    if (!isGameStarted || gameState.isGameOver || !isMyTurn) {
      return;
    }

    console.log("⏰ Starting timer for", playerColor);

    timerInterval.current = setInterval(async () => {
      const currentTime = playerColor === "w" ? timeLeft.white : timeLeft.black;
      const newTime = Math.max(0, currentTime - 1);

      // Update local state immediately
      setTimeLeft(prev => ({
        ...prev,
        [playerColor === "w" ? "white" : "black"]: newTime
      }));

      // Update Firebase every 5 seconds or when time runs out
      if (newTime % 5 === 0 || newTime === 0) {
        try {
          const updateData = {
            [playerColor === "w" ? "whiteTime" : "blackTime"]: newTime
          };

          if (newTime === 0) {
            updateData.gameOver = true;
            updateData.winner = playerColor === "w" ? "Black" : "White";
            updateData.timeoutWinner = true;
          }

          await updateDoc(roomRef.current, updateData);
        } catch (error) {
          console.error("Timer update error:", error);
        }
      }
    }, 1000);

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [isGameStarted, gameState.isGameOver, isMyTurn, timeLeft, playerColor]);

  // Make move function
  const makeMove = useCallback(async (from, to) => {
    if (!isMyTurn || isProcessingMove.current) {
      return false;
    }

    isProcessingMove.current = true;

    try {
      const game = new Chess(gameState.fen);
      const move = game.move({ from, to, promotion: "q" });

      if (!move) {
        console.log("Invalid move");
        return false;
      }

      console.log("✅ Valid move:", move.san);

      // Determine game end
      let winner = null;
      let gameOver = false;

      if (game.isGameOver()) {
        gameOver = true;
        if (game.isCheckmate()) {
          winner = game.turn() === "w" ? "Black" : "White";
        } else {
          winner = "Draw";
        }
      }

      // Update Firebase
      await updateDoc(roomRef.current, {
        gameState: game.fen(),
        lastMove: [from, to],
        gameOver,
        winner,
        lastMoveTime: Date.now()
      });

      return true;
    } catch (error) {
      console.error("Move error:", error);
      return false;
    } finally {
      isProcessingMove.current = false;
    }
  }, [isMyTurn, gameState.fen]);

  // Handle square click
  const handleSquareClick = useCallback((square) => {
    if (!isMyTurn) return;

    const piece = gameInstance.current.get(square);

    // If no piece selected
    if (!selectedSquare) {
      if (piece && piece.color === playerColor) {
        setSelectedSquare(square);
        const moves = gameInstance.current.moves({ square, verbose: true });
        setPossibleMoves(moves.map(m => m.to));
        setCaptureSquares(moves.filter(m => m.captured).map(m => m.to));
      }
      return;
    }

    // If clicking same square, deselect
    if (square === selectedSquare) {
      setSelectedSquare(null);
      setPossibleMoves([]);
      setCaptureSquares([]);
      return;
    }

    // Try to make move
    makeMove(selectedSquare, square).then(success => {
      if (success) {
        setSelectedSquare(null);
        setPossibleMoves([]);
        setCaptureSquares([]);
      }
    });
  }, [isMyTurn, selectedSquare, playerColor, makeMove]);

  // Abort game
  const abortGame = useCallback(async () => {
    try {
      await updateDoc(roomRef.current, {
        gameOver: true,
        winner: playerColor === "w" ? "Black" : "White",
        aborted: true
      });
    } catch (error) {
      console.error("Abort error:", error);
    }
  }, [playerColor]);

  // Reset game
  const resetGame = useCallback(async () => {
    try {
      const newGame = new Chess();
      await updateDoc(roomRef.current, {
        gameState: newGame.fen(),
        gameStarted: false,
        gameOver: false,
        winner: null,
        aborted: false,
        timeoutWinner: false,
        lastMove: [],
        whiteTime: timeLimit * 60,
        blackTime: timeLimit * 60
      });
    } catch (error) {
      console.error("Reset error:", error);
    }
  }, [timeLimit]);

  return {
    // Game state
    gameState,
    selectedSquare,
    possibleMoves,
    captureSquares,
    lastMove,
    
    // Room state
    roomInfo,
    isGameStarted,
    isMyTurn,
    timeLeft,
    
    // Actions
    handleSquareClick,
    abortGame,
    resetGame
  };
};

export default useRealtimeChess;