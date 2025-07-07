import React from "react";

const Home = () => {
  return (
    <div className="home">
      <h1>Chess Game</h1>
      <button onClick={() => (window.location.href = "/minimax")}>
        Play vs AI
      </button>
      <button onClick={() => (window.location.href = "/multiplayer")}>
        Play vs Player
      </button>
    </div>
  );
};

export default Home;
