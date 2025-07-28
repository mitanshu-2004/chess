// src/components/ScoreBox.jsx
import React from "react";

const ScoreBox = ({ label, value }) => (
  <div className="user-box">
    <div className="detail-box">{label}</div>
    <div
      className="detail-box"
    >
      {value}
    </div>
  </div>
);

export default ScoreBox;
