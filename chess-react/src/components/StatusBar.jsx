import React from "react";

const StatusBar = ({ isGameOver, abort, ifTimeout, game, winner }) => (
  <div className="status-bar">
    {isGameOver
      ? game.isCheckmate()
        ? `Checkmate! ${winner} wins`
        : abort? `Game aborted! ${winner} wins`
        : ifTimeout? `Game over due to timeout! ${winner} wins`:"draw":null}
  </div>
);

export default StatusBar;