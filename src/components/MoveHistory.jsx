import React, { useRef, useEffect } from "react";

const MoveHistory = ({ moveHistory = [] }) => {
  const historyEndRef = useRef(null);

  useEffect(() => {
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [moveHistory]);

  const groupedMoves = [];

  if (Array.isArray(moveHistory)) {
    for (let i = 0; i < moveHistory.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      const whiteMove = moveHistory[i];
      const blackMove = moveHistory[i + 1] || "";
      groupedMoves.push(`${moveNumber}. ${whiteMove} ${blackMove}`);
    }
  }

  return (
    <div className="move-history">
      {groupedMoves.length === 0 ? (
        <div>No moves yet.</div>
      ) : (
        groupedMoves.map((pair, index) => <div key={index}>{pair}</div>)
      )}
      <div ref={historyEndRef} />
    </div>
  );
};

export default MoveHistory;
