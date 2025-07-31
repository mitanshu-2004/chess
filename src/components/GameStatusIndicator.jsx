const GameStatusIndicator = ({ gameState, isMyTurn, playerColor, roomInfo, opponentConnected, moveCount }) => {
  const getStatusMessage = () => {
    if (gameState.isGameOver) {
      if (roomInfo?.aborted) {
        return {
          icon: "🛑",
          text: `Game aborted by ${roomInfo.abortedBy === playerColor ? "you" : "opponent"}`,
          color: "#f44336",
          priority: "high",
        }
      }
      if (roomInfo?.timeoutWinner) {
        return {
          icon: "⏰",
          text: `Time's up! ${gameState.winner} wins`,
          color: "#ff9800",
          priority: "high",
        }
      }
      if (gameState.isCheckmate) {
        const isWinner =
          (gameState.winner === "White" && playerColor === "w") || (gameState.winner === "Black" && playerColor === "b")
        return {
          icon: isWinner ? "🏆" : "💔",
          text: `Checkmate! ${gameState.winner} wins`,
          color: isWinner ? "#4caf50" : "#f44336",
          priority: "high",
        }
      }
      if (gameState.isStalemate) {
        return {
          icon: "🤝",
          text: "Stalemate - Draw",
          color: "#9e9e9e",
          priority: "high",
        }
      }
      return {
        icon: "🏁",
        text: `Game over - ${gameState.winner}`,
        color: "#6b7280",
        priority: "high",
      }
    }

    if (gameState.isCheck) {
      const inCheck = gameState.turn === playerColor
      return {
        icon: "⚠️",
        text: inCheck ? "You are in check!" : "Opponent is in check!",
        color: "#ff9800",
        priority: "high",
      }
    }

    if (!opponentConnected) {
      return {
        icon: "📡",
        text: "Opponent disconnected",
        color: "#f44336",
        priority: "medium",
      }
    }

    if (isMyTurn) {
      return {
        icon: "🎯",
        text: "Your turn - Make your move!",
        color: "#4caf50",
        priority: "normal",
      }
    }

    return {
      icon: "⏳",
      text: "Opponent's turn",
      color: "#ff9800",
      priority: "normal",
    }
  }

  const status = getStatusMessage()

  return (
    <div
      style={{
        ...styles.container,
        borderColor: status.color,
        backgroundColor: `${status.color}15`,
      }}
    >
      <div style={styles.statusContent}>
        <span style={styles.statusIcon}>{status.icon}</span>
        <div style={styles.statusTextContainer}>
          <span
            style={{
              ...styles.statusText,
              color: status.color,
            }}
          >
            {status.text}
          </span>
          <div style={styles.gameMetrics}>
            <span style={styles.metric}>Move {Math.ceil(moveCount / 2)}</span>
            <span style={styles.metric}>•</span>
            <span style={styles.metric}>{gameState.turn === "w" ? "White" : "Black"} to move</span>
          </div>
        </div>
      </div>

      {status.priority === "high" && (
        <div
          style={{
            ...styles.priorityIndicator,
            backgroundColor: status.color,
          }}
        ></div>
      )}
    </div>
  )
}

const styles = {
  container: {
    border: "2px solid",
    borderRadius: "12px",
    padding: "12px 16px",
    margin: "10px 0",
    position: "relative",
    transition: "all 0.3s ease",
    overflow: "hidden",
  },
  statusContent: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  statusIcon: {
    fontSize: "clamp(1.5rem, 4vw, 2rem)",
    minWidth: "40px",
    textAlign: "center",
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
    fontWeight: "600",
    display: "block",
    marginBottom: "4px",
  },
  gameMetrics: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  metric: {
    fontSize: "clamp(0.8rem, 2vw, 0.9rem)",
    color: "#6b7280",
    fontWeight: "500",
  },
  priorityIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "4px",
    height: "100%",
    animation: "pulse 2s ease-in-out infinite",
  },
}

export default GameStatusIndicator
