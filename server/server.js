const express = require("express");
const cors = require("cors");
const stockfish = require("stockfish"); // ✅ Use stockfish npm package

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

function getBestMove(fen, callback) {
  const engine = stockfish(); // ✅ create engine instance
  let bestMove = null;

  engine.onmessage = function (line) {
    if (typeof line === "object") line = line.data;
    console.log("Stockfish:", line);

    if (line.startsWith("bestmove")) {
      bestMove = line.split(" ")[1];
      callback(bestMove);
    }
  };

  // Initialize and send commands
  engine.postMessage("uci");
  engine.postMessage("isready");
  engine.postMessage(`position fen ${fen}`);
  engine.postMessage("go depth 15");
}

app.post("/api/bestmove", (req, res) => {
  const { fen } = req.body;
  console.log("Received FEN:", fen);

  if (!fen) {
    return res.status(400).json({ error: "Missing FEN" });
  }

  getBestMove(fen, (move) => {
    if (!move) {
      console.log("No best move found");
      return res.status(500).json({ error: "No best move found" });
    }
    res.json({ bestMove: move });
  });
});

app.listen(port, () => {
  console.log(`♟️ Stockfish server running at http://localhost:${port}`);
});
