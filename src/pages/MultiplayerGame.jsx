// src/pages/MultiplayerGame.jsx
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import useMultiplayerGame from "../hooks/useMultiplayerGame";
import StatusBar from "../components/StatusBar";
import Timer from "../components/Timer";
import MoveHistory from "../components/MoveHistory";
import ChessSquare from "../components/ChessSquare";
import "../styles/Chessboard.css";

const squareName = (row, col) => "abcdefgh"[col] + (8 - row);

const MultiplayerGame = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const colorParam = searchParams.has("w") ? "w" : searchParams.has("b") ? "b" : null;
  const playerColor = colorParam;
  const selectedTime = parseInt(searchParams.get("time")) || 3;

  if (!roomId || !playerColor) {
    return <div>Error: Invalid game link or color not specified.</div>;
  }

  const {
    game,
    makeMove,
    moves = [],
    turn,
    status,
    whiteTime,
    blackTime,
    setGameOver,
    gameOver,
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
  } = useMultiplayerGame(roomId, playerColor, selectedTime);

  const [selected, setSelected] = useState({ from: null, to: null });
  const [legalMoves, setLegalMoves] = useState([]);
  const [localWhiteTime, setLocalWhiteTime] = useState(whiteTime);
  const [localBlackTime, setLocalBlackTime] = useState(blackTime);

  const isPlayerTurn = turn === playerColor && status === "active" && !gameOver;

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const ts = lastMoveTimestamp || now;
      const elapsed = Math.floor((now - ts) / 1000);

      const white = typeof whiteTime === "number" ? whiteTime : selectedTime * 60;
      const black = typeof blackTime === "number" ? blackTime : selectedTime * 60;

      setLocalWhiteTime(turn === "w" ? Math.max(0, white - elapsed) : white);
      setLocalBlackTime(turn === "b" ? Math.max(0, black - elapsed) : black);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastMoveTimestamp, whiteTime, blackTime, turn]);

  useEffect(() => {
    if (rematch?.w && rematch?.b) {
      clearRematchRequests();
      resetGame();
    }
  }, [rematch]);

  const handleSquareClick = (square) => {
    if (!isPlayerTurn) return;
    const piece = game.get(square);

    if (!selected.from) {
      if (piece && piece.color === playerColor) {
        setSelected({ from: square });
        const moves = game.moves({ square, verbose: true });
        setLegalMoves(moves.map((m) => m.to));
      }
    } else {
      if (legalMoves.includes(square)) {
        makeMove({ from: selected.from, to: square, promotion: "q" });
      }
      setSelected({ from: null });
      setLegalMoves([]);
    }
  };

  const handleRematch = () => {
    requestRematch(playerColor);
  };

  const handleResign = () => {
    resignGame(playerColor);
  };

  const renderBoard = () => {
    return (
      <div className="board-container">
        {Array.from({ length: 8 }).flatMap((_, row) =>
          Array.from({ length: 8 }).map((_, col) => {
            const trueRow = playerColor === "w" ? row : 7 - row;
            const trueCol = playerColor === "w" ? col : 7 - col;
            const square = squareName(trueRow, trueCol);
            const piece = game.get(square);
            const isDark = (trueRow + trueCol) % 2 === 1;
            const isSelected = selected.from === square;
            const isLastMove = lastMove && (lastMove.from === square || lastMove.to === square);
            const isLegal = legalMoves.includes(square);

            return (
              <ChessSquare
                key={square}
                square={square}
                pieceObj={piece}
                isDark={isDark}
                isSelected={isSelected}
                isLastMove={isLastMove}
                isLegal={isLegal}
                onClick={() => handleSquareClick(square)}
              />
            );
          })
        )}
      </div>
    );
  };

  const renderStatusBar = () => {
    if (status === "waiting") {
      return <div className="status-bar">⏳ Waiting for opponent to join...</div>;
    }
    return (
      <StatusBar
        isGameOver={gameOver}
        winner={winner}
        turn={turn}
        isPlayerTurn={isPlayerTurn}
      />
    );
  };

  return (
    <div className="wrapper">
      <div className="board-section">
        {playerColor === "w" ? (
          <>
            <Timer label="Black" time={localBlackTime} />
            {renderBoard()}
            <Timer label="White" time={localWhiteTime} />
          </>
        ) : (
          <>
            <Timer label="White" time={localWhiteTime} />
            {renderBoard()}
            <Timer label="Black" time={localBlackTime} />
          </>
        )}
      </div>

      <div className="controls">
        <h3>Move History</h3>
        <MoveHistory moveHistory={moves} />
        {renderStatusBar()}

        <div style={{ marginTop: "1rem" }}>
          {!gameOver && (
            <button onClick={handleResign} className="start-btn">
              🏳️ Resign
            </button>
          )}
          {gameOver && (
            <button onClick={handleRematch} className="start-btn">
              🔁 {rematch[playerColor] ? "Waiting for Opponent..." : "Request Rematch"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiplayerGame;
