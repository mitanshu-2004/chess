"use client"
import { User } from "lucide-react"
import { COLORS } from "../utils/colors"

const PlayerCard = ({ name, rating, isBot, capturedPieces = [], time, isActive }) => {
  // Calculate material advantage

  // Group captured pieces by type for better display
  const groupedPieces = capturedPieces.reduce((acc, piece) => {
    acc[piece] = (acc[piece] || 0) + 1
    return acc
  }, {})

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(Math.max(0, seconds) / 60)
    const secs = Math.max(0, seconds) % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const styles = `
    @keyframes glow {
      0% { box-shadow: 0 0 5px rgba(141, 110, 99, 0.3); }
      100% { box-shadow: 0 0 15px rgba(141, 110, 99, 0.5); }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }

    .player-card {
      display: grid;
      grid-template-columns: auto 1fr auto;
      grid-template-rows: auto auto;
      gap: 0.75rem;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 1rem 1.5rem;
      border-radius: 12px;
      box-shadow: 0 0.3vh 1vh rgba(141, 110, 99, 0.2);
      color: ${COLORS.textPrimary};
      border: 0.1vh solid rgba(255, 255, 255, 0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      min-height: 80px;
      width: 100%;
      max-width: 600px;
    }

    .player-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(141, 110, 99, 0.05) 0%, rgba(109, 76, 65, 0.1) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .player-card:hover::before {
      opacity: 1;
    }

    .player-card:hover {
      box-shadow: 0 0.5vh 1.5vh rgba(141, 110, 99, 0.3);
      transform: translateY(-2px);
    }

    .player-info {
      grid-column: 1;
      grid-row: 1 / 3;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      position: relative;
      z-index: 2;
    }

    .avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      border: 2px solid rgba(141, 110, 99, 0.3);
      background: linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%);
      box-shadow: 0 0.3vh 0.8vh rgba(141, 110, 99, 0.3);
      transition: all 0.3s ease;
      position: relative;
      z-index: 2;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .player-card:hover .avatar {
      border-color: #8d6e63;
      box-shadow: 0 0.4vh 1vh rgba(141, 110, 99, 0.4);
    }

    .player-details {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      position: relative;
      z-index: 2;
      min-width: 0;
    }

    .name-row {
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: #4e342e;
      text-shadow: 0 0.1vh 0.2vh rgba(78, 52, 46, 0.1);
      font-size: 1rem;
    }

    .rating {
      font-size: 0.75rem;
      color: #8d6e63;
      font-weight: 600;
    }

    .timer-container {
      grid-column: 3;
      grid-row: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      color: #4e342e;
      padding: 0.6rem 1rem;
      border-radius: 8px;
      font-family: 'Segoe UI Mono', monospace;
      font-size: 1.2rem;
      font-weight: bold;
      text-align: center;
      box-shadow: 0 0.2vh 0.6vh rgba(141, 110, 99, 0.2);
      min-width: 80px;
      border: 0.1vh solid rgba(255, 255, 255, 0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .timer-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(141, 110, 99, 0.1) 0%, rgba(109, 76, 65, 0.15) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .timer-container.active {
      background: linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%);
      color: white;
      box-shadow: 0 0.4vh 1vh rgba(141, 110, 99, 0.4);
      animation: pulse 2s ease-in-out infinite;
    }

    .timer-container.active::before {
      opacity: 0;
    }

    .timer-container:hover::before {
      opacity: 1;
    }

    .timer-display {
      position: relative;
      z-index: 2;
      text-shadow: ${isActive ? "0 0.1vh 0.3vh rgba(0, 0, 0, 0.3)" : "none"};
    }

    .captured-pieces {
      grid-column: 2 / 4;
      grid-row: 2;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      position: relative;
      z-index: 2;
      min-height: 30px;
    }

    .material-advantage {
      font-size: 0.7rem;
      font-weight: 700;
      color: #4caf50;
      text-align: right;
      padding: 0.2rem 0.4rem;
      background: rgba(76, 175, 80, 0.1);
      border-radius: 4px;
      border: 1px solid rgba(76, 175, 80, 0.3);
      min-height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      align-self: flex-end;
      min-width: 40px;
    }

    .pieces-display {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
      justify-content: flex-end;
      max-width: 100%;
      min-height: 24px;
      padding: 0.4rem;
      background: rgba(141, 110, 99, 0.05);
      border-radius: 6px;
      border: 1px solid rgba(141, 110, 99, 0.1);
      overflow: hidden;
    }

    .piece-group {
      display: flex;
      align-items: center;
      gap: 0.2rem;
      animation: fadeIn 0.3s ease;
      background: rgba(255, 255, 255, 0.8);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      border: 1px solid rgba(141, 110, 99, 0.2);
      flex-shrink: 0;
      white-space: nowrap;
    }

    .captured-piece {
      font-size: 1.2rem;
      opacity: 0.9;
      transition: all 0.2s ease;
      filter: grayscale(0);
    }

    .captured-piece:hover {
      opacity: 1;
      transform: scale(1.1);
      filter: grayscale(0);
    }

    .piece-count {
      font-size: 0.6rem;
      color: #8d6e63;
      font-weight: 600;
      background: rgba(141, 110, 99, 0.1);
      border-radius: 50%;
      width: 14px;
      height: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: -2px;
    }

    .player-card svg {
      color: #8d6e63;
      transition: color 0.3s ease;
    }

    .player-card:hover svg {
      color: #6d4c41;
    }

    ${
      isBot
        ? `
      .player-card {
        background: linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.15) 100%);
      }
      .avatar {
        background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
      }
    `
        : ""
    }

    @media (max-width: 768px) {
      .player-card {
        grid-template-columns: auto 1fr;
        grid-template-rows: auto auto auto;
        gap: 0.5rem;
        padding: 0.8rem 1rem;
        min-height: 100px;
      }
      
      .player-info {
        grid-column: 1 / 3;
        grid-row: 1;
      }
      
      .timer-container {
        grid-column: 1 / 3;
        grid-row: 2;
        justify-self: center;
        min-width: 120px;
      }
      
      .captured-pieces {
        grid-column: 1 / 3;
        grid-row: 3;
      }
      
      .pieces-display {
        justify-content: center;
      }
      
      .material-advantage {
        align-self: center;
      }
      
      .avatar {
        width: 45px;
        height: 45px;
        font-size: 1.3rem;
      }
      
      .name-row {
        font-size: 0.9rem;
      }
      
      .timer-container {
        font-size: 1.1rem;
        padding: 0.5rem 0.8rem;
      }
    }

    @media (max-width: 480px) {
      .player-card {
        padding: 0.6rem 0.8rem;
        min-height: 90px;
      }
      
      .avatar {
        width: 40px;
        height: 40px;
        font-size: 1.2rem;
      }
      
      .name-row {
        font-size: 0.85rem;
      }
      
      .timer-container {
        font-size: 1rem;
        padding: 0.4rem 0.6rem;
        min-width: 100px;
      }
      
      .captured-piece {
        font-size: 1.1rem;
      }
      
      .piece-count {
        width: 12px;
        height: 12px;
        font-size: 0.55rem;
      }
    }
  `

  // Helper function to get piece symbol with color
  const getPieceSymbol = (pieceType) => {
    const whiteSymbols = { p: "♙", r: "♖", n: "♘", b: "♗", q: "♕", k: "♔" }
    const blackSymbols = { p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚" }

    return whiteSymbols[pieceType] || blackSymbols[pieceType] || "?"
  }

  const avatarContent = isBot ? "🤖" : "👤"

  return (
    <>
      <style>{styles}</style>
      <div className="player-card">
        <div className="player-info">
          <div className="avatar">{avatarContent}</div>
          <div className="player-details">
            <div className="name-row">{name}</div>
            <div className="rating">
              <User size={12} style={{ display: "inline", marginRight: "4px" }} />
              {rating || 1200}
            </div>
          </div>
        </div>

        <div className={`timer-container ${isActive ? "active" : ""}`}>
          <span className="timer-display">{formatTime(time || 0)}</span>
        </div>

        <div className="captured-pieces">
          <div className="pieces-display">
            {Object.entries(groupedPieces).map(([pieceType, count]) => (
              <div key={pieceType} className="piece-group">
                <span className="captured-piece">{getPieceSymbol(pieceType)}</span>
                {count > 1 && <span className="piece-count">{count}</span>}
              </div>
            ))}
            {capturedPieces.length === 0 && (
              <span style={{ fontSize: "0.7rem", color: "#8d6e63", fontStyle: "italic" }}>No captures</span>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default PlayerCard
