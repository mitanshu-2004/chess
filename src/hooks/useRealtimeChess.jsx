"use client"

// src/hooks/useRealtimeChess.js - Enhanced with better game features
import { useState, useEffect, useRef, useCallback } from "react"
import { Chess } from "chess.js"
import { doc, onSnapshot, updateDoc } from "firebase/firestore"
import { firestore } from "../utils/firebase"

const useRealtimeChess = (roomId, playerColor, username, timeLimit) => {
  // Game state
  const [gameState, setGameState] = useState({
    fen: new Chess().fen(),
    board: new Chess().board(),
    turn: "w",
    history: [],
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
  const [moveCount, setMoveCount] = useState(0)

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

  // Refs
  const gameInstance = useRef(new Chess())
  const timerInterval = useRef(null)
  const roomRef = useRef(doc(firestore, "rooms", roomId))
  const isProcessingMove = useRef(false)

  // Enhanced game analysis
  const analyzePosition = useCallback((game) => {
    const capturedPieces = { white: [], black: [] }
    const initialPieces = {
      white: ["r", "n", "b", "q", "k", "b", "n", "r", "p", "p", "p", "p", "p", "p", "p", "p"],
      black: ["r", "n", "b", "q", "k", "b", "n", "r", "p", "p", "p", "p", "p", "p", "p", "p"],
    }

    const currentPieces = { white: [], black: [] }
    const board = game.board()

    // Count current pieces
    board.forEach((row) => {
      row.forEach((square) => {
        if (square) {
          currentPieces[square.color === "w" ? "white" : "black"].push(square.type)
        }
      })
    })

    // Calculate captured pieces - pieces that the opposite color captured
    ;["white", "black"].forEach((color) => {
      const initial = [...initialPieces[color]]
      const current = [...currentPieces[color]]

      initial.forEach((piece) => {
        const index = current.indexOf(piece)
        if (index !== -1) {
          current.splice(index, 1)
        } else {
          // This piece was captured by the opposite color
          capturedPieces[color === "white" ? "black" : "white"].push(piece)
        }
      })
    })

    return {
      capturedPieces,
      isCheck: game.inCheck(),
      isCheckmate: game.isCheckmate(),
      isStalemate: game.isStalemate(),
      isThreefoldRepetition: game.isThreefoldRepetition(),
      isInsufficientMaterial: game.isInsufficientMaterial(),
    }
  }, [])

  // Create game instance from FEN
  const createGameFromFen = useCallback((fen) => {
    try {
      const game = new Chess()
      game.load(fen)
      return game
    } catch (error) {
      console.error("Invalid FEN:", error)
      return new Chess()
    }
  }, [])

  // Update game state from Firebase
  const updateGameFromFirebase = useCallback(
    (data) => {
      if (!data) return

      console.log("🔄 Updating from Firebase:", data)

      try {
        const game = createGameFromFen(data.gameState || new Chess().fen())
        gameInstance.current = game

        const analysis = analyzePosition(game)

        setGameState({
          fen: game.fen(),
          board: game.board(),
          turn: game.turn(),
          history: game.history(),
          isCheck: analysis.isCheck,
          isCheckmate: analysis.isCheckmate,
          isStalemate: analysis.isStalemate,
          isGameOver: game.isGameOver(),
          winner: data.winner || null,
          capturedPieces: analysis.capturedPieces,
        })

        setMoveCount(game.history().length)
        setRoomInfo(data)
        setIsGameStarted(data.gameStarted || false)

        // Enhanced turn calculation with better validation
        const currentTurn = game.turn()
        const isMyActualTurn =
          currentTurn === playerColor && 
          (data.gameStarted || false) && 
          !game.isGameOver() && 
          !data.gameOver &&
          data.status === "playing"

        console.log(
          `🎯 Turn Check: current=${currentTurn}, player=${playerColor}, started=${data.gameStarted}, gameOver=${game.isGameOver()}, status=${data.status}, isMyTurn=${isMyActualTurn}`,
        )

        setIsMyTurn(isMyActualTurn)
        setLastMove(data.lastMove || [])

        setTimeLeft({
          white: data.whiteTime || timeLimit * 60,
          black: data.blackTime || timeLimit * 60,
        })

        // Check opponent connection with better error handling
        const now = Date.now()
        const opponentLastSeen = playerColor === "w" ? data.guestLastSeen : data.hostLastSeen
        let isOpponentConnected = true
        
        if (opponentLastSeen) {
          try {
            const lastSeenTime = opponentLastSeen?.toMillis?.() || opponentLastSeen
            isOpponentConnected = now - lastSeenTime < 30000
          } catch (err) {
            console.warn("Error parsing opponent last seen time:", err)
            isOpponentConnected = true // Default to connected if we can't parse
          }
        }
        
        setOpponentConnected(isOpponentConnected)

        // Clear selection when it's not my turn
        if (!isMyActualTurn) {
          setSelectedSquare(null)
          setPossibleMoves([])
          setCaptureSquares([])
        }
      } catch (error) {
        console.error("Error updating game from Firebase:", error)
        // Don't crash the app, just log the error
      }
    },
    [playerColor, timeLimit, createGameFromFen, analyzePosition],
  )

  // Firebase listener
  useEffect(() => {
    console.log("🔌 Setting up Firebase listener")

    const unsubscribe = onSnapshot(
      roomRef.current,
      (snapshot) => {
        if (snapshot.exists()) {
          updateGameFromFirebase(snapshot.data())
        } else {
          console.error("Room does not exist")
        }
      },
      (error) => {
        console.error("Firebase listener error:", error)
      },
    )

    return () => {
      console.log("🔌 Cleaning up Firebase listener")
      unsubscribe()
    }
  }, [updateGameFromFirebase])

  // Enhanced timer logic
  useEffect(() => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current)
    }

    if (!isGameStarted || gameState.isGameOver) {
      return
    }

    console.log("⏰ Starting timer for", gameState.turn)

    timerInterval.current = setInterval(async () => {
      const currentPlayerTime = gameState.turn === "w" ? timeLeft.white : timeLeft.black
      const newTime = Math.max(0, currentPlayerTime - 1)

      // Update local state immediately
      setTimeLeft((prev) => ({
        ...prev,
        [gameState.turn === "w" ? "white" : "black"]: newTime,
      }))

      // Update Firebase every 5 seconds or when time runs out
      if (newTime % 5 === 0 || newTime === 0) {
        try {
          const updateData = {
            [gameState.turn === "w" ? "whiteTime" : "blackTime"]: newTime,
          }

          if (newTime === 0) {
            updateData.gameOver = true
            updateData.winner = gameState.turn === "w" ? "Black" : "White"
            updateData.timeoutWinner = true
            updateData.endReason = "timeout"
          }

          await updateDoc(roomRef.current, updateData)
        } catch (error) {
          console.error("Timer update error:", error)
        }
      }
    }, 1000)

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current)
      }
    }
  }, [isGameStarted, gameState.isGameOver, gameState.turn, timeLeft])

  // Enhanced make move function
  const makeMove = useCallback(
    async (from, to) => {
      if (!isMyTurn || isProcessingMove.current || gameState.isGameOver) {
        console.log("❌ Move blocked:", {
          isMyTurn,
          isProcessing: isProcessingMove.current,
          gameOver: gameState.isGameOver,
        })
        return false
      }

      // Double check turn
      if (gameState.turn !== playerColor) {
        console.log("❌ Not your turn:", { gameTurn: gameState.turn, playerColor })
        return false
      }

      // Additional validation
      if (!from || !to || from === to) {
        console.log("❌ Invalid move coordinates:", { from, to })
        return false
      }

      isProcessingMove.current = true

      try {
        const game = new Chess(gameState.fen)
        
        // Validate the move before making it
        const moves = game.moves({ verbose: true })
        const isValidMove = moves.some(move => move.from === from && move.to === to)
        
        if (!isValidMove) {
          console.log("❌ Move not in legal moves list:", { from, to })
          return false
        }

        const move = game.move({ from, to, promotion: "q" })

        if (!move) {
          console.log("❌ Invalid move:", from, "to", to)
          return false
        }

        console.log("✅ Valid move:", move.san, "from", from, "to", to)

        // Determine game end with enhanced logic
        let winner = null
        let gameOver = false
        let endReason = null

        if (game.isGameOver()) {
          gameOver = true
          if (game.isCheckmate()) {
            winner = game.turn() === "w" ? "Black" : "White"
            endReason = "checkmate"
          } else if (game.isStalemate()) {
            winner = "Draw"
            endReason = "stalemate"
          } else if (game.isThreefoldRepetition()) {
            winner = "Draw"
            endReason = "threefold_repetition"
          } else if (game.isInsufficientMaterial()) {
            winner = "Draw"
            endReason = "insufficient_material"
          } else {
            winner = "Draw"
            endReason = "draw"
          }
        }

        // Update Firebase with enhanced data
        const updateData = {
          gameState: game.fen(),
          lastMove: [from, to],
          gameOver,
          winner,
          endReason,
          lastMoveTime: Date.now(),
          lastMoveSan: move.san,
          moveCount: game.history().length,
        }

        // Add timeout handling if time is up
        if (timeLeft[gameState.turn === "w" ? "white" : "black"] <= 0) {
          updateData.gameOver = true
          updateData.winner = gameState.turn === "w" ? "Black" : "White"
          updateData.timeoutWinner = true
          updateData.endReason = "timeout"
        }

        await updateDoc(roomRef.current, updateData)

        return true
      } catch (error) {
        console.error("Move error:", error)
        return false
      } finally {
        isProcessingMove.current = false
      }
    },
    [isMyTurn, gameState.fen, gameState.turn, gameState.isGameOver, playerColor, timeLeft],
  )

  // Enhanced square click handler
  const handleSquareClick = useCallback(
    (square) => {
      console.log(
        `🎯 Square clicked: ${square}, isMyTurn: ${isMyTurn}, turn: ${gameState.turn}, playerColor: ${playerColor}`,
      )

      if (!isMyTurn || gameState.isGameOver) {
        console.log("❌ Click ignored - not your turn or game over")
        return
      }

      const piece = gameInstance.current.get(square)
      console.log(`🏃 Piece at ${square}:`, piece)

      // If clicking on empty square and no piece selected, do nothing
      if (!piece && !selectedSquare) {
        return
      }

      // If no piece selected, try to select one
      if (!selectedSquare) {
        if (piece && piece.color === playerColor) {
          console.log(`✅ Selecting piece at ${square}:`, piece)
          setSelectedSquare(square)
          const moves = gameInstance.current.moves({ square, verbose: true })
          console.log(
            `📍 Legal moves for ${square}:`,
            moves.map((m) => m.to),
          )
          setPossibleMoves(moves.map((m) => m.to))
          setCaptureSquares(moves.filter((m) => m.captured).map((m) => m.to))
        } else {
          console.log("❌ Cannot select - not your piece or no piece")
        }
        return
      }

      // If clicking same square, deselect
      if (square === selectedSquare) {
        console.log("🔄 Deselecting piece")
        setSelectedSquare(null)
        setPossibleMoves([])
        setCaptureSquares([])
        return
      }

      // If clicking on another piece of same color, select it instead
      if (piece && piece.color === playerColor) {
        console.log(`🔄 Switching selection to ${square}`)
        setSelectedSquare(square)
        const moves = gameInstance.current.moves({ square, verbose: true })
        setPossibleMoves(moves.map((m) => m.to))
        setCaptureSquares(moves.filter((m) => m.captured).map((m) => m.to))
        return
      }

      // Try to make move
      console.log(`🎯 Attempting move from ${selectedSquare} to ${square}`)
      makeMove(selectedSquare, square).then((success) => {
        if (success) {
          setSelectedSquare(null)
          setPossibleMoves([])
          setCaptureSquares([])
        } else {
          console.log("❌ Move failed")
        }
      })
    },
    [isMyTurn, selectedSquare, playerColor, makeMove, gameState.isGameOver, gameState.turn],
  )

  // Enhanced forfeit game - opponent wins (FIXED)
  const forfeitGame = useCallback(async () => {
    try {
      console.log("🏳️ Forfeiting game for player:", playerColor)
      const winner = playerColor === "w" ? "Black" : "White"

      await updateDoc(roomRef.current, {
        gameOver: true,
        winner: winner,
        forfeited: true,
        forfeitedBy: playerColor,
        endReason: "forfeit",
        lastActivity: Date.now(),
        gameState: gameInstance.current.fen(), // Keep current game state
        lastMoveTime: Date.now(),
      })

      console.log("✅ Game forfeited successfully, winner:", winner)
      return true
    } catch (error) {
      console.error("❌ Forfeit error:", error)
      throw error
    }
  }, [playerColor])

  // Enhanced reset game
  const resetGame = useCallback(async () => {
    try {
      console.log("🔄 Resetting game...")
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
        whiteTime: timeLimit * 60,
        blackTime: timeLimit * 60,
        lastActivity: Date.now(),
      })

      console.log("✅ Game reset successfully")
    } catch (error) {
      console.error("❌ Reset error:", error)
      throw error
    }
  }, [timeLimit])

  // Get game status message
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
    moveCount,

    // Room state
    roomInfo,
    isGameStarted,
    isMyTurn,
    timeLeft,
    opponentConnected,

    // Actions
    handleSquareClick,
    forfeitGame, // Fixed function name
    resetGame,
    getGameStatusMessage,
  }
}

export default useRealtimeChess
