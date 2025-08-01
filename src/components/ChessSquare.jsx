"use client"
import { COLORS } from "../utils/colors"

const ChessSquare = ({ square, pieceObj, isDark, isSelected, isCapture, isLegal, isInCheck, isLastMove, onClick }) => {
  const pieceSymbols = {
    wp: "♙",
    wr: "♖",
    wn: "♘",
    wb: "♗",
    wq: "♕",
    wk: "♔",
    bp: "♟",
    br: "♜",
    bn: "♞",
    bb: "♝",
    bq: "♛",
    bk: "♚",
  }

  const pieceSymbol = pieceObj ? pieceSymbols[`${pieceObj.color}${pieceObj.type}`] : ""
  const pieceImg = pieceObj
    ? `https://chessboardjs.com/img/chesspieces/wikipedia/${pieceObj.color}${pieceObj.type.toUpperCase()}.png`
    : null

  const classNames = [
    "square",
    isDark ? "dark" : "light",
    isSelected ? "selected" : "",
    isInCheck ? "in-check" : "",
    isLastMove ? "last-move" : "",
  ]
    .filter(Boolean)
    .join(" ")

  const styles = `
    .square {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      position: relative;
      aspect-ratio: 1 / 1;
      user-select: none; cursor: pointer;
      transition: background-color 0.25s ease;
      box-sizing: border-box;
    }
    .dark { background-color: ${COLORS.squareDark}; }
    .light { background-color: ${COLORS.squareLight}; }
    .selected { outline: 3px solid ${COLORS.selectedBorder}; outline-offset: -3px; }
    .in-check { background-color: ${COLORS.checkBg} !important; }
    .last-move::after {
      content: "";
      position: absolute; top: 0; left: 0;
      width: 100%; height: 100%;
      background-color: ${COLORS.lastMoveBg};
      border: 2px solid rgba(255, 215, 0, 0.3);
      border-radius: 6px;
      animation: pulse 1.2s ease-in-out infinite;
      z-index: 1;
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.4); }
      50% { box-shadow: 0 0 15px rgba(255, 215, 0, 0.6); }
    }
    .piece {
      width: 90%; height: 90%;
      object-fit: contain;
      pointer-events: none; user-select: none;
      image-rendering: crisp-edges;
      z-index: 2;
      position: relative;
    }
    .dot {
      position: absolute;
      width: 14px; height: 14px;
      border-radius: 50%;
      background-color: rgba(60, 40, 20, 0.4);
      z-index: 2;
    }
    .capture-ring {
      position: absolute;
      width: 100%; height: 100%;
      border: 3px solid rgba(239, 68, 68, 0.5);
      border-radius: 6px;
      box-sizing: border-box;
      z-index: 2;
    }
    @media (max-width: 600px) {
      .dot { width: 10px; height: 10px; }
    }
  `

  return (
    <>
      <style>{styles}</style>
      <div className={classNames} onClick={onClick}>
        {isLegal && <div className="dot" />}
        {isCapture && <div className="capture-ring" />}
        {pieceImg && <img src={pieceImg || "/placeholder.svg"} alt={pieceObj.type} className="piece" />}
      </div>
    </>
  )
}

export default ChessSquare
