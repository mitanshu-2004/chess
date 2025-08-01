"use client"
import { Play, User, Bot } from "lucide-react"
import { COLORS } from "../utils/colors"

const GameSetup = ({ playAs, setPlayAs, selectedTime, setSelectedTime, onStartGame, username }) => {
  const timeOptions = [
    { value: 1, label: "1 min", description: "Bullet" },
    { value: 3, label: "3 min", description: "Blitz" },
    { value: 5, label: "5 min", description: "Blitz" },
    { value: 10, label: "10 min", description: "Rapid" },
    { value: 15, label: "15 min", description: "Rapid" },
    { value: 30, label: "30 min", description: "Classical" },
  ]

  const handleStartGame = () => {
    if (selectedTime) onStartGame(selectedTime)
  }

  const styles = `
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      25% { transform: translateY(-1vh) rotate(3deg); }
      50% { transform: translateY(-0.5vh) rotate(-2deg); }
      75% { transform: translateY(-1.5vh) rotate(4deg); }
    }

    @keyframes glow {
      0% { filter: drop-shadow(0 0 0.3vh rgba(141, 110, 99, 0.5)); }
      100% { filter: drop-shadow(0 0 0.8vh rgba(141, 110, 99, 0.8)); }
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    .setup {
      height: 100vh;
      width: 100vw;
      background: linear-gradient(120deg, #f2e9e4 0%, #d8cfc4 50%, #f9f4ef 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      position: relative;
      overflow: hidden;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .background-elements {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 0;
    }

    .floating-piece {
      position: absolute;
      font-size: clamp(1.5rem, 3vw, 2.5rem);
      opacity: 0.1;
      color: #8d6e63;
      animation: float 8s ease-in-out infinite;
    }

    .panel {
      background: rgba(252, 248, 243, 0.95);
      backdrop-filter: blur(10px);
      padding: 2rem;
      border-radius: 1.5rem;
      max-width: 700px;
      width: 100%;
      box-shadow: 0 1vh 3vh rgba(141, 110, 99, 0.2), 0 0 0 0.1vh rgba(255, 255, 255, 0.3);
      border: 0.1vh solid #efebe9;
      position: relative;
      z-index: 1;
    }

    .header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .header .icon {
      font-size: clamp(2rem, 4vw, 3rem);
      color: #8d6e63;
      text-shadow: 0 0.3vh 0.6vh rgba(141, 110, 99, 0.3);
      animation: glow 3s ease-in-out infinite alternate;
      margin-bottom: 0.5rem;
      display: block;
    }

    .header h2 {
      font-size: clamp(1.8rem, 4vw, 2.5rem);
      font-weight: 900;
      margin: 0 0 0.5rem 0;
      letter-spacing: -0.02em;
      line-height: 1.1;
      color: #8d6e63;
      text-shadow: 0 0.1vh 0.3vh rgba(141, 110, 99, 0.3);
    }

    .header p {
      font-size: clamp(0.8rem, 1.8vw, 1rem);
      color: #5d4037;
      font-weight: 500;
      margin: 0;
      line-height: 1.4;
      font-style: italic;
    }

    .options-grid {
      display: grid;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .color-options {
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    }

    .time-options {
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    }

    .card {
      border: 2px solid rgba(141, 110, 99, 0.3);
      padding: 1rem;
      border-radius: 12px;
      text-align: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: rgba(255, 255, 255, 0.9);
      cursor: pointer;
      color: ${COLORS.textPrimary};
      box-shadow: 0 0.3vh 1vh rgba(141, 110, 99, 0.2);
    }

    .card:hover {
      border-color: #8d6e63;
      box-shadow: 0 0.5vh 1.5vh rgba(141, 110, 99, 0.3);
      transform: translateY(-2px);
    }

    .card.selected {
      border-color: #8d6e63;
      box-shadow: 0 0 0 0.2vh rgba(141, 110, 99, 0.2), 0 0.8vh 1.5vh rgba(141, 110, 99, 0.3);
      background: linear-gradient(135deg, rgba(141, 110, 99, 0.1) 0%, rgba(109, 76, 65, 0.15) 100%);
      transform: translateY(-2px) scale(1.02);
    }

    .card div {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .card small {
      color: ${COLORS.textSecondary};
    }

    .card.selected small {
      color: ${COLORS.textPrimary};
    }

    .preview {
      margin-bottom: 2rem;
      display: flex;
      gap: 1rem;
      justify-content: space-between;
      color: ${COLORS.textPrimary};
      font-size: 0.9rem;
    }

    .preview div {
      flex: 1;
      background: rgba(255, 255, 255, 0.9);
      padding: 1rem;
      border-radius: 10px;
      border: 0.1vh solid rgba(141, 110, 99, 0.2);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      box-shadow: 0 0.5vh 1vh rgba(141, 110, 99, 0.1);
    }

    .preview svg {
      color: #8d6e63;
    }

    .start-btn {
      width: 100%;
      padding: 1.2rem;
      border: none;
      background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
      color: white;
      font-weight: bold;
      font-size: 1rem;
      border-radius: 1.2rem;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0.6vh 1.8vh rgba(76, 175, 80, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      position: relative;
      overflow: hidden;
    }

    .start-btn:hover {
      box-shadow: 0 0.8vh 2vh rgba(76, 175, 80, 0.4);
      transform: translateY(-2px) scale(1.02);
    }

    .start-btn:disabled {
      background: linear-gradient(135deg, #bbb 0%, #999 100%);
      cursor: not-allowed;
      box-shadow: 0 0.3vh 1vh rgba(0, 0, 0, 0.2);
      transform: none;
    }

    @media (max-width: 768px) {
      .panel {
        padding: 1.5rem;
        margin: 1rem;
      }
      
      .options-grid {
        gap: 0.8rem;
      }
      
      .preview {
        flex-direction: column;
        gap: 0.8rem;
      }
    }
  `

  return (
    <>
      <style>{styles}</style>
      <div className="setup">
        {/* Animated background elements */}
        <div className="background-elements">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="floating-piece"
              style={{
                top: `${10 + i * 12}%`,
                left: `${5 + (i % 2) * 90}%`,
                animationDelay: `${i * 0.7}s`,
              }}
            >
              {["♔", "♛", "♜", "♝", "♞", "♟", "♚", "♕"][i]}
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="header">
            <div className="icon">♔</div>
            <h2>Chess vs Engine</h2>
            <p>Challenge Stockfish in your chosen mode</p>
          </div>

          <div className="options-grid color-options">
            <div className={`card ${playAs === "w" ? "selected" : ""}`} onClick={() => setPlayAs("w")}>
              <div>⚪ White</div>
              <small>You move first</small>
            </div>
            <div className={`card ${playAs === "b" ? "selected" : ""}`} onClick={() => setPlayAs("b")}>
              <div>⚫ Black</div>
              <small>Engine moves first</small>
            </div>
          </div>

          <div className="options-grid time-options">
            {timeOptions.map((opt) => (
              <div
                key={opt.value}
                className={`card ${selectedTime === opt.value ? "selected" : ""}`}
                onClick={() => setSelectedTime(opt.value)}
              >
                <div>{opt.label}</div>
                <small>{opt.description}</small>
              </div>
            ))}
          </div>

          <div className="preview">
            <div>
              <User size={16} /> {username} <br />
              Color: {playAs === "w" ? "White" : "Black"} <br />
              Time: {selectedTime || "--"} min
            </div>
            <div>
              <Bot size={16} /> Stockfish <br />
              Color: {playAs === "w" ? "Black" : "White"} <br />
              Time: {selectedTime || "--"} min
            </div>
          </div>

          <button onClick={handleStartGame} disabled={!selectedTime} className="start-btn">
            <Play size={18} />
            {selectedTime ? "Start Game" : "Select Time Control"}
          </button>
        </div>
      </div>
    </>
  )
}

export default GameSetup
