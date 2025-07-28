// MultiplayerRoom.jsx
import React, { useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "../utils/firebase";

const MultiplayerRoom = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { roomId } = useParams();
  const username = searchParams.get("username");

  // Step 1: Generate a new room ID if not present
  const generatedRoomId = roomId || Math.random().toString(36).substring(2, 8);
  const roomRef = doc(firestore, "rooms", generatedRoomId);

  useEffect(() => {
    if (!username) {
      alert("❌ Missing username in URL.");
      navigate("/");
      return;
    }

    const setupRoom = async () => {
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        // ✅ Create new room
        await setDoc(roomRef, {
          whitePlayer: username,
          blackPlayer: null,
          createdAt: serverTimestamp(),
        });

        // Wait for Firestore to propagate
        setTimeout(() => {
          navigate(`/multiplayer-game/${generatedRoomId}?username=${username}&color=w`);
        }, 500);
        return;
      }

      const data = roomSnap.data();

      // ✅ If user already exists
      if (data.whitePlayer === username) {
        navigate(`/multiplayer-game/${generatedRoomId}?username=${username}&color=w`);
        return;
      }

      if (data.blackPlayer === username) {
        navigate(`/multiplayer-game/${generatedRoomId}?username=${username}&color=b`);
        return;
      }

      if (!data.blackPlayer) {
        await updateDoc(roomRef, { blackPlayer: username });
        navigate(`/multiplayer-game/${generatedRoomId}?username=${username}&color=b`);
        return;
      }

      alert("❌ Room is full.");
      navigate("/");
    };

    setupRoom();
  }, [navigate, searchParams, username]);

  return (
    <div style={{ textAlign: "center", marginTop: "100px", color: "white" }}>
      <h2>Setting up Multiplayer Room...</h2>
    </div>
  );
};

export default MultiplayerRoom;
