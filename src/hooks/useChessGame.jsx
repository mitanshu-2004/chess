"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Chess } from "chess.js"
import { getBestMoveFromStockfish, initEngine } from "../utils/engine"

const squareName = (row, col) => "abcdefgh"[col] + (8 - row)

const useChessGame = () => {
  const [game, setGame] = useState(new Chess())
  const [selected, setSelected] = useState(null)
  const [legalMoves, setLegalMoves] = useState([])
  const [captureTargets, setCaptureTargets] = useState([])
  const [moveHistory, setMoveHistory] = useState([])
  const [whiteTime, setWhiteTime] = useState(0)
  const [blackTime, setBlackTime] = useState(0)
  const [initialTime, setInitialTime] = useState(null)
  const [currentTurn, setCurrentTurn] = useState("w")
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  const [playAs, setPlayAs] = useState("w")
  const [gameStarted, setGameStarted] = useState(false)
  const [selectedTime, setSelectedTime] = useState(null)
  const [playerScore, setPlayerScore] = useState(0)
  const [engineScore, setEngineScore] = useState(0)
  const [wasAborted, setWasAborted] = useState(false)
  const [ifTimeout, setifTimeout] = useState(false)
  const [lastMoveSquares, setLastMoveSquares] = useState([])
  const [capturedPieces, setCapturedPieces] = useState({ white: [], black: [] })

  const intervalRef = useRef(null)
  const gameEndedRef = useRef(false)
  const scoreCountedRef = useRef(false)
  const lastTimerUpdate = useRef(Date.now())

  useEffect(() => {
    initEngine()
  }, [])

  const inCheck = game.inCheck()
  const displayBoard = playAs === "w" ? game.board() : [...game.board()].reverse()

  const calculateCapturedPieces = useCallback((currentBoard) => {
    const initialPieceCounts = {
      w: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
      b: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
    }

    const currentPieceCounts = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    }

    currentBoard.forEach((row) => {
      row.forEach((square) => {
        if (square) {
          currentPieceCounts[square.color][square.type]++
        }
      })
    })

    const captured = { white: [], black: [] }

    for (const type in initialPieceCounts.b) {
      const missing = initialPieceCounts.b[type] - currentPieceCounts.b[type]
      for (let i = 0; i < missing; i++) {
        captured.white.push(type)
      }
    }

    for (const type in initialPieceCounts.w) {
      const missing = initialPieceCounts.w[type] - currentPieceCounts.w[type]
      for (let i = 0; i < missing; i++) {
        captured.black.push(type)
      }
    }

    return captured
  }, [])

  useEffect(() => {
    setCapturedPieces(calculateCapturedPieces(game.board()))
  }, [game, calculateCapturedPieces])

  // Improved timer with better performance
  useEffect(() => {
    if (!gameStarted || gameOver) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      return
    }

    intervalRef.current = setInterval(() => {
      const now = Date.now()
      const deltaTime = now - lastTimerUpdate.current
      lastTimerUpdate.current = now

      // Only update if reasonable time has passed (prevent timer jumps)
      if (deltaTime > 2000) return

      const isPlayersTurn = currentTurn === playAs

      const updateTime = (setTime, timeoutWinner, winHandler) => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            if (!gameEndedRef.current) {
              gameEndedRef.current = true
              setGameOver(true)
              setifTimeout(true)
              setWinner(timeoutWinner)

              if (!scoreCountedRef.current) {
                winHandler((score) => score + 1)
                scoreCountedRef.current = true
              }
            }
            return 0
          }
          return prevTime - 1
        })
      }

      if (isPlayersTurn) {
        playAs === "w"
          ? updateTime(setWhiteTime, "Engine", setEngineScore)
          : updateTime(setBlackTime, "Engine", setEngineScore)
      } else {
        playAs === "w"
          ? updateTime(setBlackTime, "You", setPlayerScore)
          : updateTime(setWhiteTime, "You", setPlayerScore)
      }
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [currentTurn, gameOver, gameStarted, playAs])

  const startGameWithTime = (minutes) => {
    const seconds = minutes * 60
    const newGame = new Chess()

    setInitialTime(seconds)
    setWhiteTime(seconds)
    setBlackTime(seconds)
    setGame(newGame)
    setMoveHistory([])
    setSelected(null)
    setLegalMoves([])
    setCaptureTargets([])
    setCurrentTurn("w")
    setGameOver(false)
    setWinner(null)
    setGameStarted(true)
    setWasAborted(false)
    setifTimeout(false)
    setLastMoveSquares([])
    gameEndedRef.current = false
    scoreCountedRef.current = false
    setCapturedPieces({ white: [], black: [] })
    lastTimerUpdate.current = Date.now()

    if (playAs === "b") {
      setTimeout(() => makeComputerMove(newGame), 300)
    }
  }

  const makeComputerMove = (currentGame = game) => {
    if (ifTimeout || gameEndedRef.current) return

    const fen = currentGame.fen()

    getBestMoveFromStockfish(fen, (uciMove) => {
      if (!uciMove || gameEndedRef.current) {
        return
      }

      const move = currentGame.move({
        from: uciMove.slice(0, 2),
        to: uciMove.slice(2, 4),
        promotion: "q",
      })

      if (move) {
        const newGame = new Chess(currentGame.fen())
        setGame(newGame)
        setMoveHistory((prev) => [...prev, move.san])
        setCurrentTurn(newGame.turn())
        setLastMoveSquares([move.from, move.to])

        if (newGame.isGameOver() && !gameEndedRef.current) {
          gameEndedRef.current = true
          setGameOver(true)

          const result = newGame.isCheckmate() ? (newGame.turn() === playAs ? "Engine" : "You") : "Draw"
          setWinner(result)

          if (!scoreCountedRef.current) {
            if (result === "You") setPlayerScore((s) => s + 1)
            else if (result === "Engine") setEngineScore((s) => s + 1)
            scoreCountedRef.current = true
          }
        } else if (newGame.turn() !== playAs) {
          setTimeout(() => makeComputerMove(newGame), 300)
        }
      }
    })
  }

  const handleClick = (row, col) => {
    if (!gameStarted || gameOver || game.turn() !== playAs) return

    const trueRow = playAs === "w" ? row : 7 - row
    const square = squareName(trueRow, col)
    const piece = game.get(square)

    if (piece && piece.color === game.turn()) {
      setSelected(square)
      const moves = game.moves({ square, verbose: true })
      setLegalMoves(moves.map((m) => m.to))
      setCaptureTargets(moves.filter((m) => m.captured || m.flags.includes("c")).map((m) => m.to))
      return
    }

    if (selected) {
      const move = game.move({ from: selected, to: square, promotion: "q" })

      if (move) {
        const newGame = new Chess(game.fen())
        setGame(newGame)
        setMoveHistory((prev) => [...prev, move.san])
        setSelected(null)
        setLegalMoves([])
        setCaptureTargets([])
        setCurrentTurn(newGame.turn())
        setLastMoveSquares([move.from, move.to])

        if (newGame.isGameOver() && !gameEndedRef.current) {
          gameEndedRef.current = true
          setGameOver(true)

          const result = newGame.isCheckmate() ? (newGame.turn() === playAs ? "Engine" : "You") : "Draw"
          setWinner(result)

          if (!scoreCountedRef.current) {
            if (result === "You") setPlayerScore((s) => s + 1)
            else if (result === "Engine") setEngineScore((s) => s + 1)
            scoreCountedRef.current = true
          }
        } else if (newGame.turn() !== playAs) {
          setTimeout(() => makeComputerMove(newGame), 300)
        }
      } else {
        setSelected(null)
        setLegalMoves([])
        setCaptureTargets([])
      }
    }
  }

  const resetGame = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    setGame(new Chess())
    setSelected(null)
    setLegalMoves([])
    setCaptureTargets([])
    setMoveHistory([])
    setWhiteTime(initialTime || 0)
    setBlackTime(initialTime || 0)
    setCurrentTurn("w")
    setGameOver(false)
    setWinner(null)
    setGameStarted(false)
    setSelectedTime(null)
    setWasAborted(false)
    setifTimeout(false)
    setLastMoveSquares([])
    gameEndedRef.current = false
    scoreCountedRef.current = false
    setCapturedPieces({ white: [], black: [] })
    lastTimerUpdate.current = Date.now()
  }

  const abortGame = () => {
    if (!gameEndedRef.current) {
      gameEndedRef.current = true
      setWasAborted(true)
      setGameOver(true)
      setWinner("Engine")

      if (!scoreCountedRef.current) {
        setEngineScore((s) => s + 1)
        scoreCountedRef.current = true
      }
    }
  }

  return {
    game,
    selected,
    legalMoves,
    captureTargets,
    moveHistory,
    whiteTime,
    blackTime,
    currentTurn,
    gameOver,
    winner,
    playAs,
    gameStarted,
    selectedTime,
    playerScore,
    engineScore,
    wasAborted,
    ifTimeout,
    inCheck,
    displayBoard,
    lastMoveSquares,
    capturedPieces,
    setPlayAs,
    setSelectedTime,
    startGameWithTime,
    handleClick,
    resetGame,
    abortGame,
    initialTime,
  }
}

export default useChessGame
