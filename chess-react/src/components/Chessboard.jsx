import React, { useState, useEffect } from "react";
import { Chess } from "chess.js";
import Timer from "./Timer";
import StatusBar from "./StatusBar";
import MoveHistory from "./MoveHistory";
import ChessSquare from "./ChessSquare";
import { getBestMoveFromStockfish, initEngine } from "./engine";
import "./Chessboard.css";

const squareName = (row, col) => "abcdefgh"[col] + (8 - row);

const Chessboard = () => {
  const [game, setGame] = useState(new Chess());
  const [selected, setSelected] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [captureTargets, setCaptureTargets] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [whiteTime, setWhiteTime] = useState(0);
  const [blackTime, setBlackTime] = useState(0);
  const [initialTime, setInitialTime] = useState(null);
  const [currentTurn, setCurrentTurn] = useState("w");
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [playAs, setPlayAs] = useState("w");
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [engineScore, setEngineScore] = useState(0);
  const [wasAborted, setWasAborted] = useState(false);

  useEffect(() => {
    initEngine();
  }, []);

  const inCheck = game.inCheck();
  const displayBoard = playAs === "w" ? game.board() : [...game.board()].reverse();

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const interval = setInterval(() => {
      const isPlayersTurn = currentTurn === playAs;

      const updateTime = (setTime, timeoutWinner, winHandler) => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(interval);
            if (!gameOver) {
              setGameOver(true);
              setWinner(timeoutWinner);
              winHandler((score) => score + 1);
            }
            return 0;
          }
          return prevTime - 1;
        });
      };

      if (isPlayersTurn) {
        playAs === "w"
          ? updateTime(setWhiteTime, "Engine (You lost on time)", setEngineScore)
          : updateTime(setBlackTime, "Engine (You lost on time)", setEngineScore);
      } else {
        playAs === "w"
          ? updateTime(setBlackTime, "You (Engine lost on time)", setPlayerScore)
          : updateTime(setWhiteTime, "You (Engine lost on time)", setPlayerScore);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTurn, gameOver, gameStarted, playAs]);

  const startGameWithTime = (minutes) => {
    const seconds = minutes * 60;
    const newGame = new Chess();

    setInitialTime(seconds);
    setWhiteTime(seconds);
    setBlackTime(seconds);
    setGame(newGame);
    setMoveHistory([]);
    setSelected(null);
    setLegalMoves([]);
    setCaptureTargets([]);
    setCurrentTurn("w");
    setGameOver(false);
    setWinner(null);
    setGameStarted(true);
    setWasAborted(false);

    if (playAs === "b") {
      setTimeout(() => makeComputerMove(newGame), 500);
    }
  };

  const makeComputerMove = (currentGame = game) => {
    const fen = currentGame.fen();

    getBestMoveFromStockfish(fen, (uciMove) => {
      if (!uciMove) {
        setGameOver(true);
        setWinner("Draw or Error");
        return;
      }

      const move = currentGame.move({
        from: uciMove.slice(0, 2),
        to: uciMove.slice(2, 4),
        promotion: "q",
      });

      if (move) {
        const newGame = new Chess(currentGame.fen());
        setGame(newGame);
        setMoveHistory((prev) => [...prev, move.san]);
        setCurrentTurn(newGame.turn());

        if (newGame.isGameOver()) {
          const result = newGame.isCheckmate()
            ? newGame.turn() === playAs ? "Engine" : "You"
            : "Draw";
          setGameOver(true);
          setWinner(result);
          if (result === "You") setPlayerScore((s) => s + 1);
          else if (result === "Engine") setEngineScore((s) => s + 1);
        }
      }
    });
  };

  const handleClick = (row, col) => {
    if (!gameStarted || gameOver || game.turn() !== playAs) return;

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
      const move = game.move({ from: selected, to: square, promotion: "q" });

      if (move) {
        const newGame = new Chess(game.fen());
        setGame(newGame);
        setMoveHistory((prev) => [...prev, move.san]);
        setSelected(null);
        setLegalMoves([]);
        setCaptureTargets([]);
        setCurrentTurn(newGame.turn());

        if (newGame.isGameOver()) {
          const result = newGame.isCheckmate()
            ? newGame.turn() === playAs ? "Engine" : "You"
            : "Draw";
          setGameOver(true);
          setWinner(result);
          if (result === "You") setPlayerScore((s) => s + 1);
          else if (result === "Engine") setEngineScore((s) => s + 1);
        } else if (newGame.turn() !== playAs) {
          setTimeout(() => makeComputerMove(newGame), 500);
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
    setWinner("Engine");
    setEngineScore((s) => s + 1);
  };

  const renderSquare = (pieceObj, row, col) => {
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
  };

  return (
    <div className="wrapper">
      <div className="board-section">
        <Timer
          label={`Engine (${engineScore})`}
          time={playAs === "w" ? blackTime : whiteTime}
        />
        <div className="board-container">
          {displayBoard.flat().map((pieceObj, i) =>
            renderSquare(pieceObj, Math.floor(i / 8), i % 8)
          )}
        </div>
        <Timer
          label={`You (${playerScore})`}
          time={playAs === "w" ? whiteTime : blackTime}
        />
      </div>

      <div className="controls">
        <h3>Move History</h3>
        <MoveHistory moveHistory={moveHistory} />

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
