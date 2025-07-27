// src/hooks/useMultiplayerGame.jsx
import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { firestore } from "../utils/firebase";
import { v4 as uuidv4 } from "uuid";

const useMultiplayerGame = (roomId, playerColor, selectedTime) => {
  const gameRef = doc(firestore, "rooms", roomId);
  const [game, setGame] = useState(new Chess());
  const [moves, setMoves] = useState([]);
  const [turn, setTurn] = useState("w");
  const [status, setStatus] = useState("waiting");
  const [whiteTime, setWhiteTime] = useState(selectedTime * 60);
  const [blackTime, setBlackTime] = useState(selectedTime * 60);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [players, setPlayers] = useState({});
  const [lastMove, setLastMove] = useState(null);
  const [lastMoveTimestamp, setLastMoveTimestamp] = useState(Date.now());
  const [rematch, setRematch] = useState({});
  const uidRef = useRef(uuidv4());

  useEffect(() => {
    const init = async () => {
      const snapshot = await getDoc(gameRef);
      const data = snapshot.data();

      if (!snapshot.exists()) {
        const initialState = {
          fen: new Chess().fen(),
          moves: [],
          turn: "w",
          status: "waiting",
          players: { [playerColor]: uidRef.current },
          timers: {
            w: selectedTime * 60,
            b: selectedTime * 60,
          },
          lastMoveTimestamp: Date.now(),
          rematch: {},
        };
        await setDoc(gameRef, initialState);
        setPlayers(initialState.players);
      } else {
        const players = data.players || {};
        if (!players[playerColor]) {
          players[playerColor] = uidRef.current;
          await updateDoc(gameRef, { players });
        }

        if (Object.keys(players).length === 2 && data.status !== "active") {
          await updateDoc(gameRef, { status: "active" });
        }
      }
    };

    init();
  }, [roomId, playerColor]);

  useEffect(() => {
    const unsubscribe = onSnapshot(gameRef, (docSnap) => {
      const data = docSnap.data();
      if (!data) return;

      const g = new Chess();
      g.load(data.fen);
      setGame(g);

      const now = Date.now();
      const timeSinceLastMove = Math.floor((now - (data.lastMoveTimestamp || now)) / 1000);

      let white = data.timers?.w ?? selectedTime * 60;
      let black = data.timers?.b ?? selectedTime * 60;

      if (data.status === "active" && !g.isGameOver()) {
        if (data.turn === "w") {
          white = Math.max(0, white - timeSinceLastMove);
        } else {
          black = Math.max(0, black - timeSinceLastMove);
        }
      }

      setMoves(data.moves || []);
      setTurn(data.turn || "w");
      setStatus(data.status || "waiting");
      setPlayers(data.players || {});
      setWhiteTime(white);
      setBlackTime(black);
      setLastMoveTimestamp(data.lastMoveTimestamp || now);
      setLastMove(data.moves?.length ? data.moves[data.moves.length - 1] : null);
      setRematch(data.rematch || {});

      const over = g.isGameOver();
      setGameOver(over);

      if (over) {
        if (g.isCheckmate()) {
          setWinner(g.turn() === "w" ? "Black" : "White");
        } else {
          setWinner("Draw");
        }
      }

      if (data.status === "resigned") {
        setGameOver(true);
        setWinner(data.winner);
      }
    });

    return () => unsubscribe();
  }, []);

  const makeMove = async ({ from, to, promotion }) => {
    const newGame = new Chess(game.fen());
    const moveObj = newGame.move({ from, to, promotion });

    if (!moveObj) return;

    const now = Date.now();
    const timeElapsed = Math.floor((now - lastMoveTimestamp) / 1000);

    const updatedTimers = {
      w: turn === "w" ? Math.max(0, whiteTime - timeElapsed) : whiteTime,
      b: turn === "b" ? Math.max(0, blackTime - timeElapsed) : blackTime,
    };

    const newMoves = [
      ...moves,
      {
        from,
        to,
        san: moveObj.san,
        color: moveObj.color,
      },
    ];

    await updateDoc(gameRef, {
      fen: newGame.fen(),
      moves: newMoves,
      turn: newGame.turn(),
      timers: updatedTimers,
      lastMoveTimestamp: now,
    });
  };

  const resetGame = async () => {
    const newGame = new Chess();
    await updateDoc(gameRef, {
      fen: newGame.fen(),
      moves: [],
      turn: "w",
      timers: {
        w: selectedTime * 60,
        b: selectedTime * 60,
      },
      status: "active",
      lastMoveTimestamp: Date.now(),
    });
  };

  const resignGame = async (color) => {
    const winnerColor = color === "w" ? "Black" : "White";
    await updateDoc(gameRef, {
      status: "resigned",
      winner: winnerColor,
    });
  };

  const requestRematch = async (color) => {
    const snapshot = await getDoc(gameRef);
    const currentRematch = snapshot.data().rematch || {};
    await updateDoc(gameRef, {
      rematch: { ...currentRematch, [color]: true },
    });
  };

  const clearRematchRequests = async () => {
    await updateDoc(gameRef, { rematch: {} });
  };

  return {
    game,
    makeMove,
    moves,
    turn,
    status,
    whiteTime,
    blackTime,
    gameOver,
    setGameOver,
    winner,
    setWinner,
    players,
    resetGame,
    lastMove,
    lastMoveTimestamp,
    resignGame,
    requestRematch,
    clearRematchRequests,
    rematch,
  };
};

export default useMultiplayerGame;
