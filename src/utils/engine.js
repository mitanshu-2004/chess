let stockfishWorker = null;
let moveCallback = null;
let isEngineReady = false; // New flag to track engine readiness

export function initEngine() {
  if (!stockfishWorker) {
    stockfishWorker = new Worker(new URL('/node_modules/stockfish/src/stockfish-nnue-16.js', import.meta.url), { type: 'module' });

    stockfishWorker.onmessage = function(event) {
      const message = event.data;

      if (message === 'uciok') {
        // Engine has acknowledged UCI protocol
        stockfishWorker.postMessage('isready');
      } else if (message === 'readyok') {
        // Engine is ready to receive commands
        isEngineReady = true;
        console.log("✅ Stockfish engine is ready!");
      } else if (message.startsWith('bestmove')) {
        const bestMove = message.split(' ')[1];
        if (moveCallback) {
          moveCallback(bestMove);
          moveCallback = null;
        }
      }
    };

    // Initial commands to the worker
    stockfishWorker.postMessage('uci');
    console.log("✅ Stockfish engine worker initialized");
  }
}

export function getBestMoveFromStockfish(fen, callback) {
  if (!stockfishWorker) {
    console.error("Stockfish worker not initialized.");
    callback(null);
    return;
  }

  if (!isEngineReady) {
    console.warn("Stockfish engine not yet ready. Retrying in 100ms...");
    setTimeout(() => getBestMoveFromStockfish(fen, callback), 100);
    return;
  }

  moveCallback = callback;
  stockfishWorker.postMessage(`position fen ${fen}`);
  stockfishWorker.postMessage('go depth 15');
  console.log("📤 Sending FEN to Stockfish worker:", fen);
}

export function stopEngine() {
  if (stockfishWorker && isEngineReady) {
    stockfishWorker.postMessage('stop');
  }
}