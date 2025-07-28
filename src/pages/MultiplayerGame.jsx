import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { firestore } from "../utils/firebase";

import useMultiplayerGame from "../hooks/useMultiplayerGame";
import ChessSquare from "../components/ChessSquare";
import MoveHistory from "../components/MoveHistory";
import Timer from "../components/Timer";
import ScoreBox from "../components/ScoreBox";
import StatusBar from "../components/StatusBar";
import "../styles/Chessboard.css";

const squareName = (row, col) => "abcdefgh"[col] + (8 - row);

const MultiplayerGame = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const playerColor = searchParams.get("color");
  const selectedTime = parseInt(searchParams.get("time"), 10) || 3;
  const username = searchParams.get("username") || "You";

  if (!roomId) {
    return <div style={{ color: "red", textAlign: "center" }}>❌ Missing game ID in URL.</div>;
  }

  if (playerColor !== "w" && playerColor !== "b") {
    return <div style={{ color: "red", textAlign: "center" }}>❌ Invalid or missing player color in link.</div>;
  }

  const [opponent, setOpponent] = useState(null);
  const [roomError, setRoomError] = useState(false);
  const [playersReady, setPlayersReady] = useState(false);
  const roomRef = doc(firestore, "rooms", roomId);

  const {
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
  } = useMultiplayerGame(roomId, playerColor, username, selectedTime);

  useEffect(() => {
    const unsub = onSnapshot(roomRef, (snapshot) => {
      const data = snapshot.data();
      if (!data) {
        setRoomError(true);
        return;
      }
      const oppKey = playerColor === "w" ? "blackPlayer" : "whitePlayer";
      const oppName = data[oppKey];
      if (oppName) setOpponent(oppName);
      if (data.whitePlayer && data.blackPlayer) setPlayersReady(true);
    });
    return () => unsub();
  }, [playerColor, roomRef]);

  const renderSquare = (pieceObj, row, col) => {
    const trueRow = playerColor === "w" ? row : 7 - row;
    const trueCol = playerColor === "w" ? col : 7 - col;

    const square = squareName(trueRow, trueCol);
    const isDark = (trueRow + trueCol) % 2 === 1;
    const isSelected = selected === square;
    const isCapture = captureTargets.includes(square);
    const isLegal = legalMoves.includes(square);
    const isInCheck =
      inCheck && pieceObj?.type === "k" && pieceObj?.color === game.turn();
    const isLastMove = lastMoveSquares.includes(square);

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
    );
  };

  if (roomError) {
    return <div style={{ color: "red", textAlign: "center" }}>❌ Room not found or deleted.</div>;
  }

  return (
    <div className="wrapper">
      <div className="board-section">
        <Timer
          label={playerColor === "w" ? username : opponent || "Waiting..."}
          time={playerColor === "w" ? whiteTime : blackTime}
        />
        <div className="board-container">
          {board?.map((rowArr, rowIdx) =>
            rowArr.map((pieceObj, colIdx) =>
              renderSquare(pieceObj, rowIdx, colIdx)
            )
          )}
        </div>
        <Timer
          label={playerColor === "b" ? username : opponent || "Waiting..."}
          time={playerColor === "b" ? whiteTime : blackTime}
        />
      </div>

      <div className="controls">
        <h3>Move History</h3>
        <MoveHistory moveHistory={moveHistory} />

        {!gameStarted && playersReady && (
          <button className="start-btn" onClick={startGame}>
            Start Game
          </button>
        )}

        {!playersReady && (
          <div className="waiting-msg">Waiting for opponent to join...</div>
        )}

        {gameOver && (
          <>
            <button className="time-btn" onClick={resetGame}>Play Again</button>
            <StatusBar
              isGameOver={gameOver}
              abort={wasAborted}
              ifTimeout={ifTimeout}
              game={game}
              winner={winner}
            />
          </>
        )}

        {gameStarted && !gameOver && (
          <button className="time-btn" onClick={abortGame}>
            Abort
          </button>
        )}
      </div>
    </div>
  );
};

export default MultiplayerGame;
