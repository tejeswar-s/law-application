"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CallClient,
  VideoStreamRenderer,
  LocalVideoStream,
} from "@azure/communication-calling";
import { AzureCommunicationTokenCredential } from "@azure/communication-common";
import { UserIcon, FileText, Download, FileJson } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "")
  : "http://localhost:4000";

type Witness = {
  WitnessId: number;
  WitnessName: string;
  Side: string;
  Description: string;
};

type JuryQuestion = {
  QuestionId: number;
  QuestionText: string;
  QuestionType: string;
  Options: string[];
};

export default function AdminTrialMonitor() {
  const { id } = useParams();
  const router = useRouter();
  const caseId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";

  const [call, setCall] = useState<any>(null);
  const [callState, setCallState] = useState("Initializing...");
  const [participants, setParticipants] = useState<any[]>([]);
  const [featuredParticipant, setFeaturedParticipant] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoOff, setIsVideoOff] = useState(true);
  const [displayName, setDisplayName] = useState("Admin");
  const [renderTrigger, setRenderTrigger] = useState(0);

  // Case data states
  const [witnesses, setWitnesses] = useState<Witness[]>([]);
  const [juryQuestions, setJuryQuestions] = useState<JuryQuestion[]>([]);
  const [activeTab, setActiveTab] = useState<"video" | "witnesses" | "questions">("video");
  const [dataLoading, setDataLoading] = useState(false);

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
    fetchCaseData();
    return () => {
      if (call) {
        call.hangUp().catch((e: any) => console.error("Hangup error:", e));
      }
      if (localRenderer.current) localRenderer.current.dispose();
      if (localThumbnailRenderer.current) localThumbnailRenderer.current.dispose();
      remoteVideoRefs.current.forEach((r) => r.renderer?.dispose());
    };
  }, []);

  const fetchCaseData = async () => {
    setDataLoading(true);
    try {
      const [witnessRes, questionsRes] = await Promise.all([
        fetch(`${API_BASE}/api/cases/${caseId}/witnesses`),
        fetch(`${API_BASE}/api/cases/${caseId}/jury-charge`)
      ]);

      if (witnessRes.ok) {
        const witnessData = await witnessRes.json();
        setWitnesses(witnessData.witnesses || []);
      }

      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        setJuryQuestions(questionsData.questions || []);
      }
    } catch (err) {
      console.error("Error fetching case data:", err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleExportWitnessesText = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/cases/${caseId}/witnesses/export/text`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `witnesses-case-${caseId}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export witnesses");
    }
  };

  const handleExportQuestionsText = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/cases/${caseId}/jury-charge/export/text`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jury-charge-case-${caseId}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export questions");
    }
  };

  const handleExportQuestionsMSForms = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/cases/${caseId}/jury-charge/export/ms-forms`);
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ms-forms-template-case-${caseId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export MS Forms template");
    }
  };

  async function renderLocalVideo() {
    if (!localVideoStream.current || isVideoOff) return;

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
  }, [featuredParticipant, isVideoOff]);

  async function initializeCall() {
    try {
      setCallState("Getting permissions...");

      const response = await fetch(`${API_BASE}/api/trial/admin-join/${caseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
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
          videoOptions: localVideoStream.current && !isVideoOff
            ? { localVideoStreams: [localVideoStream.current] }
            : undefined,
        }
      );

      await roomCall.mute();
      setCall(roomCall);

      roomCall.on("stateChanged", async () => {
        setCallState(roomCall.state);
        if (roomCall.state === "Connected") {
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

  const leaveCall = async () => {
    if (call) await call.hangUp();
    window.close();
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">{callState}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Failed to Join Trial</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button onClick={() => window.close()} className="w-full py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
            Close Window
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
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-purple-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
            <span className="text-gray-900 font-bold">A</span>
          </div>
          <span className="text-white font-semibold">Admin Monitor - Case #{caseId}</span>
          <span className="ml-2 px-2 py-1 bg-purple-600 text-white text-xs font-medium rounded">Observer</span>
        </div>
        <div className="text-white text-sm">
          Status:{" "}
          <span className={callState === "Connected" ? "text-green-400" : "text-yellow-400"}>
            {callState}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-800 px-6 py-2 flex gap-2 flex-shrink-0 border-b border-gray-700">
        <button
          onClick={() => setActiveTab("video")}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === "video"
              ? "bg-gray-900 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          Video Conference
        </button>
        <button
          onClick={() => setActiveTab("witnesses")}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === "witnesses"
              ? "bg-gray-900 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          <UserIcon className="h-4 w-4" />
          Witnesses ({witnesses.length})
        </button>
        <button
          onClick={() => setActiveTab("questions")}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === "questions"
              ? "bg-gray-900 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          <FileText className="h-4 w-4" />
          Jury Charge ({juryQuestions.length})
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Video Tab */}
        {activeTab === "video" && (
          <div className="h-full p-6 flex flex-col">
            <div className="flex-1 flex items-center justify-center bg-black rounded-lg relative overflow-hidden mb-4">
              <div className="w-full h-full max-w-5xl mx-auto relative">
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
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <div className="w-32 h-32 bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-4xl font-bold">
                            {featuredVideo.participant.displayName?.charAt(0)?.toUpperCase() || "P"}
                          </span>
                        </div>
                      </div>
                    )}
                    {featuredVideo.streamType === 'ScreenSharing' && (
                      <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded text-sm">
                        Screen Share
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {featuredParticipant === "local" && !isVideoOff ? (
                      <div
                        ref={featuredVideoRef}
                        className="w-full h-full [&>div]:!w-full [&>div]:!h-full [&_video]:object-contain"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <div className="w-32 h-32 bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-4xl font-bold">A</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div className="absolute bottom-4 left-4 text-white text-lg bg-black bg-opacity-70 px-4 py-2 rounded">
                  {featuredVideo
                    ? (featuredVideo.streamType === 'ScreenSharing' 
                        ? `${featuredVideo.participant.displayName}'s Screen`
                        : featuredVideo.participant.displayName)
                    : displayName}
                </div>
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 flex-shrink-0">
              {featuredParticipant !== "local" && (
                <div
                  className="flex-shrink-0 w-48 h-32 bg-black rounded-lg relative overflow-hidden cursor-pointer border-2 border-transparent hover:border-purple-500"
                  onClick={() => setFeaturedParticipant("local")}
                >
                  {!isVideoOff ? (
                    <div ref={localThumbnailRef} className="w-full h-full [&_video]:object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                      <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xl font-bold">A</span>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 text-white text-xs bg-black bg-opacity-60 px-2 py-1 rounded">
                    {displayName}
                  </div>
                </div>
              )}

              {participants
                .filter((p) => {
                  const userId = p.identifier.communicationUserId;
                  return userId && userId !== featuredParticipant && !featuredParticipant?.includes(`${userId}-screen`);
                })
                .map((p: any) => {
                  const userId = p.identifier.communicationUserId;
                  const videoRef = remoteVideoRefs.current.get(userId);

                  return (
                    <div
                      key={userId}
                      className="flex-shrink-0 w-48 h-32 bg-black rounded-lg relative overflow-hidden cursor-pointer border-2 border-transparent hover:border-purple-500"
                      onClick={() => setFeaturedParticipant(userId)}
                    >
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
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                          <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xl font-bold">
                              {p.displayName?.charAt(0)?.toUpperCase() || "P"}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 text-white text-xs bg-black bg-opacity-60 px-2 py-1 rounded">
                        {p.displayName || "Participant"}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Witnesses Tab */}
        {activeTab === "witnesses" && (
          <div className="h-full overflow-y-auto p-6 bg-gray-800">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <UserIcon className="h-7 w-7 text-purple-400" />
                  Witnesses for Credibility Evaluation
                </h2>
                <button
                  onClick={handleExportWitnessesText}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  disabled={witnesses.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Download as Text
                </button>
              </div>

              {dataLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading witnesses...</p>
                </div>
              ) : witnesses.length === 0 ? (
                <div className="text-center py-12 bg-gray-700 rounded-lg">
                  <UserIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No witnesses added for this case</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {witnesses.map((witness, index) => (
                    <div key={witness.WitnessId} className="bg-gray-700 rounded-lg p-5 border border-gray-600">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-purple-400 font-bold text-lg">#{index + 1}</span>
                            <h3 className="text-xl font-semibold text-white">{witness.WitnessName}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              witness.Side === "Plaintiff" 
                                ? "bg-blue-900 text-blue-200" 
                                : "bg-red-900 text-red-200"
                            }`}>
                              {witness.Side} Witness
                            </span>
                          </div>
                          {witness.Description && (
                            <p className="text-gray-300 text-sm mt-2">{witness.Description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Jury Charge Tab */}
        {activeTab === "questions" && (
          <div className="h-full overflow-y-auto p-6 bg-gray-800">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <FileText className="h-7 w-7 text-purple-400" />
                  Jury Charge / Verdict Questions
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportQuestionsText}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    disabled={juryQuestions.length === 0}
                  >
                    <Download className="h-4 w-4" />
                    Download as Text
                  </button>
                  <button
                    onClick={handleExportQuestionsMSForms}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    disabled={juryQuestions.length === 0}
                  >
                    <FileJson className="h-4 w-4" />
                    Export MS Forms
                  </button>
                </div>
              </div>

              {dataLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading questions...</p>
                </div>
              ) : juryQuestions.length === 0 ? (
                <div className="text-center py-12 bg-gray-700 rounded-lg">
                  <FileText className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No jury charge questions added for this case</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {juryQuestions.map((question, index) => (
                    <div key={question.QuestionId} className="bg-gray-700 rounded-lg p-5 border border-gray-600">
                      <div className="flex items-start gap-3">
                        <span className="text-purple-400 font-bold text-lg flex-shrink-0">Q{index + 1}</span>
                        <div className="flex-1">
                          <p className="text-white text-lg mb-2">{question.QuestionText}</p>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-3 py-1 bg-purple-900 text-purple-200 rounded-full text-sm font-medium">
                              {question.QuestionType}
                            </span>
                          </div>
                          {question.QuestionType === "Multiple Choice" && question.Options && question.Options.length > 0 && (
                            <div className="mt-3 pl-4 border-l-2 border-purple-500">
                              <p className="text-gray-400 text-sm font-medium mb-2">Answer Options:</p>
                              <ul className="space-y-1">
                                {question.Options.map((option, optIndex) => (
                                  <li key={optIndex} className="text-gray-300 text-sm">
                                    {optIndex + 1}. {option}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {question.QuestionType === "Yes/No" && (
                            <div className="mt-3 pl-4 border-l-2 border-purple-500">
                              <p className="text-gray-400 text-sm font-medium mb-2">Answer Options:</p>
                              <ul className="space-y-1">
                                <li className="text-gray-300 text-sm">1. Yes</li>
                                <li className="text-gray-300 text-sm">2. No</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls Footer */}
      <div className="bg-purple-800 px-6 py-4 flex items-center justify-center gap-4 flex-shrink-0">
        <button
          onClick={toggleMute}
          className={`px-6 py-3 rounded-lg ${
            isMuted ? "bg-red-600" : "bg-purple-700"
          } text-white hover:opacity-80`}
        >
          {isMuted ? "Unmute" : "Mute"}
        </button>
        <button
          onClick={toggleVideo}
          className={`px-6 py-3 rounded-lg ${
            isVideoOff ? "bg-red-600" : "bg-purple-700"
          } text-white hover:opacity-80`}
        >
          {isVideoOff ? "Start Video" : "Stop Video"}
        </button>
        <button
          onClick={leaveCall}
          className="px-8 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
        >
          Leave Monitoring
        </button>
      </div>
    </div>
  );
}