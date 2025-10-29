"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { CallClient, VideoStreamRenderer, LocalVideoStream } from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";
import { ChatClient } from "@azure/communication-chat";

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
  : "http://localhost:4000";

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

export default function JurorConferenceClient() {
  const { id } = useParams();
  const router = useRouter();
  const caseId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";
  
  const [call, setCall] = useState<any>(null);
  const [callState, setCallState] = useState("Initializing...");
  const [participants, setParticipants] = useState<any[]>([]);
  const [featuredParticipant, setFeaturedParticipant] = useState<string>("local");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [displayName, setDisplayName] = useState("You");
  const [renderTrigger, setRenderTrigger] = useState(0);

  // Chat states
  const [chatClient, setChatClient] = useState<any>(null);
  const [chatThread, setChatThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [showChatNotification, setShowChatNotification] = useState(false);
  const [latestMessage, setLatestMessage] = useState<any>(null);

  // Panel states
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showParticipantsPanel, setShowParticipantsPanel] = useState(false);

  // Participant join times
  const [participantJoinTimes, setParticipantJoinTimes] = useState<Map<string, Date>>(new Map());
  
  const featuredVideoRef = useRef<HTMLDivElement>(null);
  const localThumbnailRef = useRef<HTMLDivElement>(null);
  const localVideoStream = useRef<any>(null);
  const localRenderer = useRef<any>(null);
  const localThumbnailRenderer = useRef<any>(null);
  const remoteVideoRefs = useRef<Map<string, any>>(new Map());
  const hasInitialized = useRef(false);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = useRef<string>("");

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    initializeCall();
    return () => {
      if (call) {
        call.hangUp().catch((e: any) => console.error("Hangup error:", e));
      }
      if (localRenderer.current) localRenderer.current.dispose();
      if (localThumbnailRenderer.current) localThumbnailRenderer.current.dispose();
      remoteVideoRefs.current.forEach((r) => r.renderer?.dispose());
    };
  }, []);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (showChatNotification) {
      const timer = setTimeout(() => setShowChatNotification(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showChatNotification]);

  async function renderLocalVideo() {
    if (!localVideoStream.current) return;
    
    try {
      if (featuredParticipant === "local" && featuredVideoRef.current) {
        if (localRenderer.current) localRenderer.current.dispose();
        localRenderer.current = new VideoStreamRenderer(localVideoStream.current);
        const view = await localRenderer.current.createView();
        featuredVideoRef.current.innerHTML = '';
        featuredVideoRef.current.appendChild(view.target);
      }
      
      else if (localThumbnailRef.current) {
        if (localThumbnailRenderer.current) localThumbnailRenderer.current.dispose();
        localThumbnailRenderer.current = new VideoStreamRenderer(localVideoStream.current);
        const thumbnailView = await localThumbnailRenderer.current.createView();
        localThumbnailRef.current.innerHTML = '';
        localThumbnailRef.current.appendChild(thumbnailView.target);
      }
    } catch (err) {
      console.error("Local video render error:", err);
    }
  }

  useEffect(() => {
    renderLocalVideo();
  }, [featuredParticipant, renderTrigger]);

  async function initializeChat(token: string, userId: string, threadId: string, endpoint: string) {
    try {
      console.log("Initializing chat with endpoint:", endpoint);
      
      const tokenCredential = new AzureCommunicationTokenCredential(token);
      const client = new ChatClient(endpoint, tokenCredential);
      
      setChatClient(client);
      const thread = client.getChatThreadClient(threadId);
      setChatThread(thread);
      currentUserId.current = userId;

      await client.startRealtimeNotifications();
      
      client.on("chatMessageReceived", (e: any) => {
        if (e.sender.communicationUserId !== currentUserId.current) {
          const newMsg = {
            id: e.id,
            content: e.message,
            sender: e.senderDisplayName || "Unknown",
            senderId: e.sender.communicationUserId,
            timestamp: new Date(e.createdOn),
          };
          
          setMessages(prev => [...prev, newMsg]);
          
          if (!showChatPanel) {
            setUnreadCount(prev => prev + 1);
            setLatestMessage(newMsg);
            setShowChatNotification(true);
          }
        }
      });

      console.log("Chat initialized successfully!");
    } catch (err) {
      console.error("Chat initialization error:", err);
    }
  }

  async function initializeCall() {
    try {
      setCallState("Getting permissions...");
      const token = getCookie("token");
      
      const response = await fetch(`${API_BASE}/api/trial/juror-join/${caseId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) throw new Error("Not authorized to join this trial");
      const data = await response.json();
      setDisplayName(data.displayName);

      // Initialize chat if available
      if (data.chatThreadId && data.endpointUrl) {
        await initializeChat(data.token, data.userId, data.chatThreadId, data.endpointUrl);
      }

      setCallState("Setting up video...");
      const tokenCredential = new AzureCommunicationTokenCredential(data.token);
      const callClient = new CallClient();
      const deviceManager = await callClient.getDeviceManager();

      const cameras = await deviceManager.getCameras();
      if (cameras.length > 0) {
        localVideoStream.current = new LocalVideoStream(cameras[0]);
      }

      setCallState("Connecting to trial...");

      const agent = await callClient.createCallAgent(tokenCredential, {
        displayName: data.displayName,
      });

      const roomCall = agent.join(
        { roomId: data.roomId },
        {
          videoOptions: localVideoStream.current
            ? { localVideoStreams: [localVideoStream.current] }
            : undefined,
        }
      );

      setCall(roomCall);
      setParticipantJoinTimes(prev => new Map(prev).set("local", new Date()));

      roomCall.on("stateChanged", async () => {
        console.log(`🔄 Call state changed: ${roomCall.state}`);
        setCallState(roomCall.state);
        if (roomCall.state === "Connected") {
          await renderLocalVideo();
          setIsMuted(roomCall.isMuted);
          
          // ✅ CRITICAL FIX #1: Re-subscribe to existing participants' streams after connection
          console.log("🔍 Checking for existing remote participants...");
          roomCall.remoteParticipants.forEach((participant: any) => {
            console.log(`📌 Found existing participant: ${participant.displayName}`);
            subscribeToParticipantStreams(participant, roomCall);
          });
        }
      });

      // ✅ ENHANCED: Better remote participant handling
      roomCall.on('remoteParticipantsUpdated', async (e: any) => {
        console.log("👥 Remote participants updated", {
          added: e.added.length,
          removed: e.removed.length
        });

        for (const participant of e.added) {
          const userId = participant.identifier.communicationUserId;
          console.log(`➕ Participant added: ${participant.displayName} (${userId})`);
          
          setParticipantJoinTimes(prev => new Map(prev).set(userId, new Date()));
          subscribeToParticipantStreams(participant, roomCall);
        }

        for (const participant of e.removed) {
          const userId = participant.identifier.communicationUserId;
          console.log(`➖ Participant removed: ${participant.displayName}`);
          
          const ref = remoteVideoRefs.current.get(userId);
          const screenRef = remoteVideoRefs.current.get(`${userId}-screen`);
          
          if (ref && ref.renderer) {
            ref.renderer.dispose();
            remoteVideoRefs.current.delete(userId);
          }
          if (screenRef && screenRef.renderer) {
            screenRef.renderer.dispose();
            remoteVideoRefs.current.delete(`${userId}-screen`);
          }
          
          if (featuredParticipant === userId || featuredParticipant === `${userId}-screen`) {
            setFeaturedParticipant("local");
          }

          setParticipantJoinTimes(prev => {
            const updated = new Map(prev);
            updated.delete(userId);
            return updated;
          });
        }

        setParticipants([...roomCall.remoteParticipants]);
      });

      // 🔧 FIX #2: Ensure mic state updates are tracked
      roomCall.on("isMutedChanged", () => {
        console.log("🎤 Mute state changed:", roomCall.isMuted);
        setIsMuted(roomCall.isMuted);
      });

      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to join trial");
      setLoading(false);
    }
  }

  // ✅ FIX #1: Centralized stream subscription with better logging
  function subscribeToParticipantStreams(participant: any, roomCall: any) {
    const userId = participant.identifier.communicationUserId;
    
    console.log(`🎥 Subscribing to streams for: ${participant.displayName}`);
    console.log(`   Current video streams:`, participant.videoStreams.map((s: any) => ({
      type: s.mediaStreamType,
      available: s.isAvailable
    })));

    // Subscribe to future stream updates
    participant.on('videoStreamsUpdated', async (ev: any) => {
      console.log(`🔄 Video streams updated for ${participant.displayName}:`, {
        added: ev.added.map((s: any) => s.mediaStreamType),
        removed: ev.removed.map((s: any) => s.mediaStreamType)
      });

      // Handle removed streams
      for (const stream of ev.removed) {
        const streamKey = stream.mediaStreamType === 'ScreenSharing' 
          ? `${userId}-screen`
          : userId;
        
        console.log(`❌ Removing stream: ${streamKey}`);
        
        const ref = remoteVideoRefs.current.get(streamKey);
        if (ref && ref.renderer) {
          ref.renderer.dispose();
        }
        
        // 🔧 FIX #2: Mark as video off for blank black screen
        remoteVideoRefs.current.set(streamKey, {
          renderer: null,
          view: null,
          participant,
          streamType: stream.mediaStreamType,
          videoOff: true
        });
        
        // 🔧 FIX #3: When screenshare stops, auto-switch back to attorney video
        if (stream.mediaStreamType === 'ScreenSharing' && featuredParticipant === streamKey) {
          // Clear featured video FIRST to avoid stuck frame
          if (featuredVideoRef.current) {
            featuredVideoRef.current.innerHTML = "";
          }
          setFeaturedParticipant("local");
          console.log("✅ Screen share stopped - switched back to local video");
        }
        
        setRenderTrigger(prev => prev + 1);
      }

      // Handle added streams
      for (const stream of ev.added) {
        console.log(`➕ Stream added: ${stream.mediaStreamType}, available: ${stream.isAvailable}`);
        
        if (stream.isAvailable) {
          await renderRemoteStream(stream, participant, userId);
        } else {
          // Subscribe to isAvailable changes
          console.log(`⏳ Stream not yet available, subscribing to availability changes...`);
          stream.on('isAvailableChanged', async () => {
            console.log(`🔔 Stream availability changed: ${stream.mediaStreamType} -> ${stream.isAvailable}`);
            if (stream.isAvailable) {
              await renderRemoteStream(stream, participant, userId);
            }
          });
        }
      }
    });

    // Process existing streams (important for screen shares that started before joining)
    for (const stream of participant.videoStreams) {
      console.log(`📺 Processing existing stream: ${stream.mediaStreamType}, available: ${stream.isAvailable}`);
      
      if (stream.isAvailable) {
        renderRemoteStream(stream, participant, userId);
      } else {
        // Subscribe to availability changes for existing streams too
        stream.on('isAvailableChanged', async () => {
          console.log(`🔔 Existing stream availability changed: ${stream.mediaStreamType} -> ${stream.isAvailable}`);
          if (stream.isAvailable) {
            await renderRemoteStream(stream, participant, userId);
          }
        });
      }
    }
  }

  // ✅ FIX #1: Dedicated remote stream renderer with better error handling
  async function renderRemoteStream(stream: any, participant: any, userId: string) {
    try {
      const streamKey = stream.mediaStreamType === 'ScreenSharing' 
        ? `${userId}-screen`
        : userId;
      
      console.log(`🎬 Rendering stream: ${streamKey}`);
      
      // Clean up old renderer if exists
      const existingRef = remoteVideoRefs.current.get(streamKey);
      if (existingRef && existingRef.renderer) {
        console.log(`♻️ Disposing old renderer for ${streamKey}`);
        existingRef.renderer.dispose();
      }

      const renderer = new VideoStreamRenderer(stream);
      const view = await renderer.createView();
      
      remoteVideoRefs.current.set(streamKey, {
        renderer,
        view,
        participant,
        streamType: stream.mediaStreamType,
        videoOff: false
      });
      
      console.log(`✅ Stream rendered successfully: ${streamKey}`);
      
      // ✅ Auto-switch to screen share if it's a screen sharing stream
      if (stream.mediaStreamType === 'ScreenSharing') {
        console.log(`📺 Auto-switching to screen share from ${participant.displayName}`);
        setFeaturedParticipant(streamKey);
      }
      
      setRenderTrigger(prev => prev + 1);
    } catch (err) {
      console.error(`❌ Error rendering remote stream:`, err);
    }
  }

  const sendMessage = async () => {
    if (!chatThread || !newMessage.trim()) return;

    try {
      await chatThread.sendMessage({ content: newMessage });
      
      const msg = {
        id: Date.now().toString(),
        content: newMessage,
        sender: displayName,
        senderId: currentUserId.current,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, msg]);
      setNewMessage("");
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  const toggleChatPanel = () => {
    setShowChatPanel(!showChatPanel);
    if (!showChatPanel) {
      setUnreadCount(0);
      setShowChatNotification(false);
      if (showParticipantsPanel) setShowParticipantsPanel(false);
    }
  };

  const toggleParticipantsPanel = () => {
    setShowParticipantsPanel(!showParticipantsPanel);
    if (!showParticipantsPanel && showChatPanel) {
      setShowChatPanel(false);
    }
  };

  // 🔧 FIX #2: Ensure mic toggle actually works
  const toggleMute = async () => {
    if (!call) return;
    try {
      if (call.isMuted) {
        await call.unmute();
        console.log("🎤 Unmuted");
      } else {
        await call.mute();
        console.log("🔇 Muted");
      }
    } catch (err) {
      console.error("Toggle mute error:", err);
    }
  };

  const toggleVideo = async () => {
    if (!call || !localVideoStream.current) return;
    try {
      if (isVideoOff) {
        await call.startVideo(localVideoStream.current);
        setIsVideoOff(false);
        await renderLocalVideo();
      } else {
        await call.stopVideo(localVideoStream.current);
        setIsVideoOff(true);
      }
    } catch (err) {
      console.error("Toggle video error:", err);
    }
  };

  const leaveCall = async () => {
    if (call) await call.hangUp();
    if (chatClient) await chatClient.stopRealtimeNotifications();
    router.push("/juror");
  };

  function formatTime(date: Date): string {
    if (!date) return "Unknown";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#E8E5DD]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#0078D4] mb-4"></div>
          <p className="text-lg font-medium text-gray-700">{callState}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#E8E5DD]">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Unable to Join Trial</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/juror")}
            className="w-full px-6 py-3 bg-[#0078D4] text-white rounded-lg hover:bg-[#005A9E] transition font-medium"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const featuredVideo =
    featuredParticipant && featuredParticipant !== "local"
      ? remoteVideoRefs.current.get(featuredParticipant)
      : null;

  const allParticipants = [
    { 
      id: "local", 
      displayName: displayName, 
      isLocal: true,
      joinTime: participantJoinTimes.get("local")
    },
    ...participants.map((p: any) => ({
      id: p.identifier.communicationUserId,
      displayName: p.displayName || "Participant",
      isLocal: false,
      joinTime: participantJoinTimes.get(p.identifier.communicationUserId)
    }))
  ];

  return (
    <div className="h-screen bg-[#E8E5DD] flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-14 bg-[#1B3A5F] flex flex-col items-center py-6 flex-shrink-0">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-8">
          <span className="text-[#1B3A5F] font-bold text-xl">Q</span>
        </div>

        <button className="mb-4 flex flex-col items-center gap-1 text-white hover:bg-[#2A4A6F] w-full py-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-[9px]">Case<br/>Info</span>
        </button>

        <div className="flex-1"></div>

        <button className="mt-auto flex flex-col items-center gap-1 text-white hover:bg-[#2A4A6F] w-full py-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[9px]">Help</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-between p-6 overflow-hidden">
        {/* Featured Video */}
        <div className="flex justify-center items-center h-[60vh] mb-4">
          <div className="w-full max-w-5xl h-full bg-white border-4 border-[#0078D4] rounded-lg shadow-xl overflow-hidden relative">
            <div className="w-full h-full">
              {featuredVideo ? (
                <>
                  {featuredVideo.view && !featuredVideo.videoOff ? (
                    <div
                      ref={(el) => {
                        if (el && featuredVideo.view && featuredParticipant) {
                          el.innerHTML = "";
                          el.appendChild(featuredVideo.view.target);
                        }
                      }}
                      className="w-full h-full [&>div]:!w-full [&>div]:!h-full [&_video]:object-contain"
                    />
                  ) : (
                    // 🔧 FIX #2: Complete black screen when camera is off
                    <div className="absolute inset-0 bg-black"></div>
                  )}
                  {featuredVideo.streamType === 'ScreenSharing' && !featuredVideo.videoOff && (
                    <div className="absolute top-2 left-2 bg-[#0078D4] text-white px-3 py-1.5 rounded text-sm font-semibold shadow-lg flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {featuredVideo.participant.displayName}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {featuredParticipant === "local" ? (
                    <>
                      <div
  ref={featuredVideoRef}
  className="flex items-center justify-center w-full h-full bg-black"
/>

                      {/* 🔧 FIX #2: Complete black screen when juror camera is off */}
                      {isVideoOff && (
                        <div className="absolute inset-0 bg-black"></div>
                      )}
                    </>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Participant Thumbnails */}
        <div className="flex gap-4 justify-center h-[14vh] items-center overflow-x-auto">
          <button
            onClick={() => setFeaturedParticipant("local")}
            className={`flex-shrink-0 text-center ${
              featuredParticipant === "local" ? "opacity-100" : "opacity-70 hover:opacity-100"
            }`}
          >
            <div className="w-28 h-20 bg-black rounded-lg overflow-hidden mb-2 relative">
              {!isVideoOff && featuredParticipant !== "local" && (
  <div ref={localThumbnailRef} className="w-full h-full [&_video]:object-cover" />
)}
              {/* 🔧 FIX #2: Complete black thumbnail when camera is off */}
              {isVideoOff && (
                <div className="absolute inset-0 bg-black"></div>
              )}
            </div>
            <div className="text-sm font-medium text-gray-800">{displayName}</div>
          </button>

          {participants
            .filter((p) => {
              const userId = p.identifier.communicationUserId;
              return userId && userId !== featuredParticipant && !featuredParticipant?.includes(`${userId}-screen`);
            })
            .map((p: any) => {
              const userId = p.identifier.communicationUserId;
              const videoRef = remoteVideoRefs.current.get(userId);

              return (
                <button
                  key={userId}
                  onClick={() => setFeaturedParticipant(userId)}
                  className={`flex-shrink-0 text-center ${
                    featuredParticipant === userId ? "opacity-100" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="w-28 h-20 bg-black rounded-lg overflow-hidden mb-2 relative">
                    {videoRef?.view && !videoRef?.videoOff ? (
                      <div
                        ref={(el) => {
                          if (el && videoRef.view) {
                            el.innerHTML = "";
                            el.appendChild(videoRef.view.target);
                          }
                        }}
                        className="w-full h-full [&_video]:object-cover"
                      />
                    ) : (
                      // 🔧 FIX #2: Complete black screen for remote participants when camera off
                      <div className="absolute inset-0 bg-black"></div>
                    )}
                  </div>
                  <div className="text-sm font-medium text-gray-800">{p.displayName}</div>
                </button>
              );
            })}
        </div>

        {/* Control Bar */}
        <div className="bg-white rounded-lg shadow-lg px-6 py-3 flex items-center justify-center gap-6 h-[10vh]">
          <button
            onClick={toggleMute}
            className="flex flex-col items-center gap-1 hover:opacity-70 transition"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isMuted ? "bg-red-100" : "bg-gray-100"
            }`}>
              <svg className={`w-6 h-6 ${isMuted ? "text-red-600" : "text-gray-700"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMuted ? "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" : "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"} />
              </svg>
            </div>
            <span className="text-xs text-gray-700">{isMuted ? "Unmute" : "Mute"}</span>
          </button>

          <button
            onClick={toggleVideo}
            className="flex flex-col items-center gap-1 hover:opacity-70 transition"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isVideoOff ? "bg-red-100" : "bg-gray-100"
            }`}>
              <svg className={`w-6 h-6 ${isVideoOff ? "text-red-600" : "text-gray-700"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isVideoOff ? "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z M3 3l18 18" : "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"} />
              </svg>
            </div>
            <span className="text-xs text-gray-700">{isVideoOff ? "Start Video" : "Turn off"}</span>
          </button>

          <button 
            onClick={toggleParticipantsPanel}
            className="flex flex-col items-center gap-1 hover:opacity-70 transition relative"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              showParticipantsPanel ? "bg-blue-100" : "bg-gray-100"
            }`}>
              <svg className={`w-6 h-6 ${showParticipantsPanel ? "text-blue-600" : "text-gray-700"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-xs text-gray-700">Participants</span>
          </button>

          <button 
            onClick={toggleChatPanel}
            className="flex flex-col items-center gap-1 hover:opacity-70 transition relative"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              showChatPanel ? "bg-blue-100" : "bg-gray-100"
            }`}>
              <svg className={`w-6 h-6 ${showChatPanel ? "text-blue-600" : "text-gray-700"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unreadCount}
              </div>
            )}
            <span className="text-xs text-gray-700">Chat</span>
          </button>

          <button
            onClick={leaveCall}
            className="flex flex-col items-center gap-1 hover:opacity-70 transition"
          >
            <div className="w-12 h-12 rounded-full bg-[#A4262C] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 17l-4 4m0 0l-4-4m4 4V3" transform="rotate(135 12 12)" />
              </svg>
            </div>
            <span className="text-xs text-[#A4262C] font-medium">Leave</span>
          </button>
        </div>
      </div>

      {/* Participants Panel */}
      {showParticipantsPanel && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-2xl">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-[#16305B]">
            <h3 className="font-semibold text-white">Participants ({allParticipants.length})</h3>
            <button onClick={() => setShowParticipantsPanel(false)} className="text-white hover:text-gray-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {allParticipants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg mb-2">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {participant.displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {participant.displayName} {participant.isLocal && "(You)"}
                  </div>
                  <div className="text-xs text-gray-500">
                    Joined {participant.joinTime ? formatTime(participant.joinTime) : "Unknown"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Panel */}
      {showChatPanel && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-2xl">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-[#16305B]">
            <h3 className="font-semibold text-white">Chat</h3>
            <button onClick={() => setShowChatPanel(false)} className="text-white hover:text-gray-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-8">
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.senderId === currentUserId.current ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[85%] rounded-lg p-3 ${
                    msg.senderId === currentUserId.current ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {msg.senderId !== currentUserId.current && (
                      <div className="text-xs font-semibold mb-1">{msg.sender}</div>
                    )}
                    <div className="text-sm break-words">{msg.content}</div>
                    <div className={`text-xs mt-1 ${msg.senderId === currentUserId.current ? 'text-blue-100' : 'text-gray-500'}`}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={chatMessagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                style={{ color: '#000000' }}
                disabled={!chatThread}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || !chatThread}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            {!chatThread && (
              <p className="text-xs text-red-500 mt-2">Chat unavailable</p>
            )}
          </div>
        </div>
      )}

      {/* Chat Notification Popup */}
      {showChatNotification && latestMessage && !showChatPanel && (
        <div 
          onClick={toggleChatPanel}
          className="fixed bottom-24 right-6 w-80 bg-white rounded-lg shadow-2xl p-4 cursor-pointer hover:shadow-xl transition-shadow animate-slide-up z-50 border-l-4 border-blue-500"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
              {latestMessage.sender.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-sm">{latestMessage.sender}</div>
              <div className="text-sm text-gray-700 truncate">{latestMessage.content}</div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowChatNotification(false);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}