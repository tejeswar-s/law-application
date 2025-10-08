"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CallClient,
  VideoStreamRenderer,
  LocalVideoStream,
} from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";

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
  const [featuredParticipant, setFeaturedParticipant] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [displayName, setDisplayName] = useState("You");
  const [renderTrigger, setRenderTrigger] = useState(0);

  const featuredVideoRef = useRef<HTMLDivElement>(null);
  const localThumbnailRef = useRef<HTMLDivElement>(null);
  const localVideoStream = useRef<any>(null);
  const localRenderer = useRef<any>(null);
  const localThumbnailRenderer = useRef<any>(null);
  const remoteVideoRefs = useRef<Map<string, any>>(new Map());
  const hasInitialized = useRef(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function renderLocalVideo() {
    if (!localVideoStream.current) return;

    try {
      if (featuredParticipant === "local" && featuredVideoRef.current) {
        if (localRenderer.current) localRenderer.current.dispose();
        localRenderer.current = new VideoStreamRenderer(localVideoStream.current);
        const view = await localRenderer.current.createView();
        featuredVideoRef.current.innerHTML = "";
        featuredVideoRef.current.appendChild(view.target);
      }

      if (localThumbnailRef.current) {
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

  useEffect(() => {
    renderLocalVideo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredParticipant, renderTrigger]);

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

      roomCall.on("stateChanged", async () => {
        setCallState(roomCall.state);
        if (roomCall.state === "Connected") {
          await renderLocalVideo();
          setIsMuted(roomCall.isMuted);
        }
      });

      roomCall.on("isMutedChanged", () => {
        setIsMuted(roomCall.isMuted);
      });

      roomCall.on("remoteParticipantsUpdated", async (e: any) => {
        for (const participant of e.added) {
          participant.on("videoStreamsUpdated", async (ev: any) => {
            const userId = participant.identifier.communicationUserId;

            for (const stream of ev.removed) {
              const streamKey = stream.mediaStreamType === 'ScreenSharing' 
                ? `${userId}-screen`
                : userId;
              
              const ref = remoteVideoRefs.current.get(streamKey);
              if (ref && ref.renderer) {
                ref.renderer.dispose();
              }
              
              remoteVideoRefs.current.set(streamKey, {
                renderer: null,
                view: null,
                participant,
                streamType: stream.mediaStreamType,
                videoOff: true
              });
              
              setRenderTrigger(prev => prev + 1);
            }

            for (const stream of ev.added) {
              if (stream.isAvailable) {
                try {
                  const renderer = new VideoStreamRenderer(stream);
                  const view = await renderer.createView();

                  const streamKey = stream.mediaStreamType === 'ScreenSharing' 
                    ? `${userId}-screen`
                    : userId;

                  remoteVideoRefs.current.set(streamKey, {
                    renderer,
                    view,
                    participant,
                    streamType: stream.mediaStreamType,
                    videoOff: false
                  });

                  setRenderTrigger(prev => prev + 1);

                  if (stream.mediaStreamType === 'ScreenSharing') {
                    setFeaturedParticipant(streamKey);
                  } else if (!featuredParticipant && roomCall.remoteParticipants.length === 1) {
                    setFeaturedParticipant(userId);
                  }
                } catch (err) {
                  console.error("Remote video error:", err);
                }
              }
            }
            
            setParticipants([...roomCall.remoteParticipants]);
          });

          for (const stream of participant.videoStreams) {
            if (stream.isAvailable) {
              try {
                const renderer = new VideoStreamRenderer(stream);
                const view = await renderer.createView();
                const userId = participant.identifier.communicationUserId;
                
                const streamKey = stream.mediaStreamType === 'ScreenSharing' 
                  ? `${userId}-screen`
                  : userId;
                
                remoteVideoRefs.current.set(streamKey, {
                  renderer,
                  view,
                  participant,
                  streamType: stream.mediaStreamType,
                  videoOff: false
                });
                
                setRenderTrigger(prev => prev + 1);
                
                if (stream.mediaStreamType === 'ScreenSharing') {
                  setFeaturedParticipant(streamKey);
                }
              } catch (err) {
                console.error("Remote video error:", err);
              }
            }
          }
        }

        for (const participant of e.removed) {
          const userId = participant.identifier.communicationUserId;
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
            setFeaturedParticipant(null);
          }
        }

        setParticipants([...roomCall.remoteParticipants]);
      });

      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to join trial");
      setLoading(false);
    }
  }

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
        await call.stopScreenSharing();
        setIsScreenSharing(false);
        if (participants.length > 0) {
          setFeaturedParticipant(participants[0].identifier.communicationUserId);
        } else {
          setFeaturedParticipant("local");
        }
      } else {
        try {
          await call.startScreenSharing();
          setIsScreenSharing(true);
          
          setTimeout(() => {
            const screenShareStreams = call.localVideoStreams.filter(
              (stream: any) => stream.mediaStreamType === 'ScreenSharing'
            );
            
            if (screenShareStreams.length > 0) {
              console.log("Screen share started successfully");
            }
          }, 1000);
          
        } catch (permError) {
          console.error("Screen share permission error:", permError);
          setIsScreenSharing(false);
          alert("Screen sharing failed. Please ensure:\n1. You grant screen sharing permission\n2. You're not selecting a tab that's already in the call\n3. Your browser supports screen sharing");
        }
      }
    } catch (err: any) {
      console.error("Screen share error:", err);
      setIsScreenSharing(false);
      alert("Screen sharing failed. Try sharing an application window instead of entire screen.");
    }
  };

  const leaveCall = async () => {
    if (call) await call.hangUp();
    router.push("/attorney");
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
        {/* Featured Video with Border (reduced height to fit single view) */}
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
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                      <div className="w-32 h-32 bg-gray-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-4xl font-bold">
                          {featuredVideo.participant.displayName?.charAt(0)?.toUpperCase() || "P"}
                        </span>
                      </div>
                    </div>
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
                      >
                        {/* Centered smaller local view container */}
                        <div className="w-[40%] max-w-[480px] aspect-video rounded-xl overflow-hidden shadow-lg border-2 border-gray-700">
                          <div className="[&_video]:object-cover [&_video]:rounded-xl w-full h-full" />
                        </div>
                      </div>

                      {isVideoOff && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                          <div className="w-24 h-24 bg-gray-500 rounded-full flex items-center justify-center shadow-md">
                            <span className="text-white text-2xl font-bold">You</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Participant Thumbnails - shortened height to fit */}
        <div className="flex gap-4 justify-center h-[14vh] items-center overflow-x-auto">
          <button
            onClick={() => setFeaturedParticipant("local")}
            className={`flex-shrink-0 text-center ${
              featuredParticipant === "local" ? "opacity-100" : "opacity-70 hover:opacity-100"
            }`}
          >
            <div className="w-28 h-20 bg-black rounded-lg overflow-hidden mb-2 relative">
              <div ref={localThumbnailRef} className="w-full h-full [&_video]:object-cover" />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                  <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">You</span>
                  </div>
                </div>
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
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                        <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {p.displayName?.charAt(0)?.toUpperCase() || "P"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-sm font-medium text-gray-800">{p.displayName || "Participant"}</div>
                </button>
              );
            })}
        </div>

        {/* Control Bar - reduced height */}
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

          <button className="flex flex-col items-center gap-1 hover:opacity-70 transition">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-xs text-gray-700">Participants</span>
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
    </div>
  );
}
