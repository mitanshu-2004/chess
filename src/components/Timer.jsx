"use client"

const Timer = ({ time, isActive }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(Math.max(0, seconds) / 60)
    const secs = Math.max(0, seconds) % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const customStyles = `
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }

    @keyframes glow {
      0% { box-shadow: 0 0 5px rgba(141, 110, 99, 0.3); }
      100% { box-shadow: 0 0 15px rgba(141, 110, 99, 0.6); }
    }

    .timer-container {
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      color: #4e342e;
      padding: 0.8rem 1.2rem;
      border-radius: 12px;
      font-family: 'Segoe UI Mono', monospace;
      font-size: 1.6rem;
      font-weight: bold;
      text-align: center;
      box-shadow: 0 0.3vh 1vh rgba(141, 110, 99, 0.2);
      min-width: 120px;
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
      box-shadow: 0 0.5vh 1.5vh rgba(141, 110, 99, 0.4);
      animation: pulse 2s ease-in-out infinite;
    }

    .timer-container.active::before {
      opacity: 0;
    }

    .timer-container:hover::before {
      opacity: 1;
    }

    .timer-display {
      flex-grow: 1;
      position: relative;
      z-index: 2;
      text-shadow: ${isActive ? "0 0.1vh 0.3vh rgba(0, 0, 0, 0.3)" : "none"};
    }

    .timer-container:hover {
      box-shadow: 0 0.5vh 1.5vh rgba(141, 110, 99, 0.3);
      transform: translateY(-1px);
    }

    .timer-container.active:hover {
      box-shadow: 0 0.6vh 1.8vh rgba(141, 110, 99, 0.5);
    }
  `

  return (
    <>
      <style>{customStyles}</style>
      <div className={`timer-container ${isActive ? "active" : ""}`}>
        <span className="timer-display">{formatTime(time)}</span>
      </div>
    </>
  )
}

export default Timer
