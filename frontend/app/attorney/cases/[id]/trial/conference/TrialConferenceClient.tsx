"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CallClient,
  VideoStreamRenderer,
  LocalVideoStream,
} from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";
import { ChatClient } from "@azure/communication-chat";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "")
  : "http://localhost:4000";

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
}

export default function TrialConferenceClient() {
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
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenShareStream = useRef<any>(null);
  const screenShareRenderer = useRef<any>(null);
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
      if (screenShareRenderer.current) screenShareRenderer.current.dispose(); 
      remoteVideoRefs.current.forEach((r) => r.renderer?.dispose());
    };
  }, []);

  async function renderLocalVideo() {
  if (!localVideoStream.current) return;

  try {
    // ✅ ONLY render to ONE place at a time based on where you are
    if (featuredParticipant === "local" && featuredVideoRef.current) {
      // You're in main view - render to featured card only
      if (localRenderer.current) localRenderer.current.dispose();
      localRenderer.current = new VideoStreamRenderer(localVideoStream.current);
      const view = await localRenderer.current.createView();
      featuredVideoRef.current.innerHTML = "";
      featuredVideoRef.current.appendChild(view.target);
    } else if (localThumbnailRef.current) {  // ✅ Changed: if → else if
      // You're NOT in main view - render to thumbnail only
      if (localThumbnailRenderer.current)
        localThumbnailRenderer.current.dispose();
      localThumbnailRenderer.current = new VideoStreamRenderer(localVideoStream.current);
      const thumbnailView = await localThumbnailRenderer.current.createView();
      localThumbnailRef.current.innerHTML = "";
      localThumbnailRef.current.appendChild(thumbnailView.target);
    }
  } catch (err) {
    console.error("Local video render error:", err);
  }
}

  async function renderScreenShare() {
    if (!screenShareStream.current || !featuredVideoRef.current) return;

    try {
      console.log("Rendering screen share...");
      
      // Dispose old renderer
      if (screenShareRenderer.current) {
        screenShareRenderer.current.dispose();
      }
      
      // Create new renderer for screen share
      screenShareRenderer.current = new VideoStreamRenderer(screenShareStream.current);
      const view = await screenShareRenderer.current.createView();
      
      // Clear and append to featured video
      featuredVideoRef.current.innerHTML = "";
      featuredVideoRef.current.appendChild(view.target);
      
      console.log("✅ Screen share rendered");
    } catch (err) {
      console.error("Screen share render error:", err);
    }
  }

  useEffect(() => {
    renderLocalVideo();
  }, [featuredParticipant, renderTrigger]);

  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  async function initializeChat(token: string, userId: string, threadId: string, endpoint: string) {
    try {
      console.log("Initializing chat with endpoint:", endpoint);
      
      const tokenCredential = new AzureCommunicationTokenCredential(token);
      const client = new ChatClient(endpoint, tokenCredential);
      
      setChatClient(client);
      const thread = client.getChatThreadClient(threadId);
      setChatThread(thread);
      currentUserId.current = userId;

      // Listen for new messages
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
            setTimeout(() => setShowChatNotification(false), 5000);
          }
        }
      });

      console.log("Chat initialized successfully!");
      
      // Load message history
      try {
        const messagesIterator = thread.listMessages({ maxPageSize: 50 });
        const loadedMessages: any[] = [];
        
        for await (const message of messagesIterator) {
          if (message.type === "text") {
            loadedMessages.push({
              id: message.id,
              content: message.content?.message || "",
              sender: message.senderDisplayName || "Unknown",
              senderId: message.sender?.communicationUserId || "",
              timestamp: new Date(message.createdOn),
            });
          }
        }
        
        // Sort by timestamp (oldest first)
        loadedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        setMessages(loadedMessages);
        console.log(`✅ Loaded ${loadedMessages.length} chat messages`);
        
      } catch (historyErr) {
        console.log("No message history yet (this is normal for new chats)");
      }
      
    } catch (err) {
      console.error("Chat initialization error:", err);
    }
  }

  async function initializeCall() {
    try {
      setCallState("Getting permissions...");
      const token = getCookie("token");

      const response = await fetch(`${API_BASE}/api/trial/join/${caseId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to join trial");
      const data = await response.json();
      setDisplayName(data.displayName);

      // Initialize chat
      if (data.chatThreadId && data.endpointUrl) {
        await initializeChat(data.token, data.userId, data.chatThreadId, data.endpointUrl);
      }

      setCallState("Initializing devices...");

      const callClient = new CallClient();
      const tokenCredential = new AzureCommunicationTokenCredential(data.token);
      const deviceManager = await callClient.getDeviceManager();
      await deviceManager.askDevicePermission({ video: true, audio: true });

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

      // Track local join time
      setParticipantJoinTimes(prev => new Map(prev).set("local", new Date()));

      roomCall.on("stateChanged", async () => {
        setCallState(roomCall.state);
        if (roomCall.state === "Connected") {
          await renderLocalVideo();
          setIsMuted(roomCall.isMuted);
        }
      });

      // 🔧 FIX #3: Listen for screen share stop and auto-switch back to attorney video
      roomCall.on("localVideoStreamsUpdated", (e: any) => {
        console.log("Local video streams updated:", e);
        
        e.added.forEach(async (stream: any) => {
          console.log("Stream added:", stream.mediaStreamType);
          
          if (stream.mediaStreamType === "ScreenSharing") {
            // Screen share started
            screenShareStream.current = stream;
            setFeaturedParticipant("screenshare");
            setRenderTrigger(prev => prev + 1);
            console.log("✅ Screen share stream detected");
          }
        });
        
        e.removed.forEach((stream: any) => {
          console.log("Stream removed:", stream.mediaStreamType);
          
          if (stream.mediaStreamType === "ScreenSharing") {
            // 🔧 FIX #3: Screen share stopped - IMMEDIATELY clear and switch back
            console.log("🔥 Screen share stopped - cleaning up...");
            
            // Clear the featured video ref FIRST to remove stuck frame
            if (featuredVideoRef.current) {
              featuredVideoRef.current.innerHTML = "";
              console.log("✅ Cleared featured video element");
            }
            
            // Dispose screen share renderer
            if (screenShareRenderer.current) {
              screenShareRenderer.current.dispose();
              screenShareRenderer.current = null;
            }
            screenShareStream.current = null;
            setIsScreenSharing(false);
            
            // Switch back to attorney video
            setFeaturedParticipant("local");
            
            // Force re-render of local video
            setTimeout(() => {
              setRenderTrigger(prev => prev + 1);
              console.log("✅ Switched back to attorney video");
            }, 50);
          }
        });
      });

      // 🔧 FIX #1: Enhanced remote participant video stream handling
      roomCall.on("remoteParticipantsUpdated", (e: any) => {
        e.added.forEach((participant: any) => {
          console.log("Remote participant added:", participant.displayName);
          
          // Track join time
          const userId = participant.identifier.communicationUserId;
          setParticipantJoinTimes(prev => new Map(prev).set(userId, new Date()));
          
          // Subscribe to their video streams with enhanced logging
          participant.on("videoStreamsUpdated", (streamEvent: any) => {
            console.log(`📹 Video streams updated for ${participant.displayName}`);
            
            streamEvent.added.forEach(async (stream: any) => {
              console.log(`➕ Stream added - Type: ${stream.mediaStreamType}, Available: ${stream.isAvailable}`);
              
              if (stream.mediaStreamType === "Video") {
                // Regular camera stream
                if (stream.isAvailable) {
                  await renderRemoteVideo(stream, participant, userId);
                } else {
                  // Wait for stream to become available
                  console.log(`⏳ Waiting for video stream to become available...`);
                  stream.on("isAvailableChanged", async () => {
                    console.log(`🔔 Video stream availability changed: ${stream.isAvailable}`);
                    if (stream.isAvailable) {
                      await renderRemoteVideo(stream, participant, userId);
                    }
                  });
                }
              } else if (stream.mediaStreamType === "ScreenSharing") {
                // Remote participant started screen sharing
                console.log(`${participant.displayName} is sharing screen`);
                
                // Render their screen share
                try {
                  const renderer = new VideoStreamRenderer(stream);
                  const view = await renderer.createView();
                  
                  if (featuredVideoRef.current) {
                    featuredVideoRef.current.innerHTML = "";
                    featuredVideoRef.current.appendChild(view.target);
                    setFeaturedParticipant(`remote-${participant.identifier}`);
                  }
                  
                  // Store renderer for cleanup
                  remoteVideoRefs.current.set(`screenshare-${participant.identifier}`, {
                    stream,
                    renderer,
                    view
                  });
                } catch (err) {
                  console.error("Error rendering remote screen share:", err);
                }
              }
            });
            
            streamEvent.removed.forEach((stream: any) => {
              console.log(`➖ Stream removed - Type: ${stream.mediaStreamType}`);
              
              if (stream.mediaStreamType === "Video") {
                // 🔧 FIX #2: Mark video as off instead of disposing
                remoteVideoRefs.current.set(userId, {
                  ...remoteVideoRefs.current.get(userId),
                  videoOff: true
                });
                setRenderTrigger(prev => prev + 1);
              } else if (stream.mediaStreamType === "ScreenSharing") {
                // 🔧 FIX #3: Remote participant stopped screen sharing - auto-switch back
                const key = `screenshare-${participant.identifier}`;
                const ref = remoteVideoRefs.current.get(key);
                if (ref) {
                  ref.renderer?.dispose();
                  remoteVideoRefs.current.delete(key);
                }
                
                // Clear and switch back to attorney video
                if (featuredVideoRef.current) {
                  featuredVideoRef.current.innerHTML = "";
                }
                setFeaturedParticipant("local");
                setRenderTrigger(prev => prev + 1);
                console.log("✅ Remote screen share removed - switched back to attorney video");
              }
            });
          });
          
          // 🔧 FIX #1: Process existing streams immediately
          console.log(`📺 Processing ${participant.videoStreams.length} existing streams for ${participant.displayName}`);
          participant.videoStreams.forEach(async (stream: any) => {
            console.log(`📺 Existing stream - Type: ${stream.mediaStreamType}, Available: ${stream.isAvailable}`);
            
            if (stream.mediaStreamType === "Video") {
              if (stream.isAvailable) {
                await renderRemoteVideo(stream, participant, userId);
              } else {
                stream.on("isAvailableChanged", async () => {
                  console.log(`🔔 Existing video stream availability changed: ${stream.isAvailable}`);
                  if (stream.isAvailable) {
                    await renderRemoteVideo(stream, participant, userId);
                  }
                });
              }
            }
          });
        });
        
        e.removed.forEach((participant: any) => {
          console.log("Remote participant removed:", participant.displayName);
          
          const userId = participant.identifier.communicationUserId;
          
          // Cleanup their video
          const ref = remoteVideoRefs.current.get(userId);
          if (ref && ref.renderer) {
            ref.renderer.dispose();
            remoteVideoRefs.current.delete(userId);
          }
          
          // Cleanup their screen share if any
          const screenKey = `screenshare-${participant.identifier}`;
          const screenRef = remoteVideoRefs.current.get(screenKey);
          if (screenRef) {
            screenRef.renderer?.dispose();
            remoteVideoRefs.current.delete(screenKey);
          }
          
          // Remove join time
          setParticipantJoinTimes(prev => {
            const updated = new Map(prev);
            updated.delete(userId);
            return updated;
          });
        });
        
        setParticipants([...roomCall.remoteParticipants]);
      });

      roomCall.on("isMutedChanged", () => {
        setIsMuted(roomCall.isMuted);
      });

      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to join trial");
      setLoading(false);
    }
  }

  // 🔧 FIX #1: Dedicated function to render remote video streams
  async function renderRemoteVideo(stream: any, participant: any, userId: string) {
    try {
      console.log(`🎬 Rendering video for ${participant.displayName}`);
      
      // Dispose existing renderer if any
      const existingRef = remoteVideoRefs.current.get(userId);
      if (existingRef && existingRef.renderer) {
        console.log(`♻️ Disposing old renderer for ${userId}`);
        existingRef.renderer.dispose();
      }
      
      const renderer = new VideoStreamRenderer(stream);
      const view = await renderer.createView();
      
      remoteVideoRefs.current.set(userId, {
        renderer,
        view,
        participant,
        streamType: 'Video',
        videoOff: false
      });
      
      console.log(`✅ Video rendered successfully for ${participant.displayName}`);
      setRenderTrigger(prev => prev + 1);
    } catch (err) {
      console.error(`❌ Error rendering video for ${participant.displayName}:`, err);
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

  const toggleMute = async () => {
    if (!call) return;
    try {
      if (call.isMuted) {
        await call.unmute();
      } else {
        await call.mute();
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

  const toggleScreenShare = async () => {
    if (!call) return;
    
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        await call.stopScreenSharing();
        setIsScreenSharing(false);
        
        // Dispose screen share renderer
        if (screenShareRenderer.current) {
          screenShareRenderer.current.dispose();
          screenShareRenderer.current = null;
        }
        screenShareStream.current = null;
        
        // Switch back to local video
        setFeaturedParticipant("local");
        setRenderTrigger(prev => prev + 1);
        
        console.log("✅ Screen sharing stopped");
      } else {
        // Start screen sharing
        await call.startScreenSharing();
        setIsScreenSharing(true);
        console.log("✅ Screen sharing started");
        
        // The localVideoStreamsUpdated event will handle rendering
      }
    } catch (err: any) {
      console.error("Screen share error:", err);
      setIsScreenSharing(false);
      alert("Screen sharing failed. Please try again.");
    }
  };

  const leaveCall = async () => {
    if (call) await call.hangUp();
    if (chatClient) await chatClient.stopRealtimeNotifications();
    router.push("/attorney");
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#E8E5DD] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#16305B] mx-auto mb-4"></div>
          <p className="text-[#16305B] text-lg font-medium">{callState}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-[#E8E5DD] flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Failed to Join Trial</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => router.push("/attorney")}
            className="w-full py-2 bg-[#16305B] text-white rounded hover:bg-[#0A2342]"
          >
            Back to Dashboard
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-[9px]">Jury<br/>Charge</span>
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
                  {featuredVideo.streamType === 'ScreenSharing' && (
                    <div className="absolute top-2 left-2 bg-[#0078D4] text-white px-2 py-1 rounded text-xs font-medium">
                      {featuredVideo.participant.displayName}'s screen
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

    {/* 🔧 FIX #2: Complete black screen when attorney camera is off */}
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
                  <div className="text-sm font-medium text-gray-800">{p.displayName || "Participant"}</div>
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
            onClick={toggleScreenShare}
            className="flex flex-col items-center gap-1 hover:opacity-70 transition"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isScreenSharing ? "bg-green-100" : "bg-gray-100"
            }`}>
              <svg className={`w-6 h-6 ${isScreenSharing ? "text-green-600" : "text-gray-700"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs text-gray-700">Share screen</span>
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
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
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

      {/* Right Side Panels */}
      {/* Participants Panel */}
      {showParticipantsPanel && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Participants ({allParticipants.length})
            </h3>
            <button onClick={toggleParticipantsPanel} className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {allParticipants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg mb-2">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {participant.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
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
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Chat</h3>
            <button onClick={toggleChatPanel} className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.senderId === currentUserId.current ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${msg.senderId === currentUserId.current ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'} rounded-lg p-3`}>
                  <div className="text-xs font-semibold mb-1">{msg.sender}</div>
                  <div className="text-sm">{msg.content}</div>
                  <div className="text-xs opacity-70 mt-1">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))}
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
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Notification Popup */}
      {showChatNotification && latestMessage && !showChatPanel && (
        <div 
          onClick={toggleChatPanel}
          className="fixed bottom-24 right-6 w-80 bg-white border border-gray-200 rounded-lg shadow-2xl p-4 cursor-pointer hover:shadow-xl transition-shadow animate-slide-up"
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