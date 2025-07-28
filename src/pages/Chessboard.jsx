// Chessboard.jsx (Updated to Use Username from URL)
import React from "react";
import { useSearchParams } from "react-router-dom";
import Timer from "../components/Timer";
import StatusBar from "../components/StatusBar";
import MoveHistory from "../components/MoveHistory";
import ChessSquare from "../components/ChessSquare";
import useChessGame from "../hooks/useChessGame";
import "../styles/Chessboard.css";
import TimeBar from "../components/TimeBar";
import ScoreBox from "../components/ScoreBox";

const squareName = (row, col) => "abcdefgh"[col] + (8 - row);

const Chessboard = () => {
  const [searchParams] = useSearchParams();
  const username = searchParams.get("username") || "You";

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
    handleClick,
    resetGame,
    abortGame,
    setPlayAs,
    setSelectedTime,
    startGameWithTime,
    initialTime,
  } = useChessGame();

  const renderSquare = (pieceObj, row, col) => {
    const trueRow = playAs === "w" ? row : 7 - row;
    const square = squareName(trueRow, col);
    const isDark = (trueRow + col) % 2 === 1;
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

  return (
    <div className="wrapper">
      <div className="board-section">
        <ScoreBox label="Engine" value={engineScore} />
        <div className="board-container">
          {board.flat().map((pieceObj, i) =>
            renderSquare(pieceObj, Math.floor(i / 8), i % 8)
          )}
        </div>
        <ScoreBox label={username} value={playerScore} />
      </div>

      <div className="controls">
        <h3>Move History</h3>
        <MoveHistory moveHistory={moveHistory} />
        <TimeBar
          label="Your Time"
          time={playAs === "w" ? whiteTime : blackTime}
          initialTime={initialTime}
        />

        {!gameStarted && (
          <div className="options">
            <button
              className={`time-btn ${playAs === "w" ? "selected-color" : ""}`}
              onClick={() => setPlayAs("w")}
            >
              White
            </button>
            <button
              className={`time-btn ${playAs === "b" ? "selected-color" : ""}`}
              onClick={() => setPlayAs("b")}
            >
              Black
            </button>
            {[1, 3, 5, 10].map((min) => (
              <button
                key={min}
                className={`time-btn ${
                  selectedTime === min ? "selected-time" : ""
                }`}
                onClick={() => setSelectedTime(min)}
              >
                {min} min
              </button>
            ))}
            <button
              className="start-btn"
              onClick={() => selectedTime && startGameWithTime(selectedTime)}
              disabled={!selectedTime}
            >
              Start Game
            </button>
          </div>
        )}

        {gameOver && (
          <>
            <button className="time-btn" onClick={resetGame}>
              Play Again
            </button>
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

export default Chessboard;