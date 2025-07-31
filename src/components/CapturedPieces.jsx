const CapturedPieces = ({ capturedPieces, playerColor, showValues = true }) => {
  const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9 }

  const getPieceSymbol = (piece, color) => {
    const symbols = {
      white: { p: "♙", r: "♖", n: "♘", b: "♗", q: "♕", k: "♔" },
      black: { p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚" },
    }
    return symbols[color][piece] || piece
  }

  const renderCapturedSet = (pieces, color, label) => {
    if (!pieces || pieces.length === 0) return null

    const totalValue = pieces.reduce((sum, piece) => sum + (pieceValues[piece] || 0), 0)
    const groupedPieces = pieces.reduce((acc, piece) => {
      acc[piece] = (acc[piece] || 0) + 1
      return acc
    }, {})

    return (
      <div style={styles.capturedSet}>
        <div style={styles.capturedHeader}>
          <span style={styles.capturedLabel}>
            {label} {color === "white" ? "⚪" : "⚫"}
          </span>
          {showValues && totalValue > 0 && <span style={styles.capturedValue}>+{totalValue}</span>}
        </div>
        <div style={styles.capturedList}>
          {Object.entries(groupedPieces).map(([piece, count]) => (
            <div key={piece} style={styles.pieceGroup}>
              <span style={styles.pieceSymbol}>{getPieceSymbol(piece, color)}</span>
              {count > 1 && <span style={styles.pieceCount}>×{count}</span>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const myCaptured = playerColor === "w" ? capturedPieces.black : capturedPieces.white
  const opponentCaptured = playerColor === "w" ? capturedPieces.white : capturedPieces.black

  return (
    <div style={styles.container}>
      {renderCapturedSet(myCaptured, playerColor === "w" ? "black" : "white", "You captured")}
      {renderCapturedSet(opponentCaptured, playerColor === "w" ? "white" : "black", "Opponent captured")}
    </div>
  )
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    width: "100%",
  },
  capturedSet: {
    background: "rgba(255, 255, 255, 0.9)",
    borderRadius: "8px",
    padding: "8px 12px",
    border: "1px solid rgba(141, 110, 99, 0.2)",
    boxShadow: "0 2px 8px rgba(141, 110, 99, 0.1)",
  },
  capturedHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },
  capturedLabel: {
    fontSize: "clamp(0.7rem, 1.8vw, 0.8rem)",
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  capturedValue: {
    fontSize: "clamp(0.7rem, 1.8vw, 0.8rem)",
    fontWeight: "700",
    color: "#4e342e",
    background: "rgba(76, 175, 80, 0.1)",
    padding: "2px 6px",
    borderRadius: "10px",
    border: "1px solid rgba(76, 175, 80, 0.2)",
  },
  capturedList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    alignItems: "center",
  },
  pieceGroup: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    background: "rgba(141, 110, 99, 0.1)",
    borderRadius: "6px",
    padding: "2px 6px",
  },
  pieceSymbol: {
    fontSize: "16px",
    lineHeight: 1,
  },
  pieceCount: {
    fontSize: "clamp(0.6rem, 1.5vw, 0.7rem)",
    fontWeight: "600",
    color: "#8d6e63",
  },
}

export default CapturedPieces
