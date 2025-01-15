import React, { useState, useEffect } from "react";
import { addDoc, collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase/firebase";
import AgoraRTC from "agora-rtc-sdk-ng";

function Call() {
  const agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

  const [userId, setUserId] = useState(""); // Current user ID
  const [calleeId, setCalleeId] = useState(""); // ID of the user to call
  const [incomingCall, setIncomingCall] = useState(null); // Incoming call data
  const [channelId, setChannelId] = useState(""); // Channel ID for the call
  const [isInCall, setIsInCall] = useState(false); // Call state

  // Listen for incoming calls or call updates
  useEffect(() => {
    if (!userId) return;

    const callQuery = query(
      collection(db, "calls"),
      where("calleeId", "==", userId)
    );

    const unsubscribe = onSnapshot(callQuery, (snapshot) => {
      snapshot.forEach((doc) => {
        const callData = doc.data();
        if (callData.status === "ringing") {
          setIncomingCall({ id: doc.id, ...callData });
        } else if (callData.status === "accepted" && callData.callerId === userId) {
          // Join call when User A is notified of acceptance
          joinChannel(callData.channelId);
        }
      });
    });

    return () => unsubscribe();
  }, [userId]);

  // Initiate a call
  const initiateCall = async () => {
    if (!calleeId) {
      alert("Please enter the callee ID");
      return;
    }

    const channel = `call-${Date.now()}`;
    setChannelId(channel);

    await addDoc(collection(db, "calls"), {
      callerId: userId,
      calleeId,
      channelId: "demo",
      status: "ringing",
    });

    console.log(`Calling ${calleeId} on channel ${channel}`);
  };

  // Accept a call
  const acceptCall = async () => {
    if (!incomingCall) return;

    const callDoc = doc(db, "calls", incomingCall.id);
    await updateDoc(callDoc, { status: "accepted" });

    setChannelId(incomingCall.channelId);
    setIsInCall(true);
    joinChannel(incomingCall.channelId);

    setIncomingCall(null);
  };

  // Decline a call
  const declineCall = async () => {
    if (!incomingCall) return;

    const callDoc = doc(db, "calls", incomingCall.id);
    await updateDoc(callDoc, { status: "declined" });

    setIncomingCall(null);
  };

  // Join the Agora channel
  const joinChannel = async (channel) => {
    try {
      await agoraClient.join(
        import.meta.env.VITE_APP_AGORA_APP_ID,
        "demo",
        import.meta.env.VITE_APP_AGORA_TOKEN,
        userId
      );

      const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      await agoraClient.publish([localAudioTrack]);

      agoraClient.on("user-published", async (user, mediaType) => {
        await agoraClient.subscribe(user, mediaType);
        if (mediaType === "audio") {
          const remoteAudioTrack = user.audioTrack;
          remoteAudioTrack.play();
        }
      });

      console.log(`Joined channel: ${channel}`);
    } catch (error) {
      console.error("Failed to join channel:", error);
    }
  };

  // Leave the Agora channel
  const leaveCall = async () => {
    await agoraClient.leave();
    setIsInCall(false);
    setChannelId("");
    console.log("Left the call");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Agora Voice Call</h1>
      {!userId && (
        <div>
          <label>
            Enter your User ID:{" "}
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </label>
        </div>
      )}
      {userId && !isInCall && (
        <div>
          <h2>Make a Call</h2>
          <label>
            Enter Callee ID:{" "}
            <input
              type="text"
              value={calleeId}
              onChange={(e) => setCalleeId(e.target.value)}
            />
          </label>
          <button onClick={initiateCall}>Call</button>
        </div>
      )}
      {incomingCall && (
        <div>
          <h2>Incoming Call from {incomingCall.callerId}</h2>
          <button onClick={acceptCall}>Accept</button>
          <button onClick={declineCall}>Decline</button>
        </div>
      )}
      {isInCall && (
        <div>
          <h2>In Call</h2>
          <button onClick={leaveCall}>End Call</button>
        </div>
      )}
    </div>
  );
}

export default Call;
