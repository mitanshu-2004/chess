const express = require("express");
const cors = require("cors");
const stockfish = require("stockfish"); // ✅ Use the NPM module
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

function getBestMove(fen, callback) {
  const engine = stockfish(); // ✅ No spawn — just call the function

  let bestMove = null;

  engine.onmessage = (line) => {
    if (typeof line === "object" && line.data) line = line.data;
    if (line.startsWith("bestmove")) {
      bestMove = line.split(" ")[1];
      console.log("♟️ Best move:", bestMove);
      callback(bestMove);
    }
  };

  engine.postMessage("uci");
  engine.postMessage("isready");
  engine.postMessage(`position fen ${fen}`);
  engine.postMessage("go depth 15");
}

app.post("/api/bestmove", (req, res) => {
  const { fen } = req.body;
  if (!fen) return res.status(400).json({ error: "Missing FEN" });

  getBestMove(fen, (move) => {
    if (!move) return res.status(500).json({ error: "No best move found" });
    res.json({ bestMove: move });
  });
});

app.listen(port, () => {
  console.log(`♟️ Stockfish server running at http://localhost:${port}`);
});
