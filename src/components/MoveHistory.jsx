"use client"
import { useRef, useEffect } from "react"
import { Flag, RotateCcw } from "lucide-react"

const MoveHistory = ({
  moveHistory = [],
  onResign,
  onNewGame,
  playerName = "Player",
  opponentName = "Opponent",
  playerRating = 1000,
  opponentRating = 1000,
  timeControl = 5,
  gameType = "vs Engine",
}) => {
  const endRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (endRef.current && containerRef.current) {
      // Remove smooth scrolling - just scroll to bottom instantly
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [moveHistory])

  const grouped = []
  for (let i = 0; i < moveHistory.length; i += 2) {
    grouped.push({
      number: i / 2 + 1,
      white: moveHistory[i],
      black: moveHistory[i + 1] || null,
    })
  }

  const styles = `
    @keyframes glow {
      0% { box-shadow: 0 0 5px rgba(141, 110, 99, 0.3); }
      100% { box-shadow: 0 0 15px rgba(141, 110, 99, 0.5); }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .history-panel {
      background: rgba(252, 248, 243, 0.95);
      backdrop-filter: blur(10px);
      padding: 1.2rem;
      border-radius: 16px;
      width: 100%;
      max-width: 300px;
      box-shadow: 0 0.5vh 1.5vh rgba(141, 110, 99, 0.2);
      display: flex;
      flex-direction: column;
      border: 0.1vh solid rgba(255, 255, 255, 0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .history-panel:hover {
      box-shadow: 0 0.8vh 2vh rgba(141, 110, 99, 0.25);
      transform: translateY(-2px);
    }

    .panel-header {
      margin-bottom: 1rem;
    }

    .game-info {
      background: linear-gradient(135deg, rgba(141, 110, 99, 0.1) 0%, rgba(109, 76, 65, 0.15) 100%);
      padding: 0.8rem;
      border-radius: 10px;
      margin-bottom: 0.8rem;
      border: 0.1vh solid rgba(141, 110, 99, 0.2);
      animation: fadeIn 0.5s ease;
    }

    .game-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: #8d6e63;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.4rem;
      text-align: center;
    }

    .players-info {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .player-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      color: #4e342e;
      padding: 0.2rem 0;
    }

    .player-name {
      font-weight: 600;
      flex: 1;
      text-align: left;
    }

    .player-rating {
      color: #8d6e63;
      font-weight: 500;
      font-size: 0.75rem;
    }

    .vs-divider {
      text-align: center;
      color: #8d6e63;
      font-weight: 700;
      font-size: 0.7rem;
      margin: 0.2rem 0;
      opacity: 0.7;
    }

    .time-control {
      text-align: center;
      font-size: 0.7rem;
      color: #6b7280;
      margin-top: 0.4rem;
      font-weight: 500;
    }

    .header-buttons {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .header-buttons button {
      flex: 1;
      background: rgba(255, 255, 255, 0.9);
      border: 0.1vh solid rgba(141, 110, 99, 0.3);
      padding: 0.6rem;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      color: #4e342e;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0.2vh 0.6vh rgba(141, 110, 99, 0.15);
      position: relative;
      overflow: hidden;
    }

    .header-buttons button::before {
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

    .header-buttons button:hover::before {
      opacity: 1;
    }

    .header-buttons button:hover {
      border-color: #8d6e63;
      box-shadow: 0 0.4vh 1vh rgba(141, 110, 99, 0.3);
      transform: translateY(-1px);
    }

    .header-buttons button.danger:hover {
      background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
      color: white;
      border-color: #f44336;
    }

    .header-buttons button.danger:hover::before {
      opacity: 0;
    }

    .header-buttons button svg {
      color: inherit;
      position: relative;
      z-index: 2;
    }

    .moves-section {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }

    .moves-header {
      font-size: 0.75rem;
      font-weight: 700;
      color: #8d6e63;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .moves-scroll {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(5px);
      flex-grow: 1;
      padding: 0.8rem;
      overflow-y: auto;
      border-radius: 10px;
      max-height: 200px;
      border: 0.1vh solid rgba(141, 110, 99, 0.2);
      box-shadow: inset 0 0.2vh 0.5vh rgba(141, 110, 99, 0.1);
      /* Remove smooth scrolling */
      scroll-behavior: auto;
    }

    .move-row {
      display: flex;
      align-items: center;
      margin-bottom: 0.4rem;
      font-size: 0.85rem;
      color: #4e342e;
      transition: all 0.2s ease;
      padding: 0.2rem;
      border-radius: 6px;
      animation: fadeIn 0.3s ease;
    }

    .move-row:hover {
      background: rgba(141, 110, 99, 0.1);
    }

    .move-number {
      font-weight: bold;
      margin-right: 0.5rem;
      min-width: 1.5rem;
      color: #8d6e63;
    }

    .move-pair {
      display: flex;
      gap: 0.5rem;
    }

    .move-cell {
      background: rgba(141, 110, 99, 0.1);
      padding: 0.3rem 0.6rem;
      border-radius: 6px;
      font-family: monospace;
      transition: all 0.2s ease;
      border: 0.1vh solid rgba(141, 110, 99, 0.2);
      cursor: pointer;
    }

    .move-cell:hover {
      background: rgba(141, 110, 99, 0.2);
      transform: translateY(-1px);
      box-shadow: 0 0.2vh 0.5vh rgba(141, 110, 99, 0.2);
    }

    .empty-state {
      text-align: center;
      color: #8d6e63;
      padding: 2rem 1rem;
      font-style: italic;
      opacity: 0.7;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .empty-state-icon {
      font-size: 2rem;
      opacity: 0.5;
    }

    .game-stats {
      background: rgba(255, 255, 255, 0.6);
      margin-top: 1rem;
      padding: 0.6rem;
      border-radius: 8px;
      font-size: 0.7rem;
      text-align: center;
      color: #6b7280;
      border: 0.1vh solid rgba(141, 110, 99, 0.15);
    }

    .moves-count {
      font-weight: 600;
      color: #8d6e63;
    }

    @media (max-width: 768px) {
      .history-panel {
        max-width: 100%;
        padding: 1rem;
      }
      
      .moves-scroll {
        max-height: 150px;
      }
      
      .game-info {
        padding: 0.6rem;
      }
      
      .player-line {
        font-size: 0.75rem;
      }
    }
  `

  return (
    <>
      <style>{styles}</style>
      <div className="history-panel">
        <div className="panel-header">
          <div className="game-info">
            <div className="game-title">{gameType}</div>
            <div className="time-control">{timeControl} min </div>
          </div>

          <div className="header-buttons">
            <button onClick={onResign} className="danger">
              <Flag size={16} /> Resign
            </button>
          </div>
        </div>

        <div className="moves-section">
          <div className="moves-header">Move History ({moveHistory.length} moves)</div>

          <div className="moves-scroll" ref={containerRef}>
            {grouped.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">♟</div>
                <div>No moves yet</div>
                <div style={{ fontSize: "0.6rem", opacity: 0.7 }}>Make your first move!</div>
              </div>
            ) : (
              grouped.map((move, idx) => (
                <div className="move-row" key={idx}>
                  <div className="move-number">{move.number}.</div>
                  <div className="move-pair">
                    <span className="move-cell">{move.white}</span>
                    {move.black && <span className="move-cell">{move.black}</span>}
                  </div>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          {moveHistory.length > 0 && (
            <div className="game-stats">
              <span className="moves-count">{Math.ceil(moveHistory.length / 2)}</span> moves played
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default MoveHistory
