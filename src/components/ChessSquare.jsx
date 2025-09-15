"use client"
import { memo } from "react"
import { COLORS } from "../utils/colors"

const ChessSquare = memo(
  ({ pieceObj, isDark, isSelected, isCapture, isLegal, isInCheck, isLastMove, onClick }) => {
    const getPieceSymbol = (piece) => {
      if (!piece) return "";
      const symbols = {
        w: { p: "♙", n: "♘", b: "♗", r: "♖", q: "♕", k: "♔" },
        b: { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚" },
      };
      return symbols[piece.color][piece.type] || "";
    };

    const classNames = [
      "square",
      isDark ? "dark" : "light",
      isSelected ? "selected" : "",
      isInCheck ? "in-check" : "",
      isLastMove ? "last-move" : "",
      isCapture ? "capture-target" : "",
      isLegal ? "legal-move" : "",
      pieceObj ? "has-piece" : "empty-square",
    ]
      .filter(Boolean)
      .join(" ")

    const styles = `
    .square {
      width: 100%; 
      height: 100%;
      display: flex; 
      align-items: center; 
      justify-content: center;
      position: relative;
      aspect-ratio: 1 / 1;
      user-select: none; 
      cursor: pointer;
      transition: all 0.15s ease;
      box-sizing: border-box;
      overflow: hidden;
    }
    
    .dark { 
      background-color: ${COLORS.squareDark}; 
    }
    .light { 
      background-color: ${COLORS.squareLight}; 
    }
    
    .square:hover {
      filter: brightness(1.05);
      z-index: 2;
    }
    
    .has-piece:hover {
      cursor: grab;
      transform: scale(1.02);
    }
    
    .has-piece:active {
      cursor: grabbing;
      transform: scale(0.98);
    }
    
    .empty-square:hover {
      cursor: default;
    }
    
    .legal-move:hover {
      cursor: pointer;
      background-color: rgba(76, 175, 80, 0.2) !important;
    }
    
    .capture-target:hover {
      cursor: pointer;
      background-color: rgba(244, 67, 54, 0.2) !important;
    }
    
    .selected { 
      box-shadow: inset 0 0 0 3px ${COLORS.selectedBorder};
      z-index: 5;
    }
    
    .in-check { 
      background-color: ${COLORS.checkBg} !important;
      animation: checkPulse 1s ease-in-out infinite;
    }
    
    @keyframes checkPulse {
      0%, 100% { 
        box-shadow: inset 0 0 0 2px rgba(244, 67, 54, 0.6);
      }
      50% { 
        box-shadow: inset 0 0 0 4px rgba(244, 67, 54, 0.8);
      }
    }
    
    .last-move {
      background-color: rgba(76, 175, 80, 0.3) !important;
      box-shadow: inset 0 0 0 2px rgba(76, 175, 80, 0.6);
    }
    
    .piece {
      font-size: 3.5rem; /* Adjust size as needed */
      line-height: 1;
      pointer-events: none; 
      user-select: none;
      z-index: 3;
      position: relative;
      transition: transform 0.15s ease;
    }
    
    .has-piece:hover .piece {
      transform: scale(1.05);
    }
    
    .selected .piece {
      transform: scale(1.1);
    }
    
    .dot {
      position: absolute;
      width: 16px; 
      height: 16px;
      border-radius: 50%;
      background: rgba(76, 175, 80, 0.7);
      z-index: 2;
      pointer-events: none;
    }
    
    .capture-ring {
      position: absolute;
      top: 2px;
      left: 2px;
      right: 2px;
      bottom: 2px;
      border: 2px solid rgba(244, 67, 54, 0.8);
      border-radius: 4px;
      z-index: 2;
      pointer-events: none;
    }
    
    @media (max-width: 600px) {
      .dot { 
        width: 12px; 
        height: 12px; 
      }
      .capture-ring {
        border-width: 1px;
      }
    }
  `

    return (
      <>
        <style>{styles}</style>
        <div className={classNames} onClick={onClick}>
          {isLegal && <div className="dot" />}
          {isCapture && <div className="capture-ring" />}
          {pieceObj && <span className="piece">{getPieceSymbol(pieceObj)}</span>}
        </div>
      </>
    )
  },
)

ChessSquare.displayName = "ChessSquare"

export default ChessSquare
