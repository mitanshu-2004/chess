"use client"
import { Trophy, RotateCcw, Clock, Flag } from "lucide-react"
import { COLORS } from "../utils/colors"

const GameOverModal = ({ winner, wasAborted, ifTimeout, onPlayAgain, onClose }) => {
  const getResult = () => {
    if (wasAborted)
      return { title: "Game Resigned", message: "You resigned", icon: <Flag size={48} />, color: COLORS.danger }
    if (ifTimeout)
      return {
        title: "Time's Up",
        message: `${winner} wins by timeout`,
        icon: <Clock size={48} />,
        color: COLORS.accentMain,
      }
    if (winner === "Draw")
      return {
        title: "Draw Game",
        message: "The game ended in a draw",
        icon: <div className="text-4xl">🤝</div>,
        color: COLORS.textMuted,
      }
    if (winner === "You")
      return { title: "Victory!", message: "You won!", icon: <Trophy size={48} />, color: COLORS.accentMain }
    return {
      title: "Game Over",
      message: "The engine won.",
      icon: <div className="text-4xl">🤖</div>,
      color: COLORS.textSecondary,
    }
  }

  const result = getResult()

  const styles = `
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: ${COLORS.dialogOverlay};
      backdrop-filter: blur(4px);
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-box {
      background: ${COLORS.dialogBg};
      border-radius: 1rem;
      padding: 2rem;
      width: 90%;
      max-width: 400px;
      position: relative;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      animation: fadeIn 0.3s ease;
      text-align: center;
      border: 1px solid ${COLORS.bgLight2};
    }
    .icon-container {
      margin-bottom: 1rem;
      animation: float 3s ease-in-out infinite;
    }
    .title {
      font-size: 1.75rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
      color: ${COLORS.textPrimary};
    }
    .message {
      font-size: 1rem;
      margin-bottom: 1.5rem;
      color: ${COLORS.textSecondary};
    }
    .action-btn {
      background: linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.successDark} 100%);
      color: ${COLORS.textWhite};
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      box-shadow: 0 4px 10px rgba(76, 175, 80, 0.2);
    }
    .action-btn:hover {
      background: linear-gradient(135deg, ${COLORS.successDark} 0%, ${COLORS.success} 100%);
      transform: translateY(-1px);
      box-shadow: 0 6px 15px rgba(76, 175, 80, 0.3);
    }
    .close-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: transparent;
      border: none;
      font-size: 1.25rem;
      color: ${COLORS.textMuted};
      cursor: pointer;
      transition: color 0.2s;
    }
    .close-btn:hover {
      color: ${COLORS.textSecondary};
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `

  return (
    <>
      <style>{styles}</style>
      <div className="modal-backdrop">
        <div className="modal-box">
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
          <div className="icon-container" style={{ color: result.color }}>
            {result.icon}
          </div>
          <div className="title">{result.title}</div>
          <div className="message">{result.message}</div>
          <button className="action-btn" onClick={onPlayAgain}>
            <RotateCcw size={18} />
            Play Again
          </button>
        </div>
      </div>
    </>
  )
}

export default GameOverModal
