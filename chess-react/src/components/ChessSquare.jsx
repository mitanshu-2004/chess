import React from "react";

const pieceSymbols = {
  p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
  P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔"
};

const ChessSquare = ({
  pieceObj, square, isDark, isSelected,
  isInCheck, isLegal, isCapture, onClick
}) => {
  const squareClasses = [
    "square",
    isDark ? "dark" : "light",
    isSelected && "selected",
    isInCheck && "in-check",
  ].filter(Boolean).join(" ");

  return (
    <div className={squareClasses} onClick={onClick}>
      {pieceObj
        ? pieceSymbols[
            pieceObj.color === "w"
              ? pieceObj.type.toUpperCase()
              : pieceObj.type
          ]
        : "\u00A0"}

      {isLegal && !isCapture && <div className="dot" />}
      {isCapture && <div className="capture-ring" />}
    </div>
  );
};

export default ChessSquare;
