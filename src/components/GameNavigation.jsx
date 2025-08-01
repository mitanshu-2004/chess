"use client"
import { Play, Plus, LayoutGrid, Users } from "lucide-react"
import { COLORS } from "../utils/colors"

const GameNavigation = () => {
  const styles = `
    .nav-panel {
      background: ${COLORS.bgLight2};
      padding: 1rem;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      width: 100%;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border: 1px solid ${COLORS.bgMedium};
    }
    .nav-button {
      background: ${COLORS.bgMedium};
      color: ${COLORS.textPrimary};
      border: none;
      padding: 0.75rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s;
      box-shadow: 0 2px 5px rgba(0,0,0,0.08);
    }
    .nav-button:hover {
      background: ${COLORS.textLight};
      color: ${COLORS.textWhite};
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.12);
    }
    .nav-button:active {
      transform: scale(0.98);
    }
    .nav-button svg {
      color: inherit; /* Inherit color from button text */
    }

    @media (max-width: 768px) {
      .nav-panel {
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
        max-width: 100%;
      }
      .nav-button {
        flex: 1 1 40%;
        min-width: 130px;
        font-size: 0.85rem;
        padding: 0.5rem;
      }
    }
  `

  return (
    <>
      <style>{styles}</style>
      <div className="nav-panel">
        <button className="nav-button">
          <Play size={16} /> Play
        </button>
        <button className="nav-button">
          <Plus size={16} /> New Game
        </button>
        <button className="nav-button">
          <LayoutGrid size={16} /> Games
        </button>
        <button className="nav-button">
          <Users size={16} /> Players
        </button>
      </div>
    </>
  )
}

export default GameNavigation
