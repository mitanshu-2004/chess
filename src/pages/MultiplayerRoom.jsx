// MultiplayerRoom.jsx - Enhanced Real-time Updates (Fixed)
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { Chess } from "chess.js";
import { firestore } from "../utils/firebase";

const MultiplayerRoom = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { roomId } = useParams();
  const username = searchParams.get("username");

  const [roomData, setRoomData] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [selectedTime, setSelectedTime] = useState(5);
  const [hostColor, setHostColor] = useState("w");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  const roomRef = doc(firestore, "rooms", roomId);
  const unsubscribeRef = useRef(null);
  const heartbeatRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const lastProcessedVersionRef = useRef(0); // Track processed version to avoid duplicate updates

  // Connection heartbeat to maintain presence
  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    
    heartbeatRef.current = setInterval(async () => {
      try {
        if (roomData && username) {
          const updateField = isHost ? 'hostLastSeen' : 'guestLastSeen';
          await updateDoc(roomRef, {
            [updateField]: serverTimestamp(),
            lastActivity: serverTimestamp()
          });
          setConnectionStatus("connected");
        }
      } catch (err) {
        console.error("Heartbeat failed:", err);
        setConnectionStatus("reconnecting");
      }
    }, 5000); // Update every 5 seconds
  }, [roomRef, roomData, username, isHost]);

  // Enhanced connection monitoring
  const monitorConnection = useCallback(() => {
    const handleOnline = () => {
      setConnectionStatus("connected");
      console.log("Connection restored");
    };

    const handleOffline = () => {
      setConnectionStatus("disconnected");
      console.log("Connection lost");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    setTimeout(() => setIsAnimating(true), 100);
    const cleanup = monitorConnection();
    return cleanup;
  }, [monitorConnection]);

  useEffect(() => {
    if (!username || !roomId) {
      setError("Missing username or room ID");
      return;
    }

    const setupRoom = async () => {
      try {
        setConnectionStatus("connecting");
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
          // Create new room with enhanced tracking
          await setDoc(roomRef, {
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
            lastActivity: serverTimestamp(),
            version: 1 // For optimistic updates
          });
          setIsHost(true);
          setLoading(false);
          setConnectionStatus("connected");
          return;
        }

        const data = roomSnap.data();

        if (data.hostPlayer === username) {
          setIsHost(true);
          // Update host presence
          await updateDoc(roomRef, {
            hostLastSeen: serverTimestamp(),
            lastActivity: serverTimestamp()
          });
          setLoading(false);
          setConnectionStatus("connected");
          return;
        }

        if (data.guestPlayer === username) {
          setIsHost(false);
          // Update guest presence
          await updateDoc(roomRef, {
            guestLastSeen: serverTimestamp(),
            lastActivity: serverTimestamp()
          });
          setLoading(false);
          setConnectionStatus("connected");
          return;
        }

        if (!data.guestPlayer) {
          await updateDoc(roomRef, {
            guestPlayer: username,
            guestLastSeen: serverTimestamp(),
            lastActivity: serverTimestamp(),
            version: (data.version || 0) + 1
          });
          setIsHost(false);
          setLoading(false);
          setConnectionStatus("connected");
          return;
        }

        setError("Room is full");
      } catch (err) {
        console.error("Error setting up room:", err);
        setError("Failed to setup room");
        setConnectionStatus("error");
      }
    };

    setupRoom();
  }, [roomId, username]);

  // Enhanced real-time listener with better error handling
  useEffect(() => {
    if (loading || error) return;

    const setupRealtimeListener = () => {
      try {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }

        setConnectionStatus("connecting");

        unsubscribeRef.current = onSnapshot(
          roomRef,
          (doc) => {
            if (doc.exists()) {
              const data = doc.data();
              const currentTime = Date.now();
              const dataVersion = data.version || 0;
              
              // Only update if we have a newer version to avoid infinite loops
              if (dataVersion > lastProcessedVersionRef.current) {
                lastProcessedVersionRef.current = dataVersion;
                setRoomData(data);
                setSelectedTime(data.timeControl || 5);
                setHostColor(data.hostColor || "w");
                setLastUpdateTime(currentTime);
                setConnectionStatus("connected");

                // Auto-navigate to game when it starts
                if (data.gameStarted && data.status === "playing") {
                  const playerColor = data.hostPlayer === username ? data.hostColor : 
                                     (data.hostColor === "w" ? "b" : "w");
                  navigate(`/play/${roomId}?username=${encodeURIComponent(username)}&color=${playerColor}&time=${data.timeControl}`);
                }
              }
            } else {
              setError("Room not found");
              setConnectionStatus("error");
            }
          },
          (error) => {
            console.error("Real-time listener error:", error);
            setConnectionStatus("error");
            
            // Attempt to reconnect after a delay
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }
            
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log("Attempting to reconnect...");
              setupRealtimeListener();
            }, 3000);
          }
        );

        // Start heartbeat once listener is established
        startHeartbeat();
        
      } catch (err) {
        console.error("Failed to setup real-time listener:", err);
        setConnectionStatus("error");
      }
    };

    setupRealtimeListener();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [loading, error, roomRef, roomId, username, navigate, startHeartbeat]); // Removed lastUpdateTime dependency

  // Enhanced update functions with optimistic updates and retry logic
  const updateTimeControl = async (minutes) => {
    if (!isHost) return;
    
    // Optimistic update
    setSelectedTime(minutes);
    
    try {
      await updateDoc(roomRef, { 
        timeControl: minutes,
        lastActivity: serverTimestamp(),
        version: (roomData?.version || 0) + 1
      });
    } catch (err) {
      console.error("Error updating time:", err);
      // Revert optimistic update on error
      setSelectedTime(roomData?.timeControl || 5);
      
      // Retry once
      setTimeout(async () => {
        try {
          await updateDoc(roomRef, { 
            timeControl: minutes,
            lastActivity: serverTimestamp()
          });
          setSelectedTime(minutes);
        } catch (retryErr) {
          console.error("Retry failed:", retryErr);
        }
      }, 1000);
    }
  };

  const switchColors = async () => {
    if (!isHost) return;
    const newColor = hostColor === "w" ? "b" : "w";
    
    // Optimistic update
    setHostColor(newColor);
    
    try {
      await updateDoc(roomRef, { 
        hostColor: newColor,
        lastActivity: serverTimestamp(),
        version: (roomData?.version || 0) + 1
      });
    } catch (err) {
      console.error("Error switching colors:", err);
      // Revert optimistic update
      setHostColor(roomData?.hostColor || "w");
      
      // Retry once
      setTimeout(async () => {
        try {
          await updateDoc(roomRef, { 
            hostColor: newColor,
            lastActivity: serverTimestamp()
          });
          setHostColor(newColor);
        } catch (retryErr) {
          console.error("Retry failed:", retryErr);
        }
      }, 1000);
    }
  };

  const startGame = async () => {
    if (!isHost || !roomData?.guestPlayer) return;
    
    try {
      await updateDoc(roomRef, {
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
        lastUpdateTime: Date.now(),
        gameStartedAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        version: (roomData?.version || 0) + 1
      });
    } catch (err) {
      console.error("Error starting game:", err);
      alert("Failed to start game. Please try again.");
    }
  };

  const copyRoomLink = async () => {
    const link = `${window.location.origin}/multiplayer/${roomId}?username=PLAYER_NAME`;
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (err) {
      alert("Failed to copy link. Please copy manually: " + link);
    }
  };

  // Connection status indicator
  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case "connecting":
        return { icon: "🔄", text: "Connecting...", color: "#ff9800" };
      case "connected":
        return { icon: "🟢", text: "Live", color: "#4caf50" };
      case "reconnecting":
        return { icon: "⚠️", text: "Reconnecting...", color: "#ff9800" };
      case "disconnected":
        return { icon: "🔴", text: "Offline", color: "#f44336" };
      case "error":
        return { icon: "❌", text: "Connection Error", color: "#f44336" };
      default:
        return { icon: "⚪", text: "Unknown", color: "#666" };
    }
  };

  if (loading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.backgroundElements}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{
              ...styles.floatingPiece,
              top: `${10 + (i * 12)}%`,
              left: `${5 + (i % 2) * 90}%`,
              animationDelay: `${i * 0.7}s`,
            }}>
              {['♔', '♛', '♜', '♝', '♞', '♟', '♚', '♕'][i]}
            </div>
          ))}
        </div>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}>
            <div style={styles.spinner}></div>
            <div style={styles.spinnerInner}></div>
          </div>
          <div style={styles.loadingText}>Setting up your chess room...</div>
          <div style={styles.loadingSubtext}>Please wait a moment</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.backgroundElements}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{
              ...styles.floatingPiece,
              top: `${10 + (i * 12)}%`,
              left: `${5 + (i % 2) * 90}%`,
              animationDelay: `${i * 0.7}s`,
            }}>
              {['♔', '♛', '♜', '♝', '♞', '♟', '♚', '♕'][i]}
            </div>
          ))}
        </div>
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>🚫</div>
          <div style={styles.errorTitle}>Oops! Something went wrong</div>
          <div style={styles.errorMessage}>{error}</div>
          <button onClick={() => navigate("/")} style={styles.errorButton}>
            🏠 Return Home
          </button>
        </div>
      </div>
    );
  }

  const canStart = roomData?.hostPlayer && roomData?.guestPlayer;
  const statusDisplay = getConnectionStatusDisplay();

  return (
    <div style={styles.wrapper}>
      {/* Animated background elements */}
      <div style={styles.backgroundElements}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{
            ...styles.floatingPiece,
            top: `${10 + (i * 12)}%`,
            left: `${5 + (i % 2) * 90}%`,
            animationDelay: `${i * 0.7}s`,
          }}>
            {['♔', '♛', '♜', '♝', '♞', '♟', '♚', '♕'][i]}
          </div>
        ))}
      </div>

      <div style={{
        ...styles.container,
        transform: isAnimating ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
        opacity: isAnimating ? 1 : 0,
      }}>
        {/* Connection Status */}
        <div style={styles.connectionStatus}>
          <span style={{ color: statusDisplay.color }}>
            {statusDisplay.icon} {statusDisplay.text}
          </span>
          {lastUpdateTime && (
            <span style={styles.lastUpdate}>
              Last update: {new Date(lastUpdateTime).toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerIcon}>♛</div>
          <h1 style={styles.title}>
            <span style={styles.titleMain}>Battle</span>
            <span style={styles.titleAccent}>Room</span>
          </h1>
          <p style={styles.subtitle}>Prepare for epic chess warfare</p>
        </div>

        {/* Room Info Card */}
        <div style={styles.roomCard}>
          <div style={styles.roomHeader}>
            <div style={styles.roomIdSection}>
              <div style={styles.roomIdLabel}>Room Code</div>
              <div style={styles.roomIdValue}>{roomId}</div>
            </div>
            <button 
              onClick={copyRoomLink} 
              style={{
                ...styles.copyButton,
                ...(linkCopied ? styles.copyButtonSuccess : {})
              }}
              onMouseEnter={(e) => {
                if (!linkCopied) {
                  e.target.style.transform = 'translateY(-2px) scale(1.05)';
                  e.target.style.boxShadow = '0 8px 25px rgba(33, 150, 243, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!linkCopied) {
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 4px 15px rgba(33, 150, 243, 0.3)';
                }
              }}
            >
              {linkCopied ? (
                <>✅ Copied!</>
              ) : (
                <>📋 Share Link</>
              )}
            </button>
          </div>
          
          <div style={styles.shareHint}>
            Send this link to your opponent to join the battle arena
          </div>
        </div>

        {/* Players Arena */}
        <div style={styles.playersSection}>
          <div style={styles.playersTitle}>Warriors Assembly</div>
          <div style={styles.playersArena}>
            {/* Host Player */}
            <div style={{
              ...styles.playerCard,
              ...(isHost ? styles.playerCardActive : {}),
              ...styles.playerCardHost
            }}>
              <div style={styles.playerAvatar}>
                <div style={styles.playerAvatarIcon}>👑</div>
                <div style={styles.playerStatusBadge}>HOST</div>
              </div>
              <div style={styles.playerDetails}>
                <div style={styles.playerName}>{roomData?.hostPlayer || "..."}</div>
                <div style={styles.playerColorInfo}>
                  <span style={styles.colorChip}>
                    {hostColor === "w" ? "⚪" : "⚫"}
                  </span>
                  <span style={styles.colorText}>
                    {hostColor === "w" ? "White Army" : "Black Legion"}
                  </span>
                </div>
                <div style={styles.playerStatus}>⚔️ Ready for battle</div>
              </div>
            </div>

            {/* VS Divider */}
            <div style={styles.vsDivider}>
              <div style={styles.vsCircle}>
                <span style={styles.vsText}>VS</span>
                <div style={styles.vsGlow}></div>
              </div>
            </div>

            {/* Guest Player */}
            <div style={{
              ...styles.playerCard,
              ...(!isHost ? styles.playerCardActive : {}),
              ...(roomData?.guestPlayer ? {} : styles.playerCardWaiting)
            }}>
              <div style={styles.playerAvatar}>
                <div style={styles.playerAvatarIcon}>
                  {roomData?.guestPlayer ? "⚔️" : "⏳"}
                </div>
                <div style={styles.playerStatusBadge}>GUEST</div>
              </div>
              <div style={styles.playerDetails}>
                <div style={styles.playerName}>
                  {roomData?.guestPlayer || "Awaiting challenger..."}
                </div>
                <div style={styles.playerColorInfo}>
                  <span style={styles.colorChip}>
                    {hostColor === "w" ? "⚫" : "⚪"}
                  </span>
                  <span style={styles.colorText}>
                    {hostColor === "w" ? "Black Legion" : "White Army"}
                  </span>
                </div>
                <div style={styles.playerStatus}>
                  {roomData?.guestPlayer ? "⚔️ Ready for battle" : "🔍 Searching for warrior..."}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Settings */}
        {isHost && (
          <div style={styles.settingsSection}>
            <div style={styles.settingsTitle}>Battle Configuration</div>
            <div style={styles.settingsGrid}>
              {/* Time Control */}
              <div style={styles.settingCard}>
                <div style={styles.settingHeader}>
                  <div style={styles.settingIcon}>⏱️</div>
                  <div style={styles.settingLabel}>Time Control</div>
                </div>
                <div style={styles.timeOptions}>
                  {[1, 3, 5, 10, 15].map((minutes) => (
                    <button
                      key={minutes}
                      style={{
                        ...styles.timeButton,
                        ...(selectedTime === minutes ? styles.timeButtonActive : {})
                      }}
                      onClick={() => updateTimeControl(minutes)}
                      onMouseEnter={(e) => {
                        if (selectedTime !== minutes) {
                          e.target.style.transform = 'translateY(-2px) scale(1.05)';
                          e.target.style.boxShadow = '0 4px 12px rgba(141, 110, 99, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedTime !== minutes) {
                          e.target.style.transform = 'translateY(0) scale(1)';
                          e.target.style.boxShadow = '0 2px 8px rgba(141, 110, 99, 0.2)';
                        }
                      }}
                    >
                      {minutes}min
                    </button>
                  ))}
                </div>
              </div>

              {/* Army Selection */}
              <div style={styles.settingCard}>
                <div style={styles.settingHeader}>
                  <div style={styles.settingIcon}>🏰</div>
                  <div style={styles.settingLabel}>Your Army</div>
                </div>
                <button 
                  onClick={switchColors} 
                  style={styles.colorSwitchButton}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px) scale(1.02)';
                    e.target.style.boxShadow = '0 6px 20px rgba(141, 110, 99, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0) scale(1)';
                    e.target.style.boxShadow = '0 3px 12px rgba(141, 110, 99, 0.2)';
                  }}
                >
                  <div style={styles.colorPreview}>
                    <span style={styles.colorPreviewIcon}>
                      {hostColor === "w" ? "⚪" : "⚫"}
                    </span>
                    <span style={styles.colorPreviewText}>
                      {hostColor === "w" ? "White Army" : "Black Legion"}
                    </span>
                  </div>
                  <div style={styles.switchIcon}>🔄</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Section */}
        <div style={styles.actionSection}>
          {canStart ? (
            <button
              onClick={startGame}
              disabled={!isHost}
              style={{
                ...styles.startButton,
                ...(isHost ? {} : styles.startButtonDisabled)
              }}
              onMouseEnter={(e) => {
                if (isHost) {
                  e.target.style.transform = 'translateY(-3px) scale(1.02)';
                  e.target.style.boxShadow = '0 15px 35px rgba(76, 175, 80, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (isHost) {
                  e.target.style.transform = 'translateY(0) scale(1)';
                  e.target.style.boxShadow = '0 8px 25px rgba(76, 175, 80, 0.3)';
                }
              }}
            >
              <div style={styles.startButtonContent}>
                <div style={styles.startButtonIcon}>
                  {isHost ? "🚀" : "⏳"}
                </div>
                <div style={styles.startButtonText}>
                  <div style={styles.startButtonTitle}>
                    {isHost ? "Launch Battle!" : "Awaiting Host Command"}
                  </div>
                  <div style={styles.startButtonSubtitle}>
                    {isHost ? "Begin the epic chess duel" : "Host will start the battle"}
                  </div>
                </div>
                <div style={styles.startButtonArrow}>→</div>
              </div>
            </button>
          ) : (
            <div style={styles.waitingCard}>
              <div style={styles.waitingAnimation}>
                <div style={styles.waitingDot}></div>
                <div style={styles.waitingDot}></div>
                <div style={styles.waitingDot}></div>
              </div>
              <div style={styles.waitingText}>Seeking worthy opponent...</div>
              <div style={styles.waitingSubtext}>Share the room link to summon a challenger</div>
            </div>
          )}
          
          <button 
            onClick={() => navigate("/")} 
            style={styles.leaveButton}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#d32f2f';
              e.target.style.transform = 'translateY(-2px) scale(1.02)';
              e.target.style.boxShadow = '0 6px 20px rgba(244, 67, 54, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(244, 67, 54, 0.9)';
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = '0 4px 15px rgba(244, 67, 54, 0.3)';
            }}
          >
            <span style={styles.leaveButtonIcon}>🚪</span>
            <span>Retreat to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: "100vh",
    width: "100vw",
    background: "linear-gradient(120deg, #f2e9e4 0%, #d8cfc4 50%, #f9f4ef 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
  },
  backgroundElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    zIndex: 0,
  },
  floatingPiece: {
    position: "absolute",
    fontSize: "clamp(2rem, 4vw, 3.5rem)",
    opacity: 0.15,
    color: "#8d6e63",
    animation: "float 8s ease-in-out infinite",
  },
  container: {
    background: "rgba(252, 248, 243, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: "2vh",
    padding: "3vh 3vw",
    boxShadow: "0 2vh 4vh rgba(141, 110, 99, 0.2), 0 0 0 0.1vh rgba(255, 255, 255, 0.3)",
    maxWidth: "90vw",
    minWidth: 300,
    width: "clamp(400px, 80vw, 900px)",
    maxHeight: "90vh",
    position: "relative",
    zIndex: 1,
    transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
    border: "0.2vh solid #efebe9",
    overflowY: "auto",
  },
  connectionStatus: {
    position: "absolute",
    top: "1vh",
    right: "2vw",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "0.5vh",
    fontSize: "clamp(0.7rem, 1.5vw, 0.9rem)",
    fontWeight: "600",
    zIndex: 10,
  },
  lastUpdate: {
    fontSize: "clamp(0.6rem, 1.2vw, 0.7rem)",
    color: "#6b7280",
    fontWeight: "400",
  },
  header: {
    textAlign: "center",
    marginBottom: "3vh",
    marginTop: "2vh",
  },
  headerIcon: {
    fontSize: "clamp(3rem, 6vw, 5rem)",
    color: "#8d6e63",
    textShadow: "0 0.5vh 1vh rgba(141, 110, 99, 0.3)",
    animation: "glow 3s ease-in-out infinite alternate",
    marginBottom: "1vh",
    display: "block",
  },
  title: {
    fontSize: "clamp(2.5rem, 6vw, 4rem)",
    fontWeight: "900",
    margin: "0 0 1vh 0",
    letterSpacing: "-0.02em",
    lineHeight: 1.1,
  },
  titleMain: {
    color: "#8d6e63",
    textShadow: "0 0.2vh 0.5vh rgba(141, 110, 99, 0.3)",
  },
  titleAccent: {
    color: "#4e342e",
    marginLeft: "1vw",
  },
  subtitle: {
    fontSize: "clamp(1rem, 2.5vw, 1.3rem)",
    color: "#5d4037",
    fontWeight: "500",
    margin: 0,
    lineHeight: 1.4,
    fontStyle: "italic",
  },
  roomCard: {
    background: "linear-gradient(135deg, rgba(141, 110, 99, 0.1) 0%, rgba(109, 76, 65, 0.15) 100%)",
    borderRadius: "2vh",
    padding: "2vh 2vw",
    marginBottom: "3vh",
    border: "0.2vh solid rgba(141, 110, 99, 0.2)",
    boxShadow: "0 1vh 2vh rgba(141, 110, 99, 0.1)",
  },
  roomHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5vh",
    flexWrap: "wrap",
    gap: "1vh",
  },
  roomIdSection: {
    display: "flex",
    flexDirection: "column",
  },
  roomIdLabel: {
    fontSize: "clamp(0.8rem, 2vw, 1rem)",
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: "0.5vh",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  roomIdValue: {
    fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
    fontWeight: "900",
    color: "#4e342e",
    fontFamily: "monospace",
    letterSpacing: "0.15em",
    textShadow: "0 0.1vh 0.3vh rgba(78, 52, 46, 0.2)",
  },
  copyButton: {
    padding: "1vh 1.5vw",
    background: "linear-gradient(135deg, #2196f3 0%, #1976d2 100%)",
    color: "white",
    border: "none",
    borderRadius: "1.5vh",
    fontSize: "clamp(0.8rem, 2vw, 1rem)",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    display: "flex",
    alignItems: "center",
    gap: "0.5vw",
    boxShadow: "0 0.5vh 1.5vh rgba(33, 150, 243, 0.3)",
    whiteSpace: "nowrap",
  },
  copyButtonSuccess: {
    background: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
    boxShadow: "0 0.5vh 1.5vh rgba(76, 175, 80, 0.3)",
  },
  shareHint: {
    fontSize: "clamp(0.8rem, 2vw, 1rem)",
    color: "#6b7280",
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 1.4,
  },
  playersSection: {
    marginBottom: "3vh",
  },
  playersTitle: {
    fontSize: "clamp(1.2rem, 3vw, 1.6rem)",
    fontWeight: "700",
    color: "#4e342e",
    marginBottom: "2vh",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  playersArena: {
    display: "flex",
    alignItems: "center",
    gap: "2vw",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  playerCard: {
    background: "rgba(255, 255, 255, 0.9)",
    borderRadius: "2vh",
    padding: "2vh 1.5vw",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.5vh",
    minWidth: "clamp(180px, 25vw, 250px)",
    border: "0.2vh solid rgba(0, 0, 0, 0.08)",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 1vh 2vh rgba(0, 0, 0, 0.1)",
  },
  playerCardActive: {
    borderColor: "#8d6e63",
    boxShadow: "0 0 0 0.3vh rgba(141, 110, 99, 0.2), 0 1.5vh 3vh rgba(141, 110, 99, 0.2)",
    transform: "translateY(-0.5vh)",
  },
  playerCardHost: {
    background: "linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(67, 160, 71, 0.15) 100%)",
  },
  playerCardWaiting: {
    opacity: 0.7,
    background: "rgba(0, 0, 0, 0.05)",
  },
  playerAvatar: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1vh",
  },
  playerAvatarIcon: {
    fontSize: "clamp(2.5rem, 5vw, 4rem)",
    width: "clamp(60px, 12vw, 100px)",
    height: "clamp(60px, 12vw, 100px)",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    boxShadow: "0 1vh 2vh rgba(141, 110, 99, 0.3)",
    border: "0.3vh solid rgba(255, 255, 255, 0.3)",
  },
  playerStatusBadge: {
    backgroundColor: "#4e342e",
    color: "white",
    padding: "0.5vh 1vw",
    borderRadius: "1vh",
    fontSize: "clamp(0.7rem, 1.5vw, 0.9rem)",
    fontWeight: "700",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  playerDetails: {
    textAlign: "center",
    width: "100%",
  },
  playerName: {
    fontSize: "clamp(1rem, 2.5vw, 1.4rem)",
    fontWeight: "700",
    color: "#4e342e",
    marginBottom: "1vh",
    lineHeight: 1.2,
  },
  playerColorInfo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1vw",
    marginBottom: "1vh",
  },
  colorChip: {
    fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)",
  },
  colorText: {
    fontSize: "clamp(0.8rem, 2vw, 1rem)",
    color: "#6b7280",
    fontWeight: "600",
  },
  playerStatus: {
    fontSize: "clamp(0.8rem, 1.8vw, 1rem)",
    color: "#4caf50",
    fontWeight: "600",
  },
  vsDivider: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 1vw",
  },
  vsCircle: {
    width: "clamp(50px, 10vw, 80px)",
    height: "clamp(50px, 10vw, 80px)",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "900",
    fontSize: "clamp(1rem, 2.5vw, 1.5rem)",
    boxShadow: "0 1vh 2vh rgba(255, 107, 107, 0.4)",
    position: "relative",
    animation: "pulse 2s ease-in-out infinite",
  },
  vsText: {
    position: "relative",
    zIndex: 2,
  },
  vsGlow: {
    position: "absolute",
    top: "-0.5vh",
    left: "-0.5vh",
    right: "-0.5vh",
    bottom: "-0.5vh",
    borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(255, 107, 107, 0.3), rgba(238, 90, 36, 0.3))",
    filter: "blur(0.5vh)",
    animation: "glow 2s ease-in-out infinite alternate",
  },
  settingsSection: {
    marginBottom: "3vh",
  },
  settingsTitle: {
    fontSize: "clamp(1.2rem, 3vw, 1.6rem)",
    fontWeight: "700",
    color: "#4e342e",
    marginBottom: "2vh",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  settingsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "2vh",
  },
  settingCard: {
    background: "rgba(255, 255, 255, 0.9)",
    borderRadius: "2vh",
    padding: "2vh 2vw",
    border: "0.2vh solid rgba(141, 110, 99, 0.1)",
    boxShadow: "0 1vh 2vh rgba(141, 110, 99, 0.1)",
    transition: "all 0.3s ease",
  },
  settingHeader: {
    display: "flex",
    alignItems: "center",
    gap: "1vw",
    marginBottom: "1.5vh",
  },
  settingIcon: {
    fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
  },
  settingLabel: {
    fontSize: "clamp(0.9rem, 2.2vw, 1.1rem)",
    fontWeight: "700",
    color: "#4e342e",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  timeOptions: {
    display: "flex",
    gap: "1vw",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  timeButton: {
    padding: "1vh 1.5vw",
    border: "0.2vh solid rgba(141, 110, 99, 0.3)",
    borderRadius: "1vh",
    backgroundColor: "white",
    color: "#8d6e63",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    fontSize: "clamp(0.8rem, 2vw, 1rem)",
    fontWeight: "600",
    minWidth: "clamp(40px, 8vw, 60px)",
    textAlign: "center",
    boxShadow: "0 0.5vh 1vh rgba(141, 110, 99, 0.2)",
  },
  timeButtonActive: {
    borderColor: "#8d6e63",
    backgroundColor: "#8d6e63",
    color: "white",
    transform: "translateY(-0.2vh) scale(1.05)",
    boxShadow: "0 1vh 2vh rgba(141, 110, 99, 0.4)",
  },
  colorSwitchButton: {
    width: "100%",
    padding: "1.5vh 2vw",
    border: "0.2vh solid rgba(141, 110, 99, 0.3)",
    borderRadius: "1.5vh",
    backgroundColor: "white",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 0.5vh 1.5vh rgba(141, 110, 99, 0.2)",
  },
  colorPreview: {
    display: "flex",
    alignItems: "center",
    gap: "1vw",
  },
  colorPreviewIcon: {
    fontSize: "clamp(1.5rem, 3vw, 2rem)",
  },
  colorPreviewText: {
    fontSize: "clamp(0.9rem, 2.2vw, 1.1rem)",
    fontWeight: "600",
    color: "#4e342e",
  },
  switchIcon: {
    fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)",
    color: "#8d6e63",
    transition: "transform 0.3s ease",
  },
  actionSection: {
    display: "flex",
    flexDirection: "column",
    gap: "2vh",
  },
  startButton: {
    background: "linear-gradient(135deg, #4caf50 0%, #45a049 100%)",
    border: "none",
    borderRadius: "2vh",
    padding: "2vh 2vw",
    color: "white",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 1vh 3vh rgba(76, 175, 80, 0.3)",
    position: "relative",
    overflow: "hidden",
  },
  startButtonDisabled: {
    background: "linear-gradient(135deg, #bbb 0%, #999 100%)",
    cursor: "not-allowed",
    boxShadow: "0 0.5vh 1.5vh rgba(0, 0, 0, 0.2)",
  },
  startButtonContent: {
    display: "flex",
    alignItems: "center",
    gap: "2vw",
    position: "relative",
    zIndex: 1,
  },
  startButtonIcon: {
    fontSize: "clamp(2rem, 4vw, 3rem)",
    minWidth: "clamp(50px, 8vw, 80px)",
    textAlign: "center",
  },
  startButtonText: {
    flex: 1,
    textAlign: "left",
  },
  startButtonTitle: {
    fontSize: "clamp(1.2rem, 3vw, 1.6rem)",
    fontWeight: "700",
    marginBottom: "0.5vh",
    letterSpacing: "-0.01em",
  },
  startButtonSubtitle: {
    fontSize: "clamp(0.8rem, 2vw, 1rem)",
    opacity: 0.9,
    fontWeight: "400",
  },
  startButtonArrow: {
    fontSize: "clamp(1.5rem, 3vw, 2rem)",
    fontWeight: "bold",
    transition: "transform 0.3s ease",
  },
  waitingCard: {
    background: "rgba(255, 255, 255, 0.9)",
    borderRadius: "2vh",
    padding: "3vh 2vw",
    textAlign: "center",
    border: "0.3vh dashed rgba(141, 110, 99, 0.3)",
    boxShadow: "0 1vh 2vh rgba(141, 110, 99, 0.1)",
  },
  waitingAnimation: {
    display: "flex",
    justifyContent: "center",
    gap: "1vw",
    marginBottom: "2vh",
  },
  waitingDot: {
    width: "clamp(8px, 2vw, 15px)",
    height: "clamp(8px, 2vw, 15px)",
    borderRadius: "50%",
    backgroundColor: "#8d6e63",
    animation: "bounce 1.4s ease-in-out infinite both",
  },
  waitingText: {
    fontSize: "clamp(1.1rem, 2.8vw, 1.4rem)",
    fontWeight: "600",
    color: "#4e342e",
    marginBottom: "1vh",
  },
  waitingSubtext: {
    fontSize: "clamp(0.8rem, 2vw, 1rem)",
    color: "#6b7280",
    lineHeight: 1.4,
  },
  leaveButton: {
    padding: "1.5vh 2vw",
    backgroundColor: "rgba(244, 67, 54, 0.9)",
    color: "white",
    border: "none",
    borderRadius: "1.5vh",
    fontSize: "clamp(0.9rem, 2.2vw, 1.1rem)",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1vw",
    boxShadow: "0 0.5vh 1.5vh rgba(244, 67, 54, 0.3)",
  },
  leaveButtonIcon: {
    fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "3vh",
    padding: "5vh 3vw",
    textAlign: "center",
    background: "rgba(252, 248, 243, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: "2vh",
    boxShadow: "0 2vh 4vh rgba(141, 110, 99, 0.2)",
    border: "0.2vh solid #efebe9",
  },
  loadingSpinner: {
    position: "relative",
    width: "clamp(60px, 12vw, 100px)",
    height: "clamp(60px, 12vw, 100px)",
  },
  spinner: {
    width: "100%",
    height: "100%",
    border: "0.5vh solid rgba(141, 110, 99, 0.3)",
    borderTop: "0.5vh solid #8d6e63",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  spinnerInner: {
    position: "absolute",
    top: "25%",
    left: "25%",
    width: "50%",
    height: "50%",
    border: "0.3vh solid rgba(141, 110, 99, 0.5)",
    borderBottom: "0.3vh solid #6d4c41",
    borderRadius: "50%",
    animation: "spin 2s linear infinite reverse",
  },
  loadingText: {
    fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
    fontWeight: "700",
    color: "#4e342e",
  },
  loadingSubtext: {
    fontSize: "clamp(0.9rem, 2.2vw, 1.1rem)",
    color: "#6b7280",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2vh",
    padding: "4vh 3vw",
    textAlign: "center",
    background: "rgba(252, 248, 243, 0.95)",
    borderRadius: "2vh",
    backdropFilter: "blur(10px)",
    border: "0.2vh solid #efebe9",
    boxShadow: "0 2vh 4vh rgba(141, 110, 99, 0.2)",
  },
  errorIcon: {
    fontSize: "clamp(3rem, 6vw, 5rem)",
  },
  errorTitle: {
    fontSize: "clamp(1.4rem, 3.5vw, 2rem)",
    fontWeight: "700",
    color: "#4e342e",
  },
  errorMessage: {
    fontSize: "clamp(1rem, 2.5vw, 1.3rem)",
    color: "#6b7280",
    lineHeight: 1.4,
  },
  errorButton: {
    padding: "1.5vh 2vw",
    backgroundColor: "#f44336",
    color: "white",
    border: "none",
    borderRadius: "1.5vh",
    fontSize: "clamp(0.9rem, 2.2vw, 1.1rem)",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 0.5vh 1.5vh rgba(244, 67, 54, 0.3)",
  },
};

// Add CSS animations
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    25% { transform: translateY(-2vh) rotate(5deg); }
    50% { transform: translateY(-1vh) rotate(-3deg); }
    75% { transform: translateY(-3vh) rotate(8deg); }
  }
  
  @keyframes glow {
    0% { filter: drop-shadow(0 0 0.5vh rgba(141, 110, 99, 0.5)); }
    100% { filter: drop-shadow(0 0 1.5vh rgba(141, 110, 99, 0.8)); }
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
  
  /* Hover effects */
  button:hover .startButtonArrow {
    transform: translateX(0.5vw) !important;
  }
  
  .colorSwitchButton:hover .switchIcon {
    transform: rotate(180deg) !important;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .playersArena {
      flex-direction: column !important;
      gap: 3vh !important;
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
      gap: 2vh !important;
    }
    
    .startButtonText {
      text-align: center !important;
    }
    
    .connectionStatus {
      position: relative !important;
      top: auto !important;
      right: auto !important;
      align-items: center !important;
      margin-bottom: 2vh !important;
    }
  }
  
  @media (max-width: 480px) {
    .timeOptions {
      justify-content: center !important;
    }
    
    .colorPreview {
      gap: 2vw !important;
    }
    
    .container {
      padding: 2vh 4vw !important;
    }
  }
  
  /* Loading animations */
  @keyframes shimmer {
    0% { background-position: -200px 0; }
    100% { background-position: calc(200px + 100%) 0; }
  }
  
  /* Success animation */
  @keyframes successPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  
  .copyButtonSuccess {
    animation: successPulse 0.3s ease-out !important;
  }
  
  /* Connection status animations */
  @keyframes connectionPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  
  .connectionStatus span:first-child {
    animation: connectionPulse 2s ease-in-out infinite;
  }
`;

document.head.appendChild(styleSheet);

export default MultiplayerRoom;