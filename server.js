const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

function getBestMove(fen, callback) {
  const stockfishPath = path.join(__dirname, "stockfish");
  const engine = spawn(stockfishPath);

  console.log("Stockfish engine started");

  let bestMove = null;

  engine.stdout.on("data", (data) => {
    const lines = data.toString().split("\n");
    for (const line of lines) {
      if (line.startsWith("bestmove")) {
        bestMove = line.split(" ")[1];
        console.log("Stockfish bestmove:", bestMove);
        callback(bestMove);
        engine.kill();
      }
    }
  });

  engine.stderr.on("data", (data) => {
    console.error("Stockfish error:", data.toString());
  });

  engine.on("close", () => {
    if (!bestMove) {
      console.log("Engine closed without bestmove.");
      callback(null);
    }
  });

  engine.stdin.write("uci\n");
  engine.stdin.write("isready\n");
  engine.stdin.write(`position fen ${fen}\n`);
  engine.stdin.write("go depth 15\n");
}

app.post("/api/bestmove", (req, res) => {
  const { fen } = req.body;
  if (!fen) return res.status(400).json({ error: "Missing FEN" });

  getBestMove(fen, (move) => {
    if (!move) return res.status(500).json({ error: "No move found" });
    res.json({ bestMove: move });
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "♟️ Stockfish API is running" });
});

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});
