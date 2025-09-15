"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useNavigate, useSearchParams, useParams } from "react-router-dom"
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from "firebase/firestore"
import { Chess } from "chess.js"
import { firestore } from "../utils/firebase"
import { COLORS } from "../utils/colors"

const MultiplayerRoom = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { roomId } = useParams()
  const username = searchParams.get("username")

  const [roomData, setRoomData] = useState(null)
  const [isHost, setIsHost] = useState(false)
  const [selectedTime, setSelectedTime] = useState(5)
  const [hostColor, setHostColor] = useState("w")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [linkCopied, setLinkCopied] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("connecting")
  const [myReady, setMyReady] = useState(false)

  // Create roomRef only once and store in ref
  const roomRefRef = useRef(null)
  const unsubscribeRef = useRef(null)
  const heartbeatRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const lastProcessedVersionRef = useRef(0)
  const heartbeatStartedRef = useRef(false)
  const isHostRef = useRef(false)
  const usernameRef = useRef(username)

  // Initialize roomRef only once
  useEffect(() => {
    if (roomId && !roomRefRef.current) {
      roomRefRef.current = doc(firestore, "rooms", roomId)
    }
  }, [roomId])

  // Update refs when values change
  useEffect(() => {
    usernameRef.current = username
  }, [username])

  // Connection heartbeat to maintain presence
  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current)

    heartbeatRef.current = setInterval(async () => {
      try {
        if (usernameRef.current) {
          const updateField = isHostRef.current ? "hostLastSeen" : "guestLastSeen"
          await updateDoc(roomRefRef.current, {
            [updateField]: serverTimestamp(),
            lastActivity: serverTimestamp(),
          })
          setConnectionStatus("connected")
        }
      } catch (err) {
        console.error("Heartbeat failed:", err)
        setConnectionStatus("reconnecting")

        setTimeout(() => {
          if (heartbeatRef.current) {
            setConnectionStatus("connected")
          }
        }, 2000)
      }
    }, 5000)
  }, [])

  // Enhanced connection monitoring
  const monitorConnection = useCallback(() => {
    const handleOnline = () => {
      setConnectionStatus("connected")
      console.log("Connection restored")
    }

    const handleOffline = () => {
      setConnectionStatus("disconnected")
      console.log("Connection lost")
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Cleanup function for all intervals and listeners
  const cleanup = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [])

  useEffect(() => {
    const cleanup = monitorConnection()
    return cleanup
  }, [])

  useEffect(() => {
    if (!username || !roomId) {
      setError("Missing username or room ID")
      return
    }

    if (roomRefRef.current && !loading) {
      return
    }

    const setupRoom = async () => {
      try {
        setConnectionStatus("connecting")
        const roomSnap = await getDoc(roomRefRef.current)

        let currentIsHost = false

        if (!roomSnap.exists()) {
          // Create new room with empty move history
          await setDoc(roomRefRef.current, {
            hostPlayer: username,
            guestPlayer: null,
            hostColor: "w",
            timeControl: 5,
            status: "waiting",
            createdAt: serverTimestamp(),
            gameStarted: false,
            gameOver: false,
            hostLastSeen: serverTimestamp(),
            guestLastSeen: null,
            hostReady: false,
            guestReady: false,
            lastActivity: serverTimestamp(),
            version: 1,
            moveHistory: [], // Initialize empty move history
          })
          currentIsHost = true
        } else {
          const data = roomSnap.data()

          if (data.hostPlayer === username) {
            currentIsHost = true
            await updateDoc(roomRefRef.current, {
              hostLastSeen: serverTimestamp(),
              lastActivity: serverTimestamp(),
            })
          } else if (data.guestPlayer === username) {
            currentIsHost = false
            await updateDoc(roomRefRef.current, {
              guestLastSeen: serverTimestamp(),
              lastActivity: serverTimestamp(),
            })
          } else if (!data.guestPlayer) {
            try {
              await updateDoc(roomRefRef.current, {
                guestPlayer: username,
                guestLastSeen: serverTimestamp(),
                lastActivity: serverTimestamp(),
                version: (data.version || 0) + 1,
              })
              currentIsHost = false
            } catch (err) {
              console.warn("Failed to join as guest, room might be full:", err)
              setError("Room is full or no longer available")
              setConnectionStatus("error")
              return
            }
          } else {
            setError("Room is full")
            setConnectionStatus("error")
            return
          }
        }

        isHostRef.current = currentIsHost
        setIsHost(currentIsHost)
        setLoading(false)
        setConnectionStatus("connected")

        if (!heartbeatStartedRef.current) {
          startHeartbeat()
          heartbeatStartedRef.current = true
        }
      } catch (err) {
        console.error("Error setting up room:", err)
        setError("Failed to setup room")
        setConnectionStatus("error")
      }
    }

    setupRoom()
  }, [roomId, username])

  // Enhanced real-time listener with better error handling
  const setupRealtimeListener = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    setConnectionStatus("connecting")

    unsubscribeRef.current = onSnapshot(
      roomRefRef.current,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data()
          const dataVersion = data.version || 0

          if (dataVersion >= lastProcessedVersionRef.current) {
            lastProcessedVersionRef.current = dataVersion
            setRoomData(data)
            setSelectedTime(data.timeControl || 5)
            setHostColor(data.hostColor || "w")
            setConnectionStatus("connected")

            if (isHostRef.current && data.hostPlayer === usernameRef.current) {
              setMyReady(data.hostReady || false)
            } else if (data.guestPlayer === usernameRef.current) {
              setMyReady(data.guestReady || false)
            }

            if (data.gameStarted && data.status === "playing") {
              const playerColor =
                data.hostPlayer === usernameRef.current ? data.hostColor : data.hostColor === "w" ? "b" : "w"
              navigate(
                `/play/${roomId}?username=${encodeURIComponent(usernameRef.current)}&color=${playerColor}&time=${data.timeControl}`,
              )
            }
          }
        } else {
          setError("Room not found")
          setConnectionStatus("error")
        }
      },
      (error) => {
        console.error("Real-time listener error:", error)
        setConnectionStatus("error")
      },
    )
  }, [])

  // Manual reconnection function
  const reconnect = useCallback(() => {
    console.log("Manual reconnection attempt...")
    setConnectionStatus("connecting")
    setError("")
    setupRealtimeListener()
  }, [])

  useEffect(() => {
    if (loading || error) return

    if (unsubscribeRef.current) {
      return
    }

    setupRealtimeListener()

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [loading, error])

  // Toggle Ready State
  const toggleReady = async () => {
    const newReadyState = !myReady
    setMyReady(newReadyState)

    try {
      const updateField = isHostRef.current ? "hostReady" : "guestReady"
      await updateDoc(roomRefRef.current, {
        [updateField]: newReadyState,
        lastActivity: serverTimestamp(),
        version: (roomData?.version || 0) + 1,
      })
    } catch (err) {
      console.error("Error toggling ready state:", err)
      setMyReady(!newReadyState)
      alert("Failed to update ready status. Please try again.")
    }
  }

  // Enhanced update functions with optimistic updates and retry logic
  const updateTimeControl = async (minutes) => {
    if (!isHostRef.current) return

    setSelectedTime(minutes)

    try {
      await updateDoc(roomRefRef.current, {
        timeControl: minutes,
        lastActivity: serverTimestamp(),
        version: (roomData?.version || 0) + 1,
      })
    } catch (err) {
      console.error("Error updating time:", err)
      setSelectedTime(roomData?.timeControl || 5)

      setTimeout(async () => {
        try {
          await updateDoc(roomRefRef.current, {
            timeControl: minutes,
            lastActivity: serverTimestamp(),
          })
          setSelectedTime(minutes)
        } catch (retryErr) {
          console.error("Retry failed:", retryErr)
        }
      }, 1000)
    }
  }

  const switchColors = async () => {
    if (!isHostRef.current) return
    const newColor = hostColor === "w" ? "b" : "w"

    setHostColor(newColor)

    try {
      await updateDoc(roomRefRef.current, {
        hostColor: newColor,
        lastActivity: serverTimestamp(),
        version: (roomData?.version || 0) + 1,
      })
    } catch (err) {
      console.error("Error switching colors:", err)
      setHostColor(roomData?.hostColor || "w")

      setTimeout(async () => {
        try {
          await updateDoc(roomRefRef.current, {
            hostColor: newColor,
            lastActivity: serverTimestamp(),
          })
          setHostColor(newColor)
        } catch (retryErr) {
          console.error("Retry failed:", retryErr)
        }
      }, 1000)
    }
  }

  const startGame = async () => {
    if (!isHostRef.current) {
      console.log("❌ Only host can start the game")
      return
    }

    if (!roomData?.guestPlayer) {
      console.log("❌ Waiting for opponent to join")
      return
    }

    if (!roomData?.guestReady) {
      console.log("❌ Guest must be ready")
      return
    }

    try {
      console.log("🚀 Starting game...")

      await updateDoc(roomRefRef.current, {
        status: "playing",
        gameStarted: true,
        gameState: new Chess().fen(),
        whiteTime: selectedTime * 60,
        blackTime: selectedTime * 60,
        lastMoveSquares: [],
        gameOver: false,
        winner: null,
        wasAborted: false,
        ifTimeout: false,
        lastMoveTime: serverTimestamp(),
        gameStartedAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        moveHistory: [], // Initialize empty move history for new game
        version: (roomData?.version || 0) + 1,
      })

      console.log("✅ Game started successfully")
    } catch (err) {
      console.error("Error starting game:", err)
      alert("Failed to start game. Please try again.")
    }
  }

  const copyRoomLink = async () => {
    const roomCode = roomId
    try {
      await navigator.clipboard.writeText(roomCode)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 3000)
    } catch (err) {
      alert("Failed to copy room code. Please copy manually: " + roomCode)
    }
  }

  // Connection status indicator
  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case "connecting":
        return { icon: "🔄", text: "Connecting...", color: COLORS.accentMain }
      case "connected":
        return { icon: "🟢", text: "Live", color: COLORS.success }
      case "reconnecting":
        return { icon: "⚠️", text: "Reconnecting...", color: COLORS.accentMain }
      case "disconnected":
        return { icon: "🔴", text: "Offline", color: COLORS.danger }
      case "error":
        return { icon: "❌", text: "Connection Error", color: COLORS.danger }
      default:
        return { icon: "⚪", text: "Unknown", color: COLORS.textMuted }
    }
  }

  const customStyles = `
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100%;
      box-sizing: border-box; /* Ensure consistent box model */
      position: fixed; /* Force to cover entire viewport */
      top: 0;
      left: 0;
    }

    *, *::before, *::after {
      box-sizing: border-box; /* Apply globally */
    }

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

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }

    .waitingDot:nth-child(1) { animation-delay: -0.32s; }
    .waitingDot:nth-child(2) { animation-delay: -0.16s; }
    .waitingDot:nth-child(3) { animation-delay: 0s; }

    .setup {
      height: 100%; /* Changed from 100vh */
      width: 100%; /* Changed from 100vw */
      background: linear-gradient(120deg, #f2e9e4 0%, #d8cfc4 50%, #f9f4ef 100%);
      display: flex;
      align-items: flex-start; /* Align items to the top */
      justify-content: center;
      padding: 2rem 1rem; /* Added padding-top and padding-bottom */
      position: absolute; /* Changed from relative */
      top: 0;
      left: 0;
      overflow: hidden;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      overflow-y: auto; /* Added to handle vertical overflow */
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
      max-width: 50%; /* Adjusted for PC screens */
      width: 50%; /* Adjusted for PC screens */
      box-shadow: 0 0.625rem 1.875rem rgba(141, 110, 99, 0.2), 0 0 0 0.0625rem rgba(255, 255, 255, 0.3); /* Converted from vh */
      border: 0.0625rem solid #efebe9; /* Converted from 0.1vh */
      position: relative;
      z-index: 1;
      overflow-y: auto;
    }

    .header {
      text-align: center;
      margin-bottom: 1.5rem; /* Converted from 2rem */
    }

    .header .icon {
      font-size: clamp(2rem, 3rem, 3rem); /* Adjusted clamp values */
      color: #8d6e63;
      text-shadow: 0 0.1875rem 0.375rem rgba(141, 110, 99, 0.3); /* Converted from 0.3vh 0.6vh */
      animation: glow 3s ease-in-out infinite alternate;
      margin-bottom: 0.3125rem; /* Converted from 0.5rem */
      display: block;
    }

    .header h2 {
      font-size: clamp(1.8rem, 2.5rem, 2.5rem); /* Adjusted clamp values */
      font-weight: 900;
      margin: 0 0 0.3125rem 0; /* Converted from 0.5rem */
      letter-spacing: -0.02em;
      line-height: 1.1;
      color: #8d6e63;
      text-shadow: 0 0.0625rem 0.1875rem rgba(141, 110, 99, 0.3); /* Converted from 0.1vh 0.3vh */
    }

    .header p {
      font-size: clamp(0.8rem, 1.125rem, 1rem); /* Adjusted clamp values */
      color: #5d4037;
      font-weight: 500;
      margin: 0;
      line-height: 1.4;
      font-style: italic;
    }

    .options-grid {
      display: grid;
      gap: 0.75rem; /* Slightly reduced gap */
      margin-bottom: 1.5rem; /* Adjusted margin */
    }

    .color-options {
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); /* Reduced min width */
    }

    .time-options {
      grid-template-columns: repeat(auto-fit, minmax(70px, 1fr)); /* Reduced min width */
    }

    .card {
      border: 0.125rem solid rgba(141, 110, 99, 0.3);
      padding: 0.6rem; /* Reduced padding */
      border-radius: 0.75rem;
      text-align: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: rgba(255, 255, 255, 0.9);
      cursor: pointer;
      color: ${COLORS.textPrimary};
      box-shadow: 0 0.1875rem 0.625rem rgba(141, 110, 99, 0.2);
    }

    .card:hover {
      border-color: #8d6e63;
      box-shadow: 0 0.3125rem 0.9375rem rgba(141, 110, 99, 0.3);
      transform: translateY(-0.125rem);
    }

    .card.selected {
      border-color: #8d6e63;
      box-shadow: 0 0 0 0.125rem rgba(141, 110, 99, 0.2), 0 0.5rem 0.9375rem rgba(141, 110, 99, 0.3);
      background: linear-gradient(135deg, rgba(141, 110, 99, 0.1) 0%, rgba(109, 76, 65, 0.15) 100%);
      transform: translateY(-0.125rem) scale(1.02);
    }

    .card div {
      font-weight: 600;
      margin-bottom: 0.1rem; /* Reduced margin */
      font-size: 0.85rem; /* Slightly reduced font size */
    }

    .card small {
      color: ${COLORS.textSecondary};
      font-size: 0.7rem; /* Slightly reduced font size */
    }

    @media (min-width: 769px) {
      .settings-options-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .card.selected small {
      color: ${COLORS.textPrimary};
    }

    .start-btn {
      width: 100%;
      padding: 0.75rem; /* Converted from 1.2rem */
      border: none;
      background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
      color: white;
      font-weight: bold;
      font-size: 1rem;
      border-radius: 0.75rem; /* Converted from 1.2rem */
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0.375rem 1.125rem rgba(76, 175, 80, 0.3); /* Converted from 0.6vh 1.8vh */
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.3125rem; /* Converted from 0.5rem */
      position: relative;
      overflow: hidden;
    }

    .start-btn:hover {
      box-shadow: 0 0.5rem 1.25rem rgba(76, 175, 80, 0.4); /* Converted from 0.8vh 2vh */
      transform: translateY(-0.125rem) scale(1.02); /* Converted from -2px */
    }

    .start-btn:disabled {
      background: linear-gradient(135deg, #bbb 0%, #999 100%);
      cursor: not-allowed;
      box-shadow: 0 0.1875rem 0.625rem rgba(0, 0, 0, 0.2); /* Converted from 0.3vh 1vh */
      transform: none;
    }

    .connectionStatus {
      position: absolute;
      top: 1rem;
      right: 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.3rem;
      font-size: clamp(0.6rem, 1.2vw, 0.8rem);
      font-weight: 600;
      z-index: 10;
    }

    .roomCard {
      background: linear-gradient(135deg, rgba(141, 110, 99, 0.1) 0%, rgba(109, 76, 65, 0.15) 100%);
      border-radius: 0.75rem;
      padding: 1rem 1.5rem;
      margin-bottom: 1rem;
      border: 0.0625rem solid rgba(141, 110, 99, 0.2);
      box-shadow: 0 0.3125rem 0.625rem rgba(141, 110, 99, 0.1);
      flex-shrink: 0;
    }
    .roomHeader {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .roomIdSection {
      display: flex;
      flex-direction: column;
    }
    .roomIdLabel {
      font-size: clamp(0.6rem, 1.4vw, 0.8rem);
      color: ${COLORS.textMuted};
      font-weight: 600;
      margin-bottom: 0.2rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .roomIdValue {
      font-size: clamp(1rem, 2.5vw, 1.5rem);
      font-weight: 900;
      color: ${COLORS.bgDark};
      font-family: monospace;
      letter-spacing: 0.15em;
      text-shadow: 0 0.0625rem 0.125rem rgba(78, 52, 46, 0.2);
    }
    .copyButton {
      padding: 0.5rem 0.8rem;
      background: linear-gradient(135deg, ${COLORS.info} 0%, ${COLORS.infoDark} 100%);
      color: ${COLORS.textWhite};
      border: none;
      border-radius: 0.5rem;
      font-size: clamp(0.6rem, 1.4vw, 0.8rem);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      gap: 0.3rem;
      box-shadow: 0 0.1875rem 0.625rem rgba(33, 150, 243, 0.3);
      white-space: nowrap;
    }
    .copyButtonSuccess {
      background: linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.successDark} 100%);
      box-shadow: 0 0.1875rem 0.625rem rgba(76, 175, 80, 0.3);
    }
    .shareHint {
      font-size: clamp(0.8rem, 1.125rem, 1rem);
      color: #5d4037;
      font-weight: 500;
      margin: 0;
      line-height: 1.4;
      font-style: italic;
      text-align: center;
    }

    .playersSection {
      margin-bottom: 1rem;
      flex-shrink: 0;
    }
    .playersArena {
      display: flex;
      align-items: center;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    .playerCard {
      background: rgba(255, 255, 255, 0.9);
      border-radius: 0.75rem;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      min-width: clamp(14rem, 20vw, 18rem);
      border: 0.125rem solid rgba(141, 110, 99, 0.3); /* Converted from 0.1vh */
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0.1875rem 0.625rem rgba(141, 110, 99, 0.2); /* Converted from 0.5vh 1vh */
    }
    .playerCardActive {
      border-color: #8d6e63;
      box-shadow: 0 0 0 0.125rem rgba(141, 110, 99, 0.2), 0 0.5rem 0.9375rem rgba(141, 110, 99, 0.3); /* Converted from 0.2vh 0.8vh 1.5vh */
      transform: translateY(-0.125rem) scale(1.02); /* Converted from -2px */
    }
    .playerCardHost {
      background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(67, 160, 71, 0.15) 100%);
    }
    .playerCardWaiting {
      opacity: 0.9; /* Increased opacity */
      background: rgba(255, 255, 255, 0.6); /* Lighter background */
      border: 0.125rem dashed ${COLORS.textMuted}; /* Dashed border for awaiting state */
      box-shadow: none; /* Remove shadow for awaiting state */
    }
    .playerCardWaiting .playerAvatarIcon {
      color: ${COLORS.textMuted}; /* Muted icon color */
      background: linear-gradient(135deg, ${COLORS.bgLight1} 0%, ${COLORS.bgLight2} 100%);
    }
    .playerCardWaiting .playerName {
      color: ${COLORS.textMuted}; /* Muted text color */
    }
    .playerCardWaiting .playerColorInfo {
      opacity: 0.5; /* Muted color info */
    }
    .playerAvatar {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.3rem;
    }
    .playerAvatarIcon {
      font-size: clamp(1.5rem, 3vw, 2rem);
      width: clamp(4rem, 8vw, 6rem);
      height: clamp(4rem, 8vw, 6rem);
      border-radius: 50%;
      background: linear-gradient(135deg, ${COLORS.textLight} 0%, ${COLORS.textSecondary} 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${COLORS.textWhite};
      box-shadow: 0 0.3125rem 0.625rem rgba(141, 110, 99, 0.3);
      border: 0.125rem solid rgba(255, 255, 255, 0.3);
    }
    .playerStatusBadge {
      background-color: ${COLORS.bgDark};
      color: ${COLORS.textWhite};
      padding: 0.2rem 0.5rem;
      border-radius: 0.3rem;
      font-size: clamp(0.5rem, 1.2vw, 0.7rem);
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .playerDetails {
      text-align: center;
      width: 100%;
    }
    .playerName {
      font-size: clamp(0.8rem, 1.8vw, 1rem);
      font-weight: 700;
      color: ${COLORS.bgDark};
      margin-bottom: 0.3rem;
      line-height: 1.2;
    }
    .playerColorInfo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.3rem;
      margin-bottom: 0.3rem;
    }
    .colorChip {
      font-size: clamp(0.8rem, 1.6vw, 1rem);
    }
    .colorText {
      font-size: clamp(0.6rem, 1.4vw, 0.8rem);
      color: ${COLORS.textMuted};
      font-weight: 600;
    }
    .playerStatus {
      font-size: clamp(0.6rem, 1.4vw, 0.8rem);
      color: ${COLORS.success};
      font-weight: 600;
    }
    .playerReadyStatus {
      font-size: clamp(0.6rem, 1.4vw, 0.8rem);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.3rem;
      color: ${COLORS.success};
    }
    .playerNotReadyStatus {
      font-size: clamp(0.6rem, 1.4vw, 0.8rem);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.3rem;
      color: ${COLORS.danger};
    }
    .vsDivider {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 0.5rem;
    }
    .vsCircle {
      width: clamp(3.5rem, 7vw, 5rem);
      height: clamp(3.5rem, 7vw, 5rem);
      border-radius: 50%;
      background: linear-gradient(135deg, ${COLORS.danger} 0%, ${COLORS.dangerDark} 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${COLORS.textWhite};
      font-weight: 900;
      font-size: clamp(0.8rem, 1.8vw, 1rem);
      box-shadow: 0 0.3125rem 0.625rem rgba(255, 107, 107, 0.4);
      position: relative;
      animation: pulse 2s ease-in-out infinite;
    }
    .vsText {
      position: relative;
      z-index: 2;
    }
    .vsGlow {
      position: absolute;
      top: -0.1875rem;
      left: -0.1875rem;
      right: -0.1875rem;
      bottom: -0.1875rem;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(255, 107, 107, 0.3), rgba(238, 90, 36, 0.3));
      filter: blur(0.1875rem);
      animation: glow 2s ease-in-out infinite alternate;
    }
    .settingsSection {
      margin-bottom: 1rem;
      flex: 1 1 auto;
      min-height: 0;
      overflow: auto;
    }
    .settingsGrid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
      gap: 1rem;
    }
    .settingCard {
      border: 0.125rem solid rgba(141, 110, 99, 0.3); /* Converted from 2px */
      padding: 1rem;
      border-radius: 0.75rem; /* Converted from 12px */
      text-align: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: rgba(255, 255, 255, 0.9);
      cursor: pointer;
      color: ${COLORS.textPrimary};
      box-shadow: 0 0.1875rem 0.625rem rgba(141, 110, 99, 0.2); /* Converted from 0.3vh 1vh */
    }
    .settingCard:hover {
      border-color: #8d6e63;
      box-shadow: 0 0.3125rem 0.9375rem rgba(141, 110, 99, 0.3); /* Converted from 0.5vh 1.5vh */
      transform: translateY(-0.125rem); /* Converted from -2px */
    }
    .settingCard.selected {
      border-color: #8d6e63;
      box-shadow: 0 0 0 0.125rem rgba(141, 110, 99, 0.2), 0 0.5rem 0.9375rem rgba(141, 110, 99, 0.3); /* Converted from 0.2vh 0.8vh 1.5vh */
      background: linear-gradient(135deg, rgba(141, 110, 99, 0.1) 0%, rgba(109, 76, 65, 0.15) 100%);
      transform: translateY(-0.125rem) scale(1.02); /* Converted from -2px */
    }
    .settingHeader {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .settingIcon {
      font-size: clamp(1.2rem, 2vw, 1.5rem);
      color: ${COLORS.textPrimary};
    }
    .settingLabel {
      font-size: clamp(0.8rem, 1.6vw, 1rem);
      font-weight: 700;
      color: ${COLORS.bgDark};
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .timeOptions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      justify-content: center;
    }
    .timeButton {
      padding: 0.6rem 1rem;
      border: 0.125rem solid rgba(141, 110, 99, 0.3);
      border-radius: 0.5rem;
      background-color: ${COLORS.textWhite};
      color: ${COLORS.textLight};
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: clamp(0.6rem, 1.4vw, 0.8rem);
      font-weight: 600;
      min-width: clamp(3rem, 6vw, 4.5rem);
      text-align: center;
      box-shadow: 0 0.1875rem 0.375rem rgba(141, 110, 99, 0.2);
    }
    .timeButtonActive {
      border-color: #8d6e63;
      background: linear-gradient(135deg, rgba(141, 110, 99, 0.1) 0%, rgba(109, 76, 65, 0.15) 100%);
      color: ${COLORS.textPrimary};
      transform: translateY(-0.125rem) scale(1.02);
      box-shadow: 0 0 0 0.125rem rgba(141, 110, 99, 0.2), 0 0.3125rem 0.625rem rgba(141, 110, 99, 0.3);
    }
    .colorSwitchButton {
      width: 100%;
      padding: 0.6rem; /* Adjusted padding */
      border: 0.125rem solid rgba(141, 110, 99, 0.3);
      border-radius: 0.75rem;
      background-color: ${COLORS.textWhite};
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 0.1875rem 0.625rem rgba(141, 110, 99, 0.2);
    }
    .colorSwitchButton:hover {
      border-color: #8d6e63;
      box-shadow: 0 0.3125rem 0.9375rem rgba(141, 110, 99, 0.3);
      transform: translateY(-0.125rem);
    }
    .colorSwitchButton.selected {
      border-color: #8d6e63;
      box-shadow: 0 0 0 0.125rem rgba(109, 76, 65, 0.4), 0 0.5rem 0.9375rem rgba(109, 76, 65, 0.3); /* More vibrant shadow */
      background: linear-gradient(135deg, rgba(109, 76, 65, 0.15) 0%, rgba(141, 110, 99, 0.2) 100%); /* More vibrant background */
      transform: translateY(-0.125rem) scale(1.02);
    }
    .colorPreview {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .colorPreviewIcon {
      font-size: clamp(1rem, 2vw, 1.3rem);
    }
    .colorPreviewText {
      font-size: clamp(0.7rem, 1.6vw, 0.9rem);
      font-weight: 600;
      color: ${COLORS.bgDark};
    }
    .switchIcon {
      font-size: clamp(0.9rem, 1.8vw, 1.1rem);
      color: ${COLORS.textLight};
      transition: transform 0.3s ease;
      transform: rotate(0deg); /* Initial state */
    }
    .colorSwitchButton.rotated .switchIcon {
      transform: rotate(180deg); /* Rotated state */
    }
    .actionSection {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      flex-shrink: 0;
      margin-top: auto;
    }
    .startButton {
      width: 100%;
      padding: 0.75rem; /* Converted from 1.2rem */
      border: none;
      background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
      color: white;
      font-weight: bold;
      font-size: 1rem;
      border-radius: 0.75rem; /* Converted from 1.2rem */
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0.375rem 1.125rem rgba(76, 175, 80, 0.3); /* Converted from 0.6vh 1.8vh */
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.3125rem; /* Converted from 0.5rem */
      position: relative;
      overflow: hidden;
    }

    .startButton:hover {
      box-shadow: 0 0.5rem 1.25rem rgba(76, 175, 80, 0.4); /* Converted from 0.8vh 2vh */
      transform: translateY(-0.125rem) scale(1.02); /* Converted from -2px */
    }

    .startButton:disabled {
      background: linear-gradient(135deg, #bbb 0%, #999 100%);
      cursor: not-allowed;
      box-shadow: 0 0.1875rem 0.625rem rgba(0, 0, 0, 0.2); /* Converted from 0.3vh 1vh */
      transform: none;
    }
    .startButtonContent {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      position: relative;
      z-index: 1;
    }
    .startButtonIcon {
      font-size: clamp(1.2rem, 2.5vw, 1.8rem);
      min-width: auto;
      text-align: center;
    }
    .startButtonText {
      flex: 1;
      text-align: left;
    }
    .startButtonTitle {
      font-size: clamp(0.9rem, 2vw, 1.2rem);
      font-weight: 700;
      margin-bottom: 0.1rem;
      letter-spacing: -0.01em;
    }
    .startButtonSubtitle {
      font-size: clamp(0.6rem, 1.4vw, 0.8rem);
      opacity: 0.9;
      font-weight: 400;
    }
    .startButtonArrow {
      font-size: clamp(1rem, 2vw, 1.3rem);
      font-weight: bold;
      transition: transform 0.3s ease;
    }
    .readyButton {
      width: 100%;
      padding: 0.75rem; /* Converted from 1.2rem */
      border: none;
      background: linear-gradient(135deg, ${COLORS.accentMain} 0%, ${COLORS.accentDark} 100%);
      color: white;
      font-weight: bold;
      font-size: 1rem;
      border-radius: 0.75rem; /* Converted from 1.2rem */
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0.375rem 1.125rem rgba(230, 184, 0, 0.3); /* Converted from 0.6vh 1.8vh */
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.3125rem; /* Converted from 0.5rem */
      position: relative;
      overflow: hidden;
    }
    .readyButton:hover {
      box-shadow: 0 0.5rem 1.25rem rgba(230, 184, 0, 0.4); /* Converted from 0.8vh 2vh */
      transform: translateY(-0.125rem) scale(1.02); /* Converted from -2px */
    }
    .readyButton.notReady {
      background: linear-gradient(135deg, ${COLORS.textMuted} 0%, ${COLORS.textSecondary} 100%);
      box-shadow: 0 0.375rem 1.125rem rgba(161, 136, 127, 0.3);
    }
    .readyButton:disabled {
      background: linear-gradient(135deg, #bbb 0%, #999 100%);
      cursor: not-allowed;
      box-shadow: 0 0.1875rem 0.625rem rgba(0, 0, 0, 0.2); /* Converted from 0.3vh 1vh */
      transform: none;
    }
    .waitingCard {
      background: rgba(255, 255, 255, 0.9);
      border-radius: 0.75rem;
      padding: 1.5rem;
      text-align: center;
      border: 0.125rem dashed rgba(141, 110, 99, 0.3);
      box-shadow: 0 0.3125rem 0.625rem rgba(141, 110, 99, 0.1);
    }
    .waitingAnimation {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .waitingDot {
      width: clamp(0.6rem, 1.5vw, 1rem);
      height: clamp(0.6rem, 1.5vw, 1rem);
      border-radius: 50%;
      background-color: ${COLORS.textLight};
      animation: bounce 1.4s ease-in-out infinite both;
    }
    .waitingText {
      font-size: clamp(0.8rem, 2vw, 1rem);
      font-weight: 600;
      color: ${COLORS.bgDark};
      margin-bottom: 0.5rem;
    }
    .waitingSubtext {
      font-size: clamp(0.6rem, 1.4vw, 0.8rem);
      color: ${COLORS.textMuted};
      line-height: 1.4;
    }
    .leaveButton {
      width: 100%;
      padding: 0.75rem; /* Converted from 1.2rem */
      border: none;
      background: linear-gradient(135deg, ${COLORS.danger} 0%, ${COLORS.dangerDark} 100%);
      color: white;
      font-weight: bold;
      font-size: 1rem;
      border-radius: 0.75rem; /* Converted from 1.2rem */
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0.375rem 1.125rem rgba(244, 67, 54, 0.3); /* Converted from 0.6vh 1.8vh */
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.3125rem; /* Converted from 0.5rem */
      position: relative;
      overflow: hidden;
    }
    .leaveButton:hover {
      box-shadow: 0 0.5rem 1.25rem rgba(244, 67, 54, 0.4); /* Converted from 0.8vh 2vh */
      transform: translateY(-0.125rem) scale(1.02); /* Converted from -2px */
    }
    .loadingContainer {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2rem;
      padding: 3rem 2rem;
      text-align: center;
      background: rgba(252, 248, 243, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 1.5rem;
      box-shadow: 0 0.625rem 1.875rem rgba(141, 110, 99, 0.2);
      border: 0.0625rem solid #efebe9;
    }
    .loadingSpinner {
      position: relative;
      width: clamp(4rem, 8vw, 6rem);
      height: clamp(4rem, 8vw, 6rem);
    }
    .spinner {
      width: 100%;
      height: 100%;
      border: 0.1875rem solid rgba(141, 110, 99, 0.3);
      border-top: 0.1875rem solid ${COLORS.textLight};
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    .spinnerInner {
      position: absolute;
      top: 25%;
      left: 25%;
      width: 50%;
      height: 50%;
      border: 0.125rem solid rgba(141, 110, 99, 0.5);
      border-bottom: 0.125rem solid ${COLORS.textSecondary};
      border-radius: 50%;
      animation: spin 2s linear infinite reverse;
    }
    .loadingText {
      font-size: clamp(0.9rem, 2.2vw, 1.2rem);
      font-weight: 700;
      color: ${COLORS.bgDark};
    }
    .loadingSubtext {
      font-size: clamp(0.7rem, 1.6vw, 0.9rem);
      color: ${COLORS.textMuted};
    }
    .errorContainer {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
      padding: 3rem 2rem;
      text-align: center;
      background: rgba(252, 248, 243, 0.95);
      border-radius: 1.5rem;
      backdrop-filter: blur(10px);
      border: 0.0625rem solid #efebe9;
      box-shadow: 0 0.625rem 1.875rem rgba(141, 110, 99, 0.2);
    }
    .errorIcon {
      font-size: clamp(2rem, 4vw, 3rem);
    }
    .errorTitle {
      font-size: clamp(1rem, 2.5vw, 1.4rem);
      font-weight: 700;
      color: ${COLORS.bgDark};
    }
    .errorMessage {
      font-size: clamp(0.8rem, 1.8vw, 1rem);
      color: ${COLORS.textMuted};
      line-height: 1.4;
    }
    .errorButton {
      padding: 0.75rem 1.5rem;
      background-color: ${COLORS.danger};
      color: ${COLORS.textWhite};
      border: none;
      border-radius: 0.75rem;
      font-size: clamp(0.7rem, 1.6vw, 0.9rem);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 0.1875rem 0.625rem rgba(244, 67, 54, 0.3);
    }

    /* Responsive adjustments for mobile */
    @media (max-width: 768px) {
      .panel {
        padding: 1rem; /* Converted from 1.5rem */
        max-width: 90% !important; /* Set max-width to 90% for mobile screens */
        width: 90% !important; /* Set width to 90% for mobile screens */
      }
      
      .options-grid {
        gap: 0.5rem; /* Converted from 0.8rem */
      }
      
      .playersArena {
        flex-direction: column !important;
        gap: 1rem !important;
      }
      .settingsGrid {
        grid-template-columns: 1fr !important;
      }
      .roomHeader {
        flex-direction: column !important;
        align-items: center !important;
        text-align: center !important;
      }
      .startButtonContent {
        flex-direction: column !important;
        text-align: center !important;
        gap: 0.5rem !important;
      }
      .startButtonText {
        text-align: center !important;
      }
      .connectionStatus {
        position: relative !important;
        top: auto !important;
        right: auto !important;
        align-items: center !important;
        margin-bottom: 1rem !important;
      }
    }

    @media (max-width: 480px) { /* 480px */
      .timeOptions {
        justify-content: center !important;
      }
      .colorPreview {
        gap: 0.5rem !important;
      }
      .panel {
        padding: 1rem !important;
        height: auto !important;
      }
      .vsDivider {
        margin: 0.5rem 0 !important;
      }
    }

    /* Extra small screens */
    @media (max-height: 600px) { /* 600px */
      .panel {
        height: 98vh !important;
        padding: 0.8rem 1rem !important;
      }
      .header {
        margin-bottom: 0.5rem !important;
      }
      .roomCard {
        margin-bottom: 0.5rem !important;
        padding: 0.8rem 1rem !important;
      }
      .playersSection {
        margin-bottom: 0.5rem !important;
      }
      .settingsSection {
        margin-bottom: 0.5rem !important;
      }
      .actionSection {
        gap: 0.5rem !important;
      }
    }

    /* Landscape mobile */
    @media (max-height: 500px) and (orientation: landscape) { /* 500px */
      .panel {
        height: 95vh !important;
        padding: 0.5rem 1rem !important;
      }
      .playersArena {
        flex-direction: row !important;
        gap: 0.5rem !important;
      }
      .playerCard {
        min-width: clamp(12rem, 18vw, 16rem) !important;
        padding: 0.8rem !important;
      }
      .header {
        margin-bottom: 0.3rem !important;
      }
      .header .icon {
        font-size: clamp(1.5rem, 3vw, 2rem) !important;
        margin-bottom: 0.2rem !important;
      }
      .header h2 {
        font-size: clamp(1.4rem, 3vw, 1.8rem) !important;
        margin-bottom: 0.2rem !important;
      }
      .header p {
        font-size: clamp(0.6rem, 1.4vw, 0.8rem) !important;
      }
    }
  `

  const statusDisplay = getConnectionStatusDisplay()
  const canStart = roomData?.hostPlayer && roomData?.guestPlayer && roomData?.guestReady

  if (loading) {
    return (
      <>
        <style>{`${customStyles}`}</style>
        <div className="setup">
          <div className="background-elements">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                style={{
                  top: `${10 + i * 12}%`,
                  animationDelay: `${i * 0.7}s`,
                }}
                className="floating-piece"
              >
                {["♔", "♛", "♜", "♝", "♞", "♟", "♚", "♕"][i]}
              </div>
            ))}
          </div>
          <div className="panel">
            <div className="loadingContainer">
              <div className="loadingSpinner">
                <div className="spinner"></div>
                <div className="spinnerInner"></div>
              </div>
              <div className="loadingText">Setting up your chess room...</div>
              <div className="loadingSubtext">Please wait a moment</div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <style>{`${customStyles}`}</style>
        <div className="setup">
          <div className="background-elements">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                style={{
                  top: `${10 + i * 12}%`,
                  animationDelay: `${i * 0.7}s`,
                }}
                className="floating-piece"
              >
                {["♔", "♛", "♜", "♝", "♞", "♟", "♚", "♕"][i]}
              </div>
            ))}
          </div>
          <div className="panel">
            <div className="errorContainer">
              <div className="errorIcon">🚫</div>
              <div className="errorTitle">Oops! Something went wrong</div>
              <div className="errorMessage">{error}</div>
              <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                <button onClick={reconnect} className="errorButton" style={{ backgroundColor: "#4CAF50" }}>
                  🔄 Try Again
                </button>
                <button onClick={() => navigate("/")} className="errorButton">
                  🏠 Return Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  const isGuestReady = roomData?.guestReady

  return (
    <>
      <style>{`${customStyles}`}</style>
      <div className="setup">
        {/* Animated background elements */}
        <div className="background-elements">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="floating-piece"
              style={{
                top: `${10 + i * 12}%`,
                animationDelay: `${i * 0.7}s`,
              }}
            >
              {["♔", "♛", "♜", "♝", "♞", "♟", "♚", "♕"][i]}
            </div>
          ))}
        </div>

        <div className="panel">
          

          <div className="header">
            <div className="icon">♛</div>
            
          </div>

          <div className="options-grid">
            <div className="card">
              <div className="roomHeader">
                <div className="roomIdSection">
                  <div className="roomIdLabel">Room Code</div>
                  <div className="roomIdValue">{roomId}</div>
                </div>
                <button onClick={copyRoomLink} className={`copyButton ${linkCopied ? "copyButtonSuccess" : ""}`}>
                  {linkCopied ? <>✅ Copied!</> : <>📋 Copy Code</>}
                </button>
              </div>
              <p className="shareHint">Share this code with your opponent to start the battle!</p>
            </div>
          </div>

          <div className="options-grid">
            <div className="playersArena">
              <div className={`playerCard ${isHostRef.current ? "selected" : ""} playerCardHost`}>
                <div className="playerAvatar">
                  <div className="playerAvatarIcon">👑</div>
                  <div className="playerStatusBadge">HOST</div>
                </div>
                <div className="playerDetails">
                  <div className="playerName">{roomData?.hostPlayer || "..."}</div>
                  <div className="playerColorInfo">
                    <span className="colorChip">{hostColor === "w" ? "♔" : "♚"}</span>
                    <span className="colorText">{hostColor === "w" ? "White" : "Black"}</span>
                  </div>
                </div>
              </div>

              <div className="vsDivider">
                <div className="vsCircle">
                  <span className="vsText">VS</span>
                  <div className="vsGlow"></div>
                </div>
              </div>

              <div
                className={`playerCard ${!isHostRef.current ? "selected" : ""} ${roomData?.guestPlayer ? "" : "playerCardWaiting"}`}
              >
                <div className="playerAvatar">
                  <div className="playerAvatarIcon">{roomData?.guestPlayer ? "⚔️" : "⏳"}</div>
                  <div className="playerStatusBadge">GUEST</div>
                </div>
                <div className="playerDetails">
                  <div className="playerName">{roomData?.guestPlayer || "Awaiting challenger..."}</div>
                  <div className="playerColorInfo">
                    <span className="colorChip">{hostColor === "w" ? "♚" : "♔"}</span>
                    <span className="colorText">{hostColor === "w" ? "Black" : "White"}</span>
                  </div>
                  {roomData?.guestPlayer && (
                    <div className={isGuestReady ? "playerReadyStatus" : "playerNotReadyStatus"}>
                      {isGuestReady ? "✅ Ready" : "⏳ Not Ready"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isHostRef.current && (
            <div className="options-grid settings-options-grid">
              <div className="card">
                <div className="settingHeader">
                  <span className="settingIcon">⏱️</span>
                  <span className="settingLabel">Time Control</span>
                </div>
                <div className="timeOptions">
                  {[1, 3, 5, 10, 15].map((minutes) => (
                    <div
                      key={minutes}
                      className={`card ${selectedTime === minutes ? "selected" : ""}`}
                      onClick={() => updateTimeControl(minutes)}
                    >
                      <div>{minutes} min</div>
                      <small>{minutes === 1 ? "Bullet" : minutes <= 5 ? "Blitz" : "Rapid"}</small>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="settingHeader">
                  <span className="settingIcon">🎨</span>
                  <span className="settingLabel">Your Color</span>
                </div>
                <div
                  onClick={switchColors}
                  className={`card colorSwitchButton ${hostColor === "w" || hostColor === "b" ? "selected" : ""} ${hostColor === "b" ? "rotated" : ""}`}
                >
                  <div className="colorPreview">
                    <span className="colorPreviewIcon">{hostColor === "w" ? "♔" : "♚"}</span>
                    <span className="colorPreviewText">Playing as {hostColor === "w" ? "White" : "Black"}</span>
                  </div>
                  <span className="switchIcon">🔄</span>
                </div>
              </div>
            </div>
          )}

          <div className="actionSection">
            {roomData?.guestPlayer ? (
              <>
                {!isHostRef.current && (
                  <button
                    onClick={toggleReady}
                    disabled={!roomData?.guestPlayer}
                    className={`start-btn ${myReady ? "" : "notReady"}`}
                    style={{ background: myReady ? "linear-gradient(135deg, #4caf50 0%, #45a049 100%)" : "linear-gradient(135deg, ${COLORS.textMuted} 0%, ${COLORS.textSecondary} 100%)" }}
                  >
                    <div className="startButtonContent">
                      <div className="startButtonIcon">{myReady ? "✅" : "⏳"}</div>
                      <div className="startButtonText">
                        <div className="startButtonTitle">{myReady ? "Ready!" : "Set Ready"}</div>
                        <div className="startButtonSubtitle">
                          {myReady ? "Waiting for host to start..." : "Confirm you're ready to play"}
                        </div>
                      </div>
                    </div>
                  </button>
                )}
                {isHostRef.current && (
                  <button
                    onClick={startGame}
                    disabled={!canStart}
                    className={`start-btn ${canStart ? "" : "startButtonDisabled"}`}
                  >
                    <div className="startButtonContent">
                      <div className="startButtonIcon">{canStart ? "🚀" : "⏳"}</div>
                      <div className="startButtonText">
                        <div className="startButtonTitle">
                          {canStart ? "Launch Battle!" : "Waiting for guest to be ready"}
                        </div>
                        <div className="startButtonSubtitle">
                          {canStart ? "Begin the epic chess duel" : "Guest must be ready to start"}
                        </div>
                      </div>
                      <div className="startButtonArrow">→</div>
                    </div>
                  </button>
                )}
              </>
            ) : (
              <div className="waitingCard">
                <div className="waitingAnimation">
                  <div className="waitingDot"></div>
                  <div className="waitingDot"></div>
                  <div className="waitingDot"></div>
                </div>
                <div className="waitingText">Seeking worthy opponent...</div>
                <div className="waitingSubtext">Share the room code to invite a challenger</div>
              </div>
            )}

            <button onClick={() => navigate("/")} className="start-btn" style={{ background: "linear-gradient(135deg, ${COLORS.danger} 0%, ${COLORS.dangerDark} 100%)" }}>
              <span className="leaveButtonIcon">🚪</span>
              <span>Retreat to Home</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default MultiplayerRoom
