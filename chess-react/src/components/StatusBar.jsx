import React from "react";

const StatusBar = ({ isGameOver, abort, game, winner }) => (
  <div className="status-bar">
    {isGameOver
      ? game.isCheckmate()
        ? `Checkmate! ${winner} wins`
        : abort? `Game aborted! ${winner} wins`
        : `Game drawn!`
      :null}
  </div>
);

export default StatusBar;