// Updated Chessboard.jsx with Abort working as loss, winner shown properly, move lock after game over, and scoring implemented
import React, { useState, useEffect } from "react";
import { Chess } from "chess.js";
import Timer from "./Timer";
import StatusBar from "./StatusBar";
import MoveHistory from "./MoveHistory";
import ChessSquare from "./ChessSquare";
import "./Chessboard.css";

const squareName = (row, col) => "abcdefgh"[col] + (8 - row);

const Chessboard = () => {
  const [initialTime, setInitialTime] = useState(null);
  const [game, setGame] = useState(new Chess());
  const [selected, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [captureTargets, setCaptureTargets] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [whiteTime, setWhiteTime] = useState(0);
  const [blackTime, setBlackTime] = useState(0);
  const [currentTurn, setCurrentTurn] = useState("w");
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [playAs, setPlayAs] = useState("w");
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [engineScore, setEngineScore] = useState(0);
  const [wasAborted, setWasAborted] = useState(false);

  const board = game.board();
  const inCheck = game.inCheck();
  const isGameOver = gameOver;
  const displayBoard = playAs === "w" ? board : [...board].reverse();
  const AbortButton = gameStarted && !isGameOver;

  useEffect(() => {
    if (!gameStarted || isGameOver) return;
    const interval = setInterval(() => {
      if (currentTurn === "w") {
        setWhiteTime((t) => {
          if (t <= 1) {
            setGameOver(true);
            setWinner("Endgame Engine (Black wins by timeout)");
            setEngineScore((score) => score + 1);
            return 0;
          }
          return t - 1;
        });
      } else {
        setBlackTime((t) => {
          if (t <= 1) {
            setGameOver(true);
            setWinner("You (White wins by timeout)");
            setPlayerScore((score) => score + 1);
            return 0;
          }
          return t - 1;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [currentTurn, isGameOver, gameStarted]);

  const startGameWithTime = (minutes) => {
    const seconds = minutes * 60;
    setInitialTime(seconds);
    setWhiteTime(seconds);
    setBlackTime(seconds);
    setGame(new Chess());
    setMoveHistory([]);
    setSelected(null);
    setLegalMoves([]);
    setCaptureTargets([]);
    setCurrentTurn("w");
    setGameOver(false);
    setWinner(null);
    setGameStarted(true);
    setWasAborted(false);
  };

  const handleClick = (row, col) => {
    if (!gameStarted || gameOver) return;

    const trueRow = playAs === "w" ? row : 7 - row;
    const square = squareName(trueRow, col);
    const piece = game.get(square);

    if (piece && piece.color === game.turn()) {
      setSelected(square);
      const moves = game.moves({ square, verbose: true });
      setLegalMoves(moves.map((m) => m.to));
      setCaptureTargets(moves.filter((m) => m.captured).map((m) => m.to));
      return;
    }

    if (selected) {
      if (selected === square) {
        setSelected(null);
        setLegalMoves([]);
        setCaptureTargets([]);
        return;
      }

      const possibleMoves = game.moves({ verbose: true });
      const isPromotion = possibleMoves.some(
        (m) => m.from === selected && m.to === square && m.promotion
      );

      const move = game.move({
        from: selected,
        to: square,
        promotion: isPromotion ? "q" : undefined
      });

      if (move) {
        setGame(new Chess(game.fen()));
        setMoveHistory((prev) => [...prev, move.san]);
        setSelected(null);
        setLegalMoves([]);
        setCaptureTargets([]);
        setCurrentTurn(game.turn());

        if (game.isGameOver()) {
          setGameOver(true);
          const result = game.isCheckmate()
            ? game.turn() === "w"
              ? "Endgame Engine (Black wins by checkmate)"
              : "You (White wins by checkmate)"
            : "Draw";
          setWinner(result);
          if (result.includes("You")) setPlayerScore((score) => score + 1);
          else if (result.includes("Endgame Engine")) setEngineScore((score) => score + 1);
        }
      } else {
        setSelected(null);
        setLegalMoves([]);
        setCaptureTargets([]);
      }
    }
  };

  const resetGame = () => {
    setGame(new Chess());
    setSelected(null);
    setLegalMoves([]);
    setCaptureTargets([]);
    setMoveHistory([]);
    setWhiteTime(initialTime);
    setBlackTime(initialTime);
    setCurrentTurn("w");
    setGameOver(false);
    setWinner(null);
    setGameStarted(false);
    setSelectedTime(null);
    setWasAborted(false);
  };

  const abortGame = () => {
    setWasAborted(true);
    setGameOver(true);

    const opponentWins =
      playAs === "w"
        ? "Endgame Engine (Black wins by abort)"
        : "Endgame Engine (White wins by abort)"; // Corrected for black player

    setWinner(opponentWins);
    setEngineScore((score) => score + 1); // Always engine wins on abort
  };

  return (
    <div className="wrapper">
      <div className="board-section">
        <Timer label={`Endgame Engine (${engineScore})`} time={blackTime} />
        <div className="board-container">
          {displayBoard.flat().map((pieceObj, i) => {
            const row = Math.floor(i / 8);
            const col = i % 8;
            const trueRow = playAs === "w" ? row : 7 - row;
            const square = squareName(trueRow, col);
            const isDark = (trueRow + col) % 2 === 1;
            const isSelected = selected === square;
            const isCapture = captureTargets.includes(square);
            const isLegal = legalMoves.includes(square);
            const isInCheck =
              inCheck && pieceObj?.type === "k" && pieceObj?.color === game.turn();

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
                onClick={() => handleClick(row, col)}
              />
            );
          })}
        </div>
        <Timer label={`You (${playerScore})`} time={whiteTime} />
      </div>

      <div className="controls">
        <h3>Move History</h3>
        <MoveHistory moveHistory={moveHistory} />

        {!gameStarted && (
          <div className="options">
            <button className={`time-btn ${playAs === "w" ? "selected-color" : ""}`} onClick={() => setPlayAs("w")}>White</button>
            <button className={`time-btn ${playAs === "b" ? "selected-color" : ""}`} onClick={() => setPlayAs("b")}>Black</button>
            <button className={`time-btn ${selectedTime === 3 ? "selected-time" : ""}`} onClick={() => setSelectedTime(3)}>3 min</button>
            <button className={`time-btn ${selectedTime === 5 ? "selected-time" : ""}`} onClick={() => setSelectedTime(5)}>5 min</button>
            <button className={`time-btn ${selectedTime === 10 ? "selected-time" : ""}`} onClick={() => setSelectedTime(10)}>10 min</button>
            <button className={`time-btn ${selectedTime === 30 ? "selected-time" : ""}`} onClick={() => setSelectedTime(30)}>30 min</button>
            <button className="start-btn" onClick={() => selectedTime && startGameWithTime(selectedTime)} disabled={!selectedTime}>Start Game</button>
          </div>
        )}

        {isGameOver && (
          <button className="time-btn" onClick={resetGame}>Play Again</button>
        )}

        {AbortButton && (
          <button className="time-btn" onClick={abortGame}>Abort</button>
        )}

        {isGameOver && (
          <StatusBar isGameOver={isGameOver} abort={wasAborted} game={game} winner={winner} />
        )}
      </div>
    </div>
  );
};

export default Chessboard;
