"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Chess } from "chess.js"
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore"
import { firestore } from "../utils/firebase"

const useRealtimeChess = (roomId, playerColor, username, timeLimit) => {
  // Game state
  const [gameState, setGameState] = useState({
    fen: new Chess().fen(),
    board: new Chess().board(),
    turn: "w",
    history: [], // This will now store the actual move history from Firebase
    isCheck: false,
    isCheckmate: false,
    isStalemate: false,
    isGameOver: false,
    winner: null,
    capturedPieces: { white: [], black: [] },
  })

  // UI state
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [possibleMoves, setPossibleMoves] = useState([])
  const [captureSquares, setCaptureSquares] = useState([])
  const [lastMove, setLastMove] = useState([])

  // Room state
  const [roomInfo, setRoomInfo] = useState(null)
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [opponentConnected, setOpponentConnected] = useState(true)

  // Timer state
  const [timeLeft, setTimeLeft] = useState({
    white: timeLimit * 60,
    black: timeLimit * 60,
  })

  // Refs for performance and consistency
  const gameInstance = useRef(new Chess())
  const timerInterval = useRef(null)
  const roomRef = useRef(doc(firestore, "rooms", roomId))
  const isProcessingMove = useRef(false)
  const lastFirebaseUpdate = useRef(0)
  const timerUpdateRef = useRef(null)
  const gameStartTimeRef = useRef(null)

  // Optimized game analysis with memoization
  const analyzePosition = useCallback((game) => {
    const capturedPieces = { white: [], black: [] }
    const initialPieces = {
      white: ["r", "n", "b", "q", "k", "b", "n", "r", "p", "p", "p", "p", "p", "p", "p", "p"],
      black: ["r", "n", "b", "q", "k", "b", "n", "r", "p", "p", "p", "p", "p", "p", "p", "p"],
    }

    const currentPieces = { white: [], black: [] }
    const board = game.board()

    // Count current pieces efficiently
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = board[row][col]
        if (square) {
          currentPieces[square.color === "w" ? "white" : "black"].push(square.type)
        }
      }
    }
    // Calculate captured pieces
    ;["white", "black"].forEach((color) => {
      const initial = [...initialPieces[color]]
      const current = [...currentPieces[color]]

      initial.forEach((piece) => {
        const index = current.indexOf(piece)
        if (index !== -1) {
          current.splice(index, 1)
        } else {
          capturedPieces[color === "white" ? "black" : "white"].push(piece)
        }
      })
    })

    return {
      capturedPieces,
      isCheck: game.inCheck(),
      isCheckmate: game.isCheckmate(),
      isStalemate: game.isStalemate(),
    }
  }, [])

  // Optimized game creation
  const createGameFromFen = useCallback((fen) => {
    try {
      const game = new Chess()
      if (fen && fen !== new Chess().fen()) {
        game.load(fen)
      }
      return game
    } catch (error) {
      console.error("Invalid FEN:", error)
      return new Chess()
    }
  }, [])

  // Enhanced Firebase update handler with proper winner detection
  const updateGameFromFirebase = useCallback(
    (data) => {
      if (!data || lastFirebaseUpdate.current === data.version) return

      console.log("🔄 Firebase update:", data.version, "Winner:", data.winner, "Game Over:", data.gameOver)
      lastFirebaseUpdate.current = data.version || 0

      try {
        const game = createGameFromFen(data.gameState || new Chess().fen())
        gameInstance.current = game

        const analysis = analyzePosition(game)

        // Use the move history from Firebase, not from the game instance
        const moveHistory = data.moveHistory || []

        // ENHANCED GAME OVER DETECTION
        let isGameOver = data.gameOver || false
        let winner = data.winner || null

        // Double-check game over conditions if not already set
        if (!isGameOver && game.isGameOver()) {
          isGameOver = true

          if (game.isCheckmate()) {
            winner = game.turn() === "w" ? "Black" : "White"
            console.log(`🏆 Detected CHECKMATE! ${winner} wins`)
          } else if (game.isStalemate()) {
            winner = "Draw"
            console.log("🤝 Detected STALEMATE!")
          } else if (game.isInsufficientMaterial()) {
            winner = "Draw"
            console.log("🤝 Detected INSUFFICIENT MATERIAL!")
          } else if (game.isThreefoldRepetition()) {
            winner = "Draw"
            console.log("🤝 Detected THREEFOLD REPETITION!")
          } else {
            winner = "Draw"
            console.log("🤝 Detected DRAW!")
          }

          // Update Firebase with detected game end
          updateDoc(roomRef.current, {
            gameOver: true,
            winner: winner,
            endReason: game.isCheckmate() ? "checkmate" : game.isStalemate() ? "stalemate" : "draw",
            version: (data.version || 0) + 1,
          }).catch(console.error)
        }

        // Batch state updates to prevent multiple re-renders
        const newGameState = {
          fen: game.fen(),
          board: game.board(),
          turn: game.turn(),
          history: moveHistory,
          isCheck: analysis.isCheck,
          isCheckmate: analysis.isCheckmate,
          isStalemate: analysis.isStalemate,
          isGameOver: isGameOver,
          winner: winner,
          capturedPieces: analysis.capturedPieces,
        }

        setGameState(newGameState)
        setRoomInfo(data)
        setIsGameStarted(data.gameStarted || false)
        setLastMove(data.lastMove || [])

        // Handle timer updates more efficiently
        if (data.gameStarted && !isGameOver) {
          const newWhiteTime = data.whiteTime ?? timeLimit * 60
          const newBlackTime = data.blackTime ?? timeLimit * 60

          setTimeLeft((prev) => {
            const shouldUpdateWhite = Math.abs(prev.white - newWhiteTime) > 2
            const shouldUpdateBlack = Math.abs(prev.black - newBlackTime) > 2

            if (shouldUpdateWhite || shouldUpdateBlack) {
              return {
                white: newWhiteTime,
                black: newBlackTime,
              }
            }
            return prev
          })

          if (data.gameStartedAt && !gameStartTimeRef.current) {
            gameStartTimeRef.current = data.gameStartedAt.toMillis?.() || data.gameStartedAt
          }
        }

        // Enhanced turn calculation
        const currentTurn = game.turn()
        const isMyActualTurn =
          currentTurn === playerColor &&
          (data.gameStarted || false) &&
          !isGameOver &&
          !data.gameOver &&
          data.status === "playing"

        setIsMyTurn(isMyActualTurn)

        // Clear selection when it's not my turn
        if (!isMyActualTurn) {
          setSelectedSquare(null)
          setPossibleMoves([])
          setCaptureSquares([])
        }

        // Check opponent connection
        const now = Date.now()
        const opponentLastSeen = playerColor === "w" ? data.guestLastSeen : data.hostLastSeen
        let isOpponentConnected = true

        if (opponentLastSeen) {
          try {
            const lastSeenTime = opponentLastSeen?.toMillis?.() || opponentLastSeen
            isOpponentConnected = now - lastSeenTime < 15000
          } catch (err) {
            console.warn("Error parsing opponent last seen time:", err)
            isOpponentConnected = true
          }
        }

        setOpponentConnected(isOpponentConnected)
      } catch (error) {
        console.error("Error updating game from Firebase:", error)
      }
    },
    [playerColor, timeLimit, createGameFromFen, analyzePosition],
  )

  // Optimized Firebase listener with better error handling
  useEffect(() => {
    console.log("🔌 Setting up optimized Firebase listener")

    const unsubscribe = onSnapshot(
      roomRef.current,
      {
        includeMetadataChanges: false,
      },
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data()
          clearTimeout(timerUpdateRef.current)
          timerUpdateRef.current = setTimeout(() => {
            updateGameFromFirebase(data)
          }, 50)
        } else {
          console.error("Room does not exist")
        }
      },
      (error) => {
        console.error("Firebase listener error:", error)
        setTimeout(() => {
          console.log("Retrying Firebase connection...")
        }, 2000)
      },
    )

    return () => {
      console.log("🔌 Cleaning up Firebase listener")
      unsubscribe()
      if (timerUpdateRef.current) {
        clearTimeout(timerUpdateRef.current)
      }
    }
  }, [updateGameFromFirebase])

  // Improved timer logic with better synchronization and winner detection
  useEffect(() => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current)
    }

    if (!isGameStarted || gameState.isGameOver) {
      return
    }

    console.log("⏰ Starting optimized timer")

    timerInterval.current = setInterval(async () => {
      setTimeLeft((prevTime) => {
        const activeColor = gameState.turn === "w" ? "white" : "black"
        const currentPlayerTime = prevTime[activeColor]

        if (currentPlayerTime <= 0) {
          return prevTime
        }

        const newTime = Math.max(0, currentPlayerTime - 1)
        const newTimeState = {
          ...prevTime,
          [activeColor]: newTime,
        }

        // Update Firebase less frequently to reduce load
        if (newTime % 3 === 0 || newTime === 0) {
          const updateData = {
            [gameState.turn === "w" ? "whiteTime" : "blackTime"]: newTime,
            lastActivity: serverTimestamp(),
          }

          // TIME OUT - DECLARE WINNER
          if (newTime === 0) {
            const winner = gameState.turn === "w" ? "Black" : "White"
            updateData.gameOver = true
            updateData.winner = winner
            updateData.timeoutWinner = true
            updateData.endReason = "timeout"

            console.log(`⏰ TIME OUT! ${winner} wins by timeout`)
          }

          updateDoc(roomRef.current, updateData).catch((error) => {
            console.error("Timer update error:", error)
          })
        }

        return newTimeState
      })
    }, 1000)

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
      }
    }
  }, [isGameStarted, gameState.isGameOver, gameState.turn])

  // Optimized move making with move history tracking and proper winner detection
  const makeMove = useCallback(
    async (from, to) => {
      if (!isMyTurn || isProcessingMove.current || gameState.isGameOver) {
        return false
      }

      if (gameState.turn !== playerColor) {
        return false
      }

      if (!from || !to || from === to) {
        return false
      }

      isProcessingMove.current = true

      try {
        const game = new Chess(gameState.fen)
        const move = game.move({ from, to, promotion: "q" })

        if (!move) {
          return false
        }

        console.log("✅ Making move:", move.san)

        // Create updated move history
        const newMoveHistory = [...gameState.history, move.san]
        console.log("📝 New move history:", newMoveHistory)

        // ENHANCED GAME END DETECTION
        let winner = null
        let gameOver = false
        let endReason = null

        if (game.isGameOver()) {
          gameOver = true

          if (game.isCheckmate()) {
            // The player who just moved wins (opponent is in checkmate)
            winner = game.turn() === "w" ? "Black" : "White"
            endReason = "checkmate"
            console.log(`🏆 CHECKMATE! ${winner} wins`)
          } else if (game.isStalemate()) {
            winner = "Draw"
            endReason = "stalemate"
            console.log("🤝 STALEMATE! Game is a draw")
          } else if (game.isInsufficientMaterial()) {
            winner = "Draw"
            endReason = "insufficient_material"
            console.log("🤝 INSUFFICIENT MATERIAL! Game is a draw")
          } else if (game.isThreefoldRepetition()) {
            winner = "Draw"
            endReason = "threefold_repetition"
            console.log("🤝 THREEFOLD REPETITION! Game is a draw")
          } else {
            winner = "Draw"
            endReason = "draw"
            console.log("🤝 DRAW! Game ended in a draw")
          }
        }

        // Optimized Firebase update with move history and winner detection
        const updateData = {
          gameState: game.fen(),
          lastMove: [from, to],
          moveHistory: newMoveHistory,
          gameOver,
          winner,
          endReason,
          lastMoveTime: serverTimestamp(),
          lastMoveSan: move.san,
          moveCount: newMoveHistory.length,
          version: (roomInfo?.version || 0) + 1,
        }

        console.log("🔥 Updating Firebase with game result:", { gameOver, winner, endReason })
        await updateDoc(roomRef.current, updateData)
        return true
      } catch (error) {
        console.error("Move error:", error)
        return false
      } finally {
        isProcessingMove.current = false
      }
    },
    [isMyTurn, gameState.fen, gameState.turn, gameState.isGameOver, gameState.history, playerColor, roomInfo?.version],
  )

  // Optimized square click handler
  const handleSquareClick = useCallback(
    (square) => {
      if (!isMyTurn || gameState.isGameOver) {
        return
      }

      const piece = gameInstance.current.get(square)

      if (!piece && !selectedSquare) {
        return
      }

      if (!selectedSquare) {
        if (piece && piece.color === playerColor) {
          setSelectedSquare(square)
          const moves = gameInstance.current.moves({ square, verbose: true })
          setPossibleMoves(moves.map((m) => m.to))
          setCaptureSquares(moves.filter((m) => m.captured || m.flags.includes("c")).map((m) => m.to))
        }
        return
      }

      if (square === selectedSquare) {
        setSelectedSquare(null)
        setPossibleMoves([])
        setCaptureSquares([])
        return
      }

      if (piece && piece.color === playerColor) {
        setSelectedSquare(square)
        const moves = gameInstance.current.moves({ square, verbose: true })
        setPossibleMoves(moves.map((m) => m.to))
        setCaptureSquares(moves.filter((m) => m.captured || m.flags.includes("c")).map((m) => m.to))
        return
      }

      // Try to make move
      makeMove(selectedSquare, square).then((success) => {
        if (success) {
          setSelectedSquare(null)
          setPossibleMoves([])
          setCaptureSquares([])
        }
      })
    },
    [isMyTurn, selectedSquare, playerColor, makeMove, gameState.isGameOver],
  )

  // Optimized forfeit function
  const forfeitGame = useCallback(async () => {
    try {
      const winner = playerColor === "w" ? "Black" : "White"

      await updateDoc(roomRef.current, {
        gameOver: true,
        winner: winner,
        forfeited: true,
        forfeitedBy: playerColor,
        endReason: "forfeit",
        lastActivity: serverTimestamp(),
        version: (roomInfo?.version || 0) + 1,
      })

      return true
    } catch (error) {
      console.error("❌ Forfeit error:", error)
      throw error
    }
  }, [playerColor, roomInfo?.version])

  // Optimized reset function with move history reset
  const resetGame = useCallback(async () => {
    try {
      const newGame = new Chess()

      await updateDoc(roomRef.current, {
        gameState: newGame.fen(),
        gameStarted: true,
        gameOver: false,
        winner: null,
        forfeited: false,
        forfeitedBy: null,
        timeoutWinner: false,
        endReason: null,
        lastMove: [],
        lastMoveSan: null,
        moveCount: 0,
        moveHistory: [], // Reset move history
        whiteTime: timeLimit * 60,
        blackTime: timeLimit * 60,
        gameStartedAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        version: (roomInfo?.version || 0) + 1,
      })

      // Reset local timer state
      setTimeLeft({
        white: timeLimit * 60,
        black: timeLimit * 60,
      })

      gameStartTimeRef.current = Date.now()
    } catch (error) {
      console.error("❌ Reset error:", error)
      throw error
    }
  }, [timeLimit, roomInfo?.version])

  // Status message
  const getGameStatusMessage = useCallback(() => {
    if (!isGameStarted) return "Game not started"
    if (gameState.isGameOver) {
      if (roomInfo?.forfeited) {
        return `Game forfeited by ${roomInfo.forfeitedBy === playerColor ? "you" : "opponent"}`
      }
      if (roomInfo?.timeoutWinner) {
        return `Time's up! ${gameState.winner} wins`
      }
      if (gameState.isCheckmate) {
        return `Checkmate! ${gameState.winner} wins`
      }
      if (gameState.isStalemate) {
        return "Stalemate - Draw"
      }
      return `Game over - ${gameState.winner}`
    }
    if (gameState.isCheck) {
      return `${gameState.turn === "w" ? "White" : "Black"} is in check!`
    }
    return `${gameState.turn === "w" ? "White" : "Black"} to move`
  }, [isGameStarted, gameState, roomInfo, playerColor])

  return {
    // Game state
    gameState,
    selectedSquare,
    possibleMoves,
    captureSquares,
    lastMove,

    // Room state
    roomInfo,
    isGameStarted,
    isMyTurn,
    timeLeft,
    opponentConnected,

    // Actions
    handleSquareClick,
    forfeitGame,
    resetGame,
    getGameStatusMessage,
  }
}

export default useRealtimeChess
