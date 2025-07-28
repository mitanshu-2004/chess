// src/hooks/useMultiplayerGame.jsx
import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { firestore } from "../utils/firebase";

const useMultiplayerGame = (roomId, playerColor, username, selectedTime) => {
  const [game] = useState(new Chess());
  const [board, setBoard] = useState(game.board());
  const [selected, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [captureTargets, setCaptureTargets] = useState([]);
  const [lastMoveSquares, setLastMoveSquares] = useState([]);
  const [inCheck, setInCheck] = useState(false);

  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);

  const [gameOver, setGameOver] = useState(false);
  const [wasAborted, setWasAborted] = useState(false);
  const [ifTimeout, setIfTimeout] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState(null);

  const [moveHistory, setMoveHistory] = useState([]);

  const [whiteTime, setWhiteTime] = useState(selectedTime * 60);
  const [blackTime, setBlackTime] = useState(selectedTime * 60);
  const intervalRef = useRef(null);

  const roomRef = doc(firestore, "rooms", roomId);

  // Handle remote game updates
  useEffect(() => {
    const unsub = onSnapshot(roomRef, (snapshot) => {
      const data = snapshot.data();
      if (!data || !data.gameState) return;

      game.load(data.gameState);

      setBoard(game.board());
      setMoveHistory(game.history({ verbose: true }));
      setGameStarted(data.gameStarted || false);
      setGameOver(data.gameOver || false);
      setWasAborted(data.wasAborted || false);
      setIfTimeout(data.ifTimeout || false);
      setWinner(data.winner || null);
      setLastMoveSquares(data.lastMoveSquares || []);
      setWhiteTime(data.whiteTime || selectedTime * 60);
      setBlackTime(data.blackTime || selectedTime * 60);
    });

    return () => unsub();
  }, [roomId]);

  // Timer updates
  useEffect(() => {
    if (!gameStarted || gameOver) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const turn = game.turn();
      if (turn === "w") {
        setWhiteTime((t) => {
          if (t <= 0) {
            handleTimeout("b");
            return 0;
          }
          return t - 1;
        });
      } else {
        setBlackTime((t) => {
          if (t <= 0) {
            handleTimeout("w");
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [gameStarted, gameOver]);

  const handleTimeout = async (winnerColor) => {
    setGameOver(true);
    setIfTimeout(true);
    setWinner(winnerColor);
    await updateDoc(roomRef, {
      gameOver: true,
      ifTimeout: true,
      winner: winnerColor,
    });
  };

  const handleClick = async (row, col) => {
    if (gameOver || !gameStarted) return;
    const square = "abcdefgh"[col] + (8 - row);
    const piece = game.get(square);

    if (!selected) {
      if (piece && piece.color === playerColor) {
        const moves = game.moves({ square, verbose: true });
        setLegalMoves(moves.map((m) => m.to));
        setCaptureTargets(
          moves.filter((m) => m.flags.includes("c")).map((m) => m.to)
        );
        setSelected(square);
      }
      return;
    }

    if (square === selected) {
      setSelected(null);
      setLegalMoves([]);
      setCaptureTargets([]);
      return;
    }

    const move = game.move({ from: selected, to: square, promotion: "q" });
    if (move) {
      setBoard(game.board());
      setMoveHistory(game.history({ verbose: true }));
      setSelected(null);
      setLegalMoves([]);
      setCaptureTargets([]);
      setLastMoveSquares([move.from, move.to]);
      setInCheck(game.in_check());

      await updateDoc(roomRef, {
        gameState: game.fen(),
        lastMoveSquares: [move.from, move.to],
      });
    }
  };

  const startGame = async () => {
    await updateDoc(roomRef, {
      gameStarted: true,
      gameState: game.fen(),
      whiteTime: selectedTime * 60,
      blackTime: selectedTime * 60,
    });
  };

  const resetGame = async () => {
    game.reset();
    setBoard(game.board());
    setSelected(null);
    setLegalMoves([]);
    setCaptureTargets([]);
    setInCheck(false);
    setGameOver(false);
    setWasAborted(false);
    setIfTimeout(false);
    setWinner(null);
    setMoveHistory([]);
    setWhiteTime(selectedTime * 60);
    setBlackTime(selectedTime * 60);

    await updateDoc(roomRef, {
      gameStarted: false,
      gameOver: false,
      wasAborted: false,
      ifTimeout: false,
      winner: null,
      lastMoveSquares: [],
      gameState: game.fen(),
      whiteTime: selectedTime * 60,
      blackTime: selectedTime * 60,
    });
  };

  const abortGame = async () => {
    setWasAborted(true);
    setGameOver(true);
    await updateDoc(roomRef, {
      gameOver: true,
      wasAborted: true,
    });
  };

  return {
    game,
    board,
    selected,
    legalMoves,
    captureTargets,
    inCheck,
    playerScore,
    opponentScore,
    gameOver,
    winner,
    gameStarted,
    whiteTime,
    blackTime,
    moveHistory,
    lastMoveSquares,
    handleClick,
    resetGame,
    abortGame,
    startGame,
    wasAborted,
    ifTimeout,
  };
};

export default useMultiplayerGame;
