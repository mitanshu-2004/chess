import React from "react";
import "../styles/TimeBar.css";

const formatTime = (seconds) => {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
};

const TimeBar = ({ time, initialTime, label }) => {
  if (typeof time !== "number" || initialTime == null) return null;

  const percentLeft = Math.max(0, (time / initialTime) * 100);
  const isLow = time <= 10;

  return (
    <div className="time-bar-wrapper">
      <div className="time-bar-header">
        <span className="label">{label}</span>
        <span className={`time ${isLow ? "low" : ""}`}>{formatTime(time)}</span>
      </div>
      <div className="time-bar-track">
        <div
          className={`time-bar-fill ${isLow ? "low" : ""}`}
          style={{ width: `${percentLeft}%` }}
        />
      </div>
    </div>
  );
};

export default TimeBar;
