// src/utils/getLegalMoves.js
export default function getLegalMoves(game, square) {
  return game.moves({ square, verbose: true });
}
