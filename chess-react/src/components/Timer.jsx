import React from "react";

const formatTime = (seconds) => {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
};

const Timer = ({ label, time }) => (
  <div className="user-box">
    <div className="detail-box">{label}</div>
    <div className="detail-box">{formatTime(time)}</div>
  </div>
);

export default Timer;
