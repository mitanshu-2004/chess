"use client"
import { User } from "lucide-react"
import { COLORS } from "../utils/colors"

const PlayerCard = ({ name, rating, color, isBot, isTop, capturedPieces = [] }) => {
  // Piece values for material calculation
  const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

  // Piece symbols for display - showing opponent pieces with their original colors
  const pieceSymbols = {
    // White pieces (opponent pieces if I'm black)
    wp: "♙",
    wr: "♖",
    wn: "♘",
    wb: "♗",
    wq: "♕",
    wk: "♔",
    // Black pieces (opponent pieces if I'm white)
    bp: "♟",
    br: "♜",
    bn: "♞",
    bb: "♝",
    bq: "♛",
    bk: "♚",
  }

  // Calculate material advantage
  const materialValue = capturedPieces.reduce((sum, piece) => sum + pieceValues[piece], 0)

  // Group captured pieces by type for better display
  const groupedPieces = capturedPieces.reduce((acc, piece) => {
    acc[piece] = (acc[piece] || 0) + 1
    return acc
  }, {})

  const styles = `
    @keyframes glow {
      0% { box-shadow: 0 0 5px rgba(141, 110, 99, 0.3); }
      100% { box-shadow: 0 0 15px rgba(141, 110, 99, 0.5); }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }

    .player-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 0.8rem 1.2rem;
      border-radius: 12px;
      box-shadow: 0 0.3vh 1vh rgba(141, 110, 99, 0.2);
      font-size: 0.9rem;
      color: ${COLORS.textPrimary};
      justify-content: ${isTop ? "flex-start" : "flex-end"};
      border: 0.1vh solid rgba(255, 255, 255, 0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      min-height: 60px;
      min-width: 350px; /* Increased from 280px */
      max-width: 500px; /* Increased from 400px */
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

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid rgba(141, 110, 99, 0.3);
      background: linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%);
      box-shadow: 0 0.3vh 0.8vh rgba(141, 110, 99, 0.3);
      transition: all 0.3s ease;
      position: relative;
      z-index: 2;
      flex-shrink: 0;
    }

    .player-card:hover .avatar {
      border-color: #8d6e63;
      box-shadow: 0 0.4vh 1vh rgba(141, 110, 99, 0.4);
    }

    .player-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      position: relative;
      z-index: 2;
      flex-grow: 1;
      min-width: 0;
    }

    .name-row {
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: #4e342e;
      text-shadow: 0 0.1vh 0.2vh rgba(78, 52, 46, 0.1);
    }

    .rating {
      font-size: 0.75rem;
      color: #8d6e63;
      font-weight: 600;
    }

    .details-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
    }

    .flag {
      width: 16px;
      height: 12px;
      border: 1px solid rgba(141, 110, 99, 0.3);
      border-radius: 2px;
    }

    .captured-pieces {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      position: relative;
      z-index: 2;
      flex-shrink: 0;
      min-width: 180px; /* Increased from 140px */
      max-width: 250px; /* Increased from 180px */
    }

    .material-advantage {
      font-size: 0.7rem;
      font-weight: 700;
      color: #4caf50;
      text-align: center;
      padding: 0.2rem 0.4rem;
      background: rgba(76, 175, 80, 0.1);
      border-radius: 4px;
      border: 1px solid rgba(76, 175, 80, 0.3);
      min-height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pieces-display {
      display: flex;
      flex-wrap: nowrap; /* Changed from wrap to nowrap for single line */
      gap: 0.2rem;
      justify-content: flex-start; /* Changed from center to flex-start */
      max-width: 100%;
      min-height: 20px;
      padding: 0.3rem;
      background: rgba(141, 110, 99, 0.05);
      border-radius: 6px;
      border: 1px solid rgba(141, 110, 99, 0.1);
      overflow-x: auto; /* Allow horizontal scrolling if needed */
      overflow-y: hidden;
    }

    .pieces-display::-webkit-scrollbar {
      height: 3px;
    }

    .pieces-display::-webkit-scrollbar-track {
      background: rgba(141, 110, 99, 0.1);
      border-radius: 3px;
    }

    .pieces-display::-webkit-scrollbar-thumb {
      background: rgba(141, 110, 99, 0.3);
      border-radius: 3px;
    }

    .pieces-display::-webkit-scrollbar-thumb:hover {
      background: rgba(141, 110, 99, 0.5);
    }

    .piece-group {
      display: flex;
      align-items: center;
      gap: 0.1rem;
      animation: fadeIn 0.3s ease;
      background: rgba(255, 255, 255, 0.7);
      padding: 0.1rem 0.3rem;
      border-radius: 4px;
      border: 1px solid rgba(141, 110, 99, 0.2);
      flex-shrink: 0; /* Prevent shrinking */
      white-space: nowrap; /* Prevent wrapping */
    }

    .captured-piece {
      font-size: 1rem; /* Make pieces slightly larger */
      opacity: 0.9;
      transition: all 0.2s ease;
      filter: grayscale(0); /* Remove grayscale to show original colors */
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
      width: 12px;
      height: 12px;
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
        min-width: 300px; /* Adjusted for mobile */
        max-width: 100%;
      }
      
      .captured-pieces {
        min-width: 120px; /* Reduced for mobile */
        max-width: 180px;
      }
      
      .pieces-display {
        gap: 0.1rem;
      }
      
      .captured-piece {
        font-size: 0.9rem; /* Slightly smaller on mobile */
      }
      
      .material-advantage {
        font-size: 0.6rem;
        padding: 0.1rem 0.3rem;
      }
    }

    @media (max-width: 480px) {
      .player-card {
        min-width: 280px;
        padding: 0.6rem 1rem;
      }
      
      .captured-pieces {
        min-width: 100px;
        max-width: 150px;
      }
      
      .captured-piece {
        font-size: 0.8rem;
      }
    }
  `

  const avatarSrc = isBot ? "🤖" : "👤"
  const flagSrc = "/placeholder.svg?height=12&width=16"

  // Helper function to get piece symbol with color
  const getPieceSymbol = (pieceType) => {
    // For captured pieces, we need to determine the opponent's color
    // If this is showing captured pieces, they should be the opponent's pieces
    // We'll assume the pieces array contains the piece types without color prefix
    // and we'll add the appropriate color based on context

    // For now, we'll show both white and black pieces as they were captured
    // This might need adjustment based on your game logic
    const whiteSymbols = { p: "♙", r: "♖", n: "♘", b: "♗", q: "♕", k: "♔" }
    const blackSymbols = { p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚" }

    // Return both white and black versions - you might want to adjust this logic
    return whiteSymbols[pieceType] || blackSymbols[pieceType] || "?"
  }

  return (
    <>
      <style>{styles}</style>
      <div className="player-card">
        {avatarSrc}
        <div className="player-info">
          <div className="name-row">{name}</div>
          <div className="details-row">
            <User size={12} />
          </div>
        </div>

        <div className="captured-pieces">
          {materialValue > 0 && <div className="material-advantage">+{materialValue}</div>}
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
