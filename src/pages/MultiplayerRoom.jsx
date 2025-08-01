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
  const [isAnimating, setIsAnimating] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("connecting")
  const [myReady, setMyReady] = useState(false) // New state for player's ready status

  // Create roomRef only once and store in ref
  const roomRefRef = useRef(null)
  const unsubscribeRef = useRef(null)
  const heartbeatRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const lastProcessedVersionRef = useRef(0)
  const heartbeatStartedRef = useRef(false) // New ref to track if heartbeat has started
  const isHostRef = useRef(false) // Add ref to track host status
  const usernameRef = useRef(username) // Add ref for username

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
        
        // Try to reconnect after a delay
        setTimeout(() => {
          if (heartbeatRef.current) {
            setConnectionStatus("connected")
          }
        }, 2000)
      }
    }, 5000)
  }, []) // No dependencies needed since we use refs

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
  }, []) // Remove cleanup from dependencies to prevent infinite loops

  useEffect(() => {
    setTimeout(() => setIsAnimating(true), 100)
    const cleanup = monitorConnection()
    return cleanup
  }, []) // Remove monitorConnection from dependencies to prevent infinite loops

  useEffect(() => {
    if (!username || !roomId) {
      setError("Missing username or room ID")
      return
    }

    // Prevent multiple setups for the same room
    if (roomRefRef.current && !loading) {
      return
    }

    const setupRoom = async () => {
      try {
        setConnectionStatus("connecting")
        const roomSnap = await getDoc(roomRefRef.current)

        let currentIsHost = false // Local variable to determine host status

        if (!roomSnap.exists()) {
          // Create new room
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
          })
          currentIsHost = true
        } else {
          const data = roomSnap.data()

          // Check if this user is already the host
          if (data.hostPlayer === username) {
            currentIsHost = true
            await updateDoc(roomRefRef.current, {
              hostLastSeen: serverTimestamp(),
              lastActivity: serverTimestamp(),
            })
          } 
          // Check if this user is already the guest
          else if (data.guestPlayer === username) {
            currentIsHost = false
            await updateDoc(roomRefRef.current, {
              guestLastSeen: serverTimestamp(),
              lastActivity: serverTimestamp(),
            })
          } 
          // Check if room has space for a new guest
          else if (!data.guestPlayer) {
            // Use transaction to prevent race conditions
            try {
              await updateDoc(roomRefRef.current, {
                guestPlayer: username,
                guestLastSeen: serverTimestamp(),
                lastActivity: serverTimestamp(),
                version: (data.version || 0) + 1,
              })
              currentIsHost = false
            } catch (err) {
              // If update fails, room might have been filled by another player
              console.warn("Failed to join as guest, room might be full:", err)
              setError("Room is full or no longer available")
              setConnectionStatus("error")
              return
            }
          } else {
            setError("Room is full")
            setConnectionStatus("error")
            return // Exit early if room is full
          }
        }

        isHostRef.current = currentIsHost // Set ref once
        setIsHost(currentIsHost) // Also set state for UI reactivity
        setLoading(false)
        setConnectionStatus("connected")

        // Start heartbeat ONLY after host status is determined and room is set up
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

    // No specific cleanup needed here for the setupRoom async function itself
    // The onSnapshot listener and heartbeat are cleaned up in the other useEffect
  }, [roomId, username]) // Only include stable dependencies

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

            // Update myReady state based on fetched room data
            if (isHostRef.current && data.hostPlayer === usernameRef.current) {
              setMyReady(data.hostReady || false)
            } else if (data.guestPlayer === usernameRef.current) {
              setMyReady(data.guestReady || false)
            }

            // Check if game should start
            if (data.gameStarted && data.status === "playing") {
              const playerColor = data.hostPlayer === usernameRef.current ? data.hostColor : data.hostColor === "w" ? "b" : "w"
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

        // Don't automatically reconnect - let the user handle it
        // This prevents infinite reconnection loops
      },
    )
  }, []) // No dependencies needed since we use refs

  // Manual reconnection function
  const reconnect = useCallback(() => {
    console.log("Manual reconnection attempt...")
    setConnectionStatus("connecting")
    setError("")
    setupRealtimeListener()
  }, []) // No dependencies needed since setupRealtimeListener is stable

  useEffect(() => {
    if (loading || error) return

    // Prevent multiple listeners for the same room
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
  }, [loading, error]) // Removed setupRealtimeListener from dependencies

  // Toggle Ready State
  const toggleReady = async () => {
    const newReadyState = !myReady
    setMyReady(newReadyState) // Optimistic update

    try {
      const updateField = isHostRef.current ? "hostReady" : "guestReady"
      await updateDoc(roomRefRef.current, {
        [updateField]: newReadyState,
        lastActivity: serverTimestamp(),
        version: (roomData?.version || 0) + 1,
      })
    } catch (err) {
      console.error("Error toggling ready state:", err)
      setMyReady(!newReadyState) // Revert on error
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
    // Game can only start if both players are present AND guest is ready
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
        version: (roomData?.version || 0) + 1,
      })
      
      console.log("✅ Game started successfully")
    } catch (err) {
      console.error("Error starting game:", err)
      alert("Failed to start game. Please try again.")
    }
  }

  const copyRoomLink = async () => {
    const roomCode = roomId // Just copy the room code, not the full URL
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

    .wrapper {
      height: 100vh;
      width: 100vw;
      background: linear-gradient(120deg, ${COLORS.bgLight1} 0%, ${COLORS.bgLight2} 50%, ${COLORS.bgLight1} 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
    }
    .backgroundElements {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 0;
    }
    .floatingPiece {
      position: absolute;
      font-size: clamp(1.5rem, 3vw, 2.5rem);
      opacity: 0.1;
      color: ${COLORS.textLight};
      animation: float 8s ease-in-out infinite;
    }
    .container {
      background: rgba(252, 248, 243, 0.95);
      backdrop-filter: blur(1vh);
      border-radius: 1.5vh;
      padding: 1.5vh 2vw;
      box-shadow: 0 1vh 3vh rgba(141, 110, 99, 0.2), 0 0 0 0.1vh rgba(255, 255, 255, 0.3);
      width: clamp(35rem, 85vw, 80rem);
      height: clamp(50rem, 85vh, 70rem);
      position: relative;
      z-index: 1;
      transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      border: 0.1vh solid ${COLORS.bgLight2};
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .connectionStatus {
      position: absolute;
      top: 1vh;
      right: 1.5vw;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.3vh;
      font-size: clamp(0.6rem, 1.2vw, 0.8rem);
      font-weight: 600;
      z-index: 10;
    }
    .header {
      text-align: center;
      margin-bottom: 1vh;
      flex-shrink: 0;
    }
    .headerIcon {
      font-size: clamp(2rem, 4vw, 3rem);
      color: ${COLORS.textLight};
      text-shadow: 0 0.3vh 0.6vh rgba(141, 110, 99, 0.3);
      animation: glow 3s ease-in-out infinite alternate;
      margin-bottom: 0.5vh;
      display: block;
    }
    .title {
      font-size: clamp(1.8rem, 4vw, 2.5rem);
      font-weight: 900;
      margin: 0 0 0.5vh 0;
      letter-spacing: -0.02em;
      line-height: 1.1;
    }
    .titleMain {
      color: ${COLORS.textLight};
      text-shadow: 0 0.1vh 0.3vh rgba(141, 110, 99, 0.3);
    }
    .titleAccent {
      color: ${COLORS.bgDark};
      margin-left: 0.5vw;
    }
    .roomCard {
      background: linear-gradient(135deg, rgba(141, 110, 99, 0.1) 0%, rgba(109, 76, 65, 0.15) 100%);
      border-radius: 1vh;
      padding: 1vh 1.5vw;
      margin-bottom: 1vh;
      border: 0.1vh solid rgba(141, 110, 99, 0.2);
      box-shadow: 0 0.5vh 1vh rgba(141, 110, 99, 0.1);
      flex-shrink: 0;
    }
    .roomHeader {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5vh;
      flex-wrap: wrap;
      gap: 0.5vh;
    }
    .roomIdSection {
      display: flex;
      flex-direction: column;
    }
    .roomIdLabel {
      font-size: clamp(0.6rem, 1.4vw, 0.8rem);
      color: ${COLORS.textMuted};
      font-weight: 600;
      margin-bottom: 0.2vh;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .roomIdValue {
      font-size: clamp(1rem, 2.5vw, 1.5rem);
      font-weight: 900;
      color: ${COLORS.bgDark};
      font-family: monospace;
      letter-spacing: 0.15em;
      text-shadow: 0 0.1vh 0.2vh rgba(78, 52, 46, 0.2);
    }
    .copyButton {
      padding: 0.8vh 1.2vw;
      background: linear-gradient(135deg, ${COLORS.info} 0%, ${COLORS.infoDark} 100%);
      color: ${COLORS.textWhite};
      border: none;
      border-radius: 1vh;
      font-size: clamp(0.6rem, 1.4vw, 0.8rem);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      gap: 0.3vw;
      box-shadow: 0 0.3vh 1vh rgba(33, 150, 243, 0.3);
      white-space: nowrap;
    }
    .copyButtonSuccess {
      background: linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.successDark} 100%);
      box-shadow: 0 0.3vh 1vh rgba(76, 175, 80, 0.3);
    }
    .shareHint {
      font-size: clamp(0.6rem, 1.4vw, 0.8rem);
      color: ${COLORS.textMuted};
      text-align: center;
      font-style: italic;
      line-height: 1.4;
    }
    .playersSection {
      margin-bottom: 1vh;
      flex-shrink: 0;
    }
    .playersArena {
      display: flex;
      align-items: center;
      gap: 1vw;
      justify-content: center;
      flex-wrap: wrap;
    }
    .playerCard {
      background: rgba(255, 255, 255, 0.9);
      border-radius: 1vh;
      padding: 1vh 1vw;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.8vh;
      min-width: clamp(14rem, 20vw, 18rem);
      border: 0.1vh solid rgba(0, 0, 0, 0.08);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0.5vh 1vh rgba(0, 0, 0, 0.1);
    }
    .playerCardActive {
      border-color: ${COLORS.textLight};
      box-shadow: 0 0 0 0.2vh rgba(141, 110, 99, 0.2), 0 0.8vh 1.5vh rgba(141, 110, 99, 0.2);
      transform: translateY(-0.2vh);
    }
    .playerCardHost {
      background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(67, 160, 71, 0.15) 100%);
    }
    .playerCardWaiting {
      opacity: 0.7;
      background: rgba(0, 0, 0, 0.05);
    }
    .playerAvatar {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5vh;
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
      box-shadow: 0 0.5vh 1vh rgba(141, 110, 99, 0.3);
      border: 0.2vh solid rgba(255, 255, 255, 0.3);
    }
    .playerStatusBadge {
      backgroundColor: ${COLORS.bgDark};
      color: ${COLORS.textWhite};
      padding: 0.3vh 0.8vw;
      border-radius: 0.5vh;
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
      margin-bottom: 0.5vh;
      line-height: 1.2;
    }
    .playerColorInfo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5vw;
      margin-bottom: 0.5vh;
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
      gap: 0.3vw;
      color: ${COLORS.success};
    }
    .playerNotReadyStatus {
      font-size: clamp(0.6rem, 1.4vw, 0.8rem);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.3vw;
      color: ${COLORS.danger};
    }
    .vsDivider {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 0.5vw;
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
      box-shadow: 0 0.5vh 1vh rgba(255, 107, 107, 0.4);
      position: relative;
      animation: pulse 2s ease-in-out infinite;
    }
    .vsText {
      position: relative;
      z-index: 2;
    }
    .vsGlow {
      position: absolute;
      top: -0.3vh;
      left: -0.3vh;
      right: -0.3vh;
      bottom: -0.3vh;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(255, 107, 107, 0.3), rgba(238, 90, 36, 0.3));
      filter: blur(0.3vh);
      animation: glow 2s ease-in-out infinite alternate;
    }
    .settingsSection {
      margin-bottom: 1vh;
      flex: 1 1 auto;
      min-height: 0;
      overflow: auto;
    }
    .settingsGrid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
      gap: 1vh;
    }
    .settingCard {
      background: rgba(255, 255, 255, 0.9);
      border-radius: 1vh;
      padding: 1vh 1.5vw;
      border: 0.1vh solid rgba(141, 110, 99, 0.1);
      box-shadow: 0 0.5vh 1vh rgba(141, 110, 99, 0.1);
      transition: all 0.3s ease;
    }
    .settingHeader {
      display: flex;
      align-items: center;
      gap: 0.8vw;
      margin-bottom: 1vh;
    }
    .settingIcon {
      font-size: clamp(0.9rem, 2vw, 1.2rem);
    }
    .settingLabel {
      font-size: clamp(0.7rem, 1.6vw, 0.9rem);
      font-weight: 700;
      color: ${COLORS.bgDark};
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .timeOptions {
      display: flex;
      gap: 0.5vw;
      flex-wrap: wrap;
      justify-content: center;
    }
    .timeButton {
      padding: 0.6vh 1vw;
      border: 0.1vh solid rgba(141, 110, 99, 0.3);
      border-radius: 0.6vh;
      background-color: ${COLORS.textWhite};
      color: ${COLORS.textLight};
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: clamp(0.6rem, 1.4vw, 0.8rem);
      font-weight: 600;
      min-width: clamp(3rem, 6vw, 4.5rem);
      text-align: center;
      box-shadow: 0 0.3vh 0.6vh rgba(141, 110, 99, 0.2);
    }
    .timeButtonActive {
      border-color: ${COLORS.textLight};
      background-color: ${COLORS.textLight};
      color: ${COLORS.textWhite};
      transform: translateY(-0.1vh) scale(1.05);
      box-shadow: 0 0.5vh 1vh rgba(141, 110, 99, 0.4);
    }
    .colorSwitchButton {
      width: 100%;
      padding: 1vh 1.5vw;
      border: 0.1vh solid rgba(141, 110, 99, 0.3);
      border-radius: 1vh;
      background-color: ${COLORS.textWhite};
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 0.3vh 1vh rgba(141, 110, 99, 0.2);
    }
    .colorPreview {
      display: flex;
      align-items: center;
      gap: 0.8vw;
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
    }
    .actionSection {
      display: flex;
      flex-direction: column;
      gap: 1vh;
      flex-shrink: 0;
      margin-top: auto;
    }
    .startButton {
      background: linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.successDark} 100%);
      border: none;
      border-radius: 1.2vh;
      padding: 1.2vh 1.5vw;
      color: ${COLORS.textWhite};
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0.6vh 1.8vh rgba(76, 175, 80, 0.3);
      position: relative;
      overflow: hidden;
    }
    .startButtonDisabled {
      background: linear-gradient(135deg, #bbb 0%, #999 100%);
      cursor: not-allowed;
      box-shadow: 0 0.3vh 1vh rgba(0, 0, 0, 0.2);
    }
    .startButtonContent {
      display: flex;
      align-items: center;
      gap: 1.5vw;
      position: relative;
      z-index: 1;
    }
    .startButtonIcon {
      font-size: clamp(1.2rem, 2.5vw, 1.8rem);
      min-width: clamp(3rem, 6vw, 4.5rem);
      text-align: center;
    }
    .startButtonText {
      flex: 1;
      text-align: left;
    }
    .startButtonTitle {
      font-size: clamp(0.9rem, 2vw, 1.2rem);
      font-weight: 700;
      margin-bottom: 0.2vh;
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
      background: linear-gradient(135deg, ${COLORS.accentMain} 0%, ${COLORS.accentDark} 100%);
      border: none;
      border-radius: 1.2vh;
      padding: 1.2vh 1.5vw;
      color: ${COLORS.textWhite};
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0.6vh 1.8vh rgba(230, 184, 0, 0.3);
      position: relative;
      overflow: hidden;
    }
    .readyButton.notReady {
      background: linear-gradient(135deg, ${COLORS.textMuted} 0%, ${COLORS.textSecondary} 100%);
      box-shadow: 0 0.6vh 1.8vh rgba(161, 136, 127, 0.3);
    }
    .readyButton:disabled {
      background: linear-gradient(135deg, #bbb 0%, #999 100%);
      cursor: not-allowed;
      box-shadow: 0 0.3vh 1vh rgba(0, 0, 0, 0.2);
    }
    .waitingCard {
      background: rgba(255, 255, 255, 0.9);
      border-radius: 1.2vh;
      padding: 1.5vh 1.5vw;
      text-align: center;
      border: 0.2vh dashed rgba(141, 110, 99, 0.3);
      box-shadow: 0 0.5vh 1vh rgba(141, 110, 99, 0.1);
    }
    .waitingAnimation {
      display: flex;
      justify-content: center;
      gap: 0.8vw;
      margin-bottom: 1vh;
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
      margin-bottom: 0.5vh;
    }
    .waitingSubtext {
      font-size: clamp(0.6rem, 1.4vw, 0.8rem);
      color: ${COLORS.textMuted};
      line-height: 1.4;
    }
    .leaveButton {
      padding: 1vh 1.5vw;
      background: linear-gradient(135deg, ${COLORS.danger} 0%, ${COLORS.dangerDark} 100%);
      color: ${COLORS.textWhite};
      border: none;
      border-radius: 1vh;
      font-size: clamp(0.7rem, 1.6vw, 0.9rem);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.8vw;
      box-shadow: 0 0.3vh 1vh rgba(244, 67, 54, 0.3);
    }
    .loadingContainer {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2vh;
      padding: 3vh 2vw;
      text-align: center;
      background: rgba(252, 248, 243, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 1.5vh;
      box-shadow: 0 1vh 3vh rgba(141, 110, 99, 0.2);
      border: 0.1vh solid ${COLORS.bgLight2};
    }
    .loadingSpinner {
      position: relative;
      width: clamp(4rem, 8vw, 6rem);
      height: clamp(4rem, 8vw, 6rem);
    }
    .spinner {
      width: 100%;
      height: 100%;
      border: 0.3vh solid rgba(141, 110, 99, 0.3);
      border-top: 0.3vh solid ${COLORS.textLight};
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    .spinnerInner {
      position: absolute;
      top: 25%;
      left: 25%;
      width: 50%;
      height: 50%;
      border: 0.2vh solid rgba(141, 110, 99, 0.5);
      border-bottom: 0.2vh solid ${COLORS.textSecondary};
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
      gap: 1.5vh;
      padding: 3vh 2vw;
      text-align: center;
      background: rgba(252, 248, 243, 0.95);
      border-radius: 1.5vh;
      backdrop-filter: blur(10px);
      border: 0.1vh solid ${COLORS.bgLight2};
      box-shadow: 0 1vh 3vh rgba(141, 110, 99, 0.2);
    }
    .errorIcon {
      font-size: clamp(2rem, 4vw, 3rem);
    }
    .errorTitle {
      font-size: clamp(1rem, 2.5vw, 1.4rem);
      fontWeight: 700;
      color: ${COLORS.bgDark};
    }
    .errorMessage {
      font-size: clamp(0.8rem, 1.8vw, 1rem);
      color: ${COLORS.textMuted};
      line-height: 1.4;
    }
    .errorButton {
      padding: 1vh 1.5vw;
      background-color: ${COLORS.danger};
      color: ${COLORS.textWhite};
      border: none;
      border-radius: 1vh;
      font-size: clamp(0.7rem, 1.6vw, 0.9rem);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 0.3vh 1vh rgba(244, 67, 54, 0.3);
    }

    /* Responsive adjustments for mobile */
    @media (max-width: 48rem) { /* 768px */
      .playersArena {
        flex-direction: column !important;
        gap: 1.5vh !important;
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
        gap: 1vh !important;
      }
      .startButtonText {
        text-align: center !important;
      }
      .connectionStatus {
        position: relative !important;
        top: auto !important;
        right: auto !important;
        align-items: center !important;
        margin-bottom: 1vh !important;
      }
    }

    @media (max-width: 30rem) { /* 480px */
      .timeOptions {
        justify-content: center !important;
      }
      .colorPreview {
        gap: 1.5vw !important;
      }
      .container {
        padding: 1vh 3vw !important;
        height: 95vh !important;
      }
      .vsDivider {
        margin: 0.5vh 0 !important;
      }
    }

    /* Extra small screens */
    @media (max-height: 37.5rem) { /* 600px */
      .container {
        height: 98vh !important;
        padding: 0.8vh 2vw !important;
      }
      .header {
        margin-bottom: 0.5vh !important;
      }
      .roomCard {
        margin-bottom: 0.5vh !important;
        padding: 0.8vh 1.2vw !important;
      }
      .playersSection {
        margin-bottom: 0.5vh !important;
      }
      .settingsSection {
        margin-bottom: 0.5vh !important;
      }
      .actionSection {
        gap: 0.5vh !important;
      }
    }

    /* Landscape mobile */
    @media (max-height: 31.25rem) and (orientation: landscape) { /* 500px */
      .container {
        height: 95vh !important;
        padding: 0.5vh 2vw !important;
      }
      .playersArena {
        flex-direction: row !important;
        gap: 1vw !important;
      }
      .playerCard {
        min-width: clamp(12rem, 18vw, 16rem) !important;
        padding: 0.8vh 0.8vw !important;
      }
      .header {
        margin-bottom: 0.3vh !important;
      }
      .headerIcon {
        font-size: clamp(1.5rem, 3vw, 2rem) !important;
        margin-bottom: 0.2vh !important;
      }
      .title {
        font-size: clamp(1.4rem, 3vw, 1.8rem) !important;
        margin-bottom: 0.2vh !important;
      }
      .subtitle {
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
        <div className="wrapper">
          <div className="backgroundElements">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                style={{
                  top: `${10 + i * 12}vh`,
                  left: `${5 + (i % 2) * 90}vw`,
                  animationDelay: `${i * 0.7}s`,
                }}
                className="floatingPiece"
              >
                {["♔", "♛", "♜", "♝", "♞", "♟", "♚", "♕"][i]}
              </div>
            ))}
          </div>
          <div className="loadingContainer">
            <div className="loadingSpinner">
              <div className="spinner"></div>
              <div className="spinnerInner"></div>
            </div>
            <div className="loadingText">Setting up your chess room...</div>
            <div className="loadingSubtext">Please wait a moment</div>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <style>{`${customStyles}`}</style>
        <div className="wrapper">
          <div className="backgroundElements">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                style={{
                  top: `${10 + i * 12}vh`,
                  left: `${5 + (i % 2) * 90}vw`,
                  animationDelay: `${i * 0.7}s`,
                }}
                className="floatingPiece"
              >
                {["♔", "♛", "♜", "♝", "♞", "♟", "♚", "♕"][i]}
              </div>
            ))}
          </div>
          <div className="errorContainer">
            <div className="errorIcon">🚫</div>
            <div className="errorTitle">Oops! Something went wrong</div>
            <div className="errorMessage">{error}</div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={reconnect} className="errorButton" style={{ backgroundColor: '#4CAF50' }}>
                🔄 Try Again
              </button>
              <button onClick={() => navigate("/")} className="errorButton">
                🏠 Return Home
              </button>
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
      <div className="wrapper">
        <div className="backgroundElements">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              style={{
                top: `${10 + i * 12}vh`,
                left: `${5 + (i % 2) * 90}vw`,
                animationDelay: `${i * 0.7}s`,
              }}
              className="floatingPiece"
            >
              {["♔", "♛", "♜", "♝", "♞", "♟", "♚", "♕"][i]}
            </div>
          ))}
        </div>

        <div
          style={{
            transform: isAnimating ? "translateY(0) scale(1)" : "translateY(3vh) scale(0.95)",
            opacity: isAnimating ? 1 : 0,
          }}
          className="container"
        >
          <div className="connectionStatus" style={{ color: statusDisplay.color }}>
            {statusDisplay.icon} {statusDisplay.text}
            {connectionStatus === "error" && (
              <button 
                onClick={reconnect} 
                style={{ 
                  marginLeft: '0.5rem', 
                  padding: '0.2rem 0.5rem', 
                  fontSize: '0.7rem', 
                  backgroundColor: '#4CAF50', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '0.3rem', 
                  cursor: 'pointer' 
                }}
              >
                🔄 Reconnect
              </button>
            )}
          </div>

          <div className="header">
            <div className="headerIcon">♛</div>
            <h1 className="title">
              <span className="titleMain">Chess</span>
              <span className="titleAccent">Arena</span>
            </h1>
          </div>

          <div className="roomCard">
            <div className="roomHeader">
              <div className="roomIdSection">
                <div className="roomIdLabel">Room Code</div>
                <div className="roomIdValue">{roomId}</div>
              </div>
              <button onClick={copyRoomLink} className={`copyButton ${linkCopied ? "copyButtonSuccess" : ""}`}>
                {linkCopied ? <>✅ Copied!</> : <>📋 Copy Code</>}
              </button>
            </div>
            <div className="shareHint">Share this code with your opponent to start the battle!</div>
          </div>

          <div className="playersSection">
            <div className="playersArena">
              <div className={`playerCard ${isHostRef.current ? "playerCardActive" : ""} playerCardHost`}>
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
                  {/* Host doesn't need ready status since they control the game start */}
                </div>
              </div>

              <div className="vsDivider">
                <div className="vsCircle">
                  <span className="vsText">VS</span>
                  <div className="vsGlow"></div>
                </div>
              </div>

              <div
                className={`playerCard ${!isHostRef.current ? "playerCardActive" : ""} ${roomData?.guestPlayer ? "" : "playerCardWaiting"}`}
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
            <div className="settingsSection">
              <div className="settingsGrid">
                <div className="settingCard">
                  <div className="settingHeader">
                    <span className="settingIcon">⏱️</span>
                    <span className="settingLabel">Time Control</span>
                  </div>
                  <div className="timeOptions">
                    {[1, 3, 5, 10, 15].map((minutes) => (
                      <button
                        key={minutes}
                        className={`timeButton ${selectedTime === minutes ? "timeButtonActive" : ""}`}
                        onClick={() => updateTimeControl(minutes)}
                      >
                        {minutes}min
                      </button>
                    ))}
                  </div>
                </div>

                <div className="settingCard">
                  <div className="settingHeader">
                    <span className="settingIcon">🎨</span>
                    <span className="settingLabel">Your Color</span>
                  </div>
                  <button onClick={switchColors} className="colorSwitchButton">
                    <div className="colorPreview">
                      <span className="colorPreviewIcon">{hostColor === "w" ? "♔" : "♚"}</span>
                      <span className="colorPreviewText">Playing as {hostColor === "w" ? "White" : "Black"}</span>
                    </div>
                    <span className="switchIcon">🔄</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="actionSection">
            {roomData?.guestPlayer ? (
              <>
                {/* Only show ready button for guest, not host */}
                {!isHostRef.current && (
                  <button
                    onClick={toggleReady}
                    disabled={!roomData?.guestPlayer} // Disable if no guest yet
                    className={`readyButton ${myReady ? "" : "notReady"}`}
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
                    className={`startButton ${canStart ? "" : "startButtonDisabled"}`}
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

            <button onClick={() => navigate("/")} className="leaveButton">
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
