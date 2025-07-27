// src/components/ChessSquare.jsx
import React from "react";
import "../styles/Chessboard.css";

const ChessSquare = ({
  square,
  pieceObj,
  isDark,
  isSelected,
  isCapture,
  isLegal,
  isInCheck,
  onClick,
  isLastMove,
}) => {
  const classes = [
    "square",
    isDark ? "dark" : "light",
    isSelected ? "selected" : "",
    isInCheck ? "in-check" : "",
    isLastMove ? "last-move" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const pieceImg = pieceObj
    ? `https://chessboardjs.com/img/chesspieces/wikipedia/${pieceObj.color}${pieceObj.type.toUpperCase()}.png`
    : null;

  return (
    <div className={classes} onClick={onClick}>
      {isLegal && <div className="dot" />}
      {isCapture && <div className="capture-ring" />}
      {pieceImg && (
        <img
          src={pieceImg}
          alt={`${pieceObj.color}${pieceObj.type}`}
          className="piece"
        />
      )}
    </div>
  );
};

export default ChessSquare;
