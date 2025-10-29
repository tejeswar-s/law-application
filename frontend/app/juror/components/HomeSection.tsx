"use client";

import Image from "next/image";
import {
  QuestionMarkCircleIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/24/outline";
import {
  BanknotesIcon,
  TruckIcon,
} from "@heroicons/react/24/solid";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import VideoIntroOverlay from "./VideoIntroOverlay";
import JurorQuizOverlay from "./JurorQuizOverlay";

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
  : "http://localhost:4000";

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

function getCaseName(plaintiffGroups: string, defendantGroups: string) {
  try {
    const plaintiffs = JSON.parse(plaintiffGroups);
    const defendants = JSON.parse(defendantGroups);
    const plaintiffName = plaintiffs[0]?.plaintiffs?.[0]?.name || "Plaintiff";
    const defendantName = defendants[0]?.defendants?.[0]?.name || "Defendant";
    return `${plaintiffName} v. ${defendantName}`;
  } catch {
    return "Case";
  }
}

type Application = {
  ApplicationId: number;
  CaseId: number;
  Status: "pending" | "approved" | "rejected";
  AppliedAt: string;
  CaseTitle: string;
  ScheduledDate: string;
  PaymentAmount: number;
  AttorneyStatus?: string; // To track case state: war_room, join_trial, view_details
};

export default function HomeSection({ sidebarCollapsed }: { sidebarCollapsed: boolean }) {
  const [juror, setJuror] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const [introVideoCompleted, setIntroVideoCompleted] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [availableCases, setAvailableCases] = useState<any[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const router = useRouter();

  const fetchJurorProfile = async () => {
    try {
      const token = getCookie("token");
      const res = await fetch(`${API_BASE}/api/juror/profile`, {
        method: "GET",
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
      });
      const data = await res.json();
      if (data.success) {
        setJuror(data.juror);
        setIntroVideoCompleted(!!data.juror.IntroVideoCompleted);
        setQuizCompleted(!!data.juror.JurorQuizCompleted);
        setIsVerified(!!data.juror.verified);
        return data.juror;
      } else {
        setError("Failed to fetch juror details");
      }
    } catch (err) {
      setError("Failed to fetch juror details");
    }
    return null;
  };

  const fetchMyApplications = async () => {
    try {
      const token = getCookie("token");
      const res = await fetch(`${API_BASE}/api/juror/applications`, {
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
      });
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      await fetchJurorProfile();
      await fetchMyApplications();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
  // Fetch available cases if verified and onboarding completed
  const fetchAvailableCases = async () => {
    const assignmentsCompletedLocal = introVideoCompleted && quizCompleted;
    if (!isVerified || !assignmentsCompletedLocal) return;
    
    try {
      const token = getCookie("token");
      const res = await fetch(`${API_BASE}/api/juror/cases/available`, {
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
      });
      const data = await res.json();
      if (data.success) {
        // 🔍 ADD THESE DEBUGGING LOGS 👇
        console.log("=== FRONTEND RECEIVED DATA ===");
        console.log("All cases:", data.cases);
        if (data.cases && data.cases.length > 0) {
          console.log("First case:", data.cases[0]);
          console.log("RequiredJurors:", data.cases[0].RequiredJurors);
          console.log("RequiredJurors type:", typeof data.cases[0].RequiredJurors);
          console.log("ApprovedJurors:", data.cases[0].ApprovedJurors);
          console.log("ApprovedJurors type:", typeof data.cases[0].ApprovedJurors);
          console.log("Calculation test:", data.cases[0].RequiredJurors - data.cases[0].ApprovedJurors);
        }
        
        setAvailableCases(data.cases?.slice(0, 8) || []); // Show first 8 cases
      }
    } catch (err) {
      console.error("Failed to fetch available cases:", err);
    }
  };
  
  fetchAvailableCases();
}, [isVerified, introVideoCompleted, quizCompleted]);

  const handleVideoNext = async () => {
    try {
      const token = getCookie("token");
      await fetch(`${API_BASE}/api/juror/profile/task/intro_video`, {
        method: "POST",
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
      });
      setShowIntroVideo(false);
      setIntroVideoCompleted(true);
      await fetchJurorProfile();
    } catch (error) {
      console.error("Failed to update video completion:", error);
    }
  };

  const handleQuizFinish = async () => {
    try {
      const token = getCookie("token");
      await fetch(`${API_BASE}/api/juror/profile/task/juror_quiz`, {
        method: "POST",
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
      });
      setShowQuiz(false);
      setQuizCompleted(true);
      await fetchJurorProfile();
    } catch (error) {
      console.error("Failed to update quiz completion:", error);
    }
  };

  const tasks = [
    {
      title: "Introduction to Quick Verdicts Video",
      duration: "5 minutes",
      img: "/introduction_video.png",
      key: "intro-video"
    },
    {
      title: "Juror Quiz",
      duration: "3 minutes",
      img: "/juror_quiz.png",
      key: "quiz"
    },
  ];

  const assignmentsCompleted = introVideoCompleted && quizCompleted;

  if (loading) {
    return (
      <main className="flex-1 min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[60vh]">
          <div className="animate-spin rounded-full h-20 w-20 border-t-8 border-b-8 border-[#0C2D57] mb-6" />
          <span className="text-lg text-[#0C2D57] font-semibold">Loading dashboard...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-screen overflow-y-auto p-0 relative">
      <VideoIntroOverlay
        open={showIntroVideo}
        onClose={() => setShowIntroVideo(false)}
        onNext={handleVideoNext}
        sidebarCollapsed={sidebarCollapsed}
      />
      <JurorQuizOverlay
        open={showQuiz}
        onClose={() => setShowQuiz(false)}
        onFinish={handleQuizFinish}
        sidebarCollapsed={sidebarCollapsed}
      />
      <div className="p-8 md:p-10 bg-[#FAF9F6] min-h-screen w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0C2D57] leading-tight">
              {`Welcome, ${juror?.name || "Juror"}!`}
            </h1>
            <p className="mt-2 text-sm text-gray-600">Good to see you — here's what's next</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <button className="flex items-center gap-2 px-3 py-1 rounded hover:bg-white/60">
              <QuestionMarkCircleIcon className="w-5 h-5 text-gray-600" />
              <span>Help</span>
            </button>
          </div>
        </div>

        {/* Approval Status Alert */}
        {!isVerified && (
          <div className="mb-8 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Account Pending Verification</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Your account is currently under review. You will gain full access to Assigned Cases and Job Board once verified by an administrator.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* My Applications - Show if there are any applications regardless of verification */}
        {applications.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-[#0C2D57]">My Applications</h2>
                <p className="text-sm text-gray-600">
                  Track your case applications and their current status
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {applications.map((app) => {
                // Determine application state and styling
                let statusBadge = { text: '', color: '', icon: '' };
                let actionButtons = null;
                
                if (app.Status === "pending") {
                  statusBadge = {
                    text: 'Pending Attorney Approval',
                    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                    icon: '⏳'
                  };
                } else if (app.Status === "rejected") {
                  statusBadge = {
                    text: 'Not Selected',
                    color: 'bg-red-100 text-red-800 border-red-300',
                    icon: '✕'
                  };
                } else if (app.Status === "approved") {
                  // Determine state based on AttorneyStatus
                  if (app.AttorneyStatus === "view_details") {
                    // Trial completed
                    statusBadge = {
                      text: 'Trial Completed',
                      color: 'bg-purple-100 text-purple-800 border-purple-300',
                      icon: '✓'
                    };
                    actionButtons = (
                      <button
                        className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-1.5"
                        onClick={() => router.push(`/juror/war-room/${app.CaseId}`)}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Details
                      </button>
                    );
                  } else if (app.AttorneyStatus === "join_trial") {
                    // Trial is ready to start
                    statusBadge = {
                      text: 'Trial Room - Ready to Join',
                      color: 'bg-green-100 text-green-800 border-green-300',
                      icon: '🎥'
                    };
                    
                    // Check if trial is happening soon
                    const trialDate = new Date(app.ScheduledDate);
                    const now = new Date();
                    const hoursUntilTrial = (trialDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                    const isTrialSoon = hoursUntilTrial <= 24 && hoursUntilTrial >= -2;
                    
                    actionButtons = (
                      <div className="space-y-1.5">
                        <button
                          className={`w-full px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                            isTrialSoon 
                              ? 'bg-green-600 text-white hover:bg-green-700 animate-pulse' 
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                          onClick={() => router.push(`/juror/trial/${app.CaseId}/setup`)}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          {isTrialSoon ? 'Join Now' : 'Join Trial'}
                        </button>
                        <button
                          className="w-full px-3 py-1.5 bg-gray-100 text-[#0C2D57] rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                          onClick={() => router.push(`/juror/war-room/${app.CaseId}`)}
                        >
                          War Room
                        </button>
                      </div>
                    );
                  } else {
                    // War room state (default for approved)
                    statusBadge = {
                      text: 'Approved - War Room Access',
                      color: 'bg-blue-100 text-blue-800 border-blue-300',
                      icon: '📋'
                    };
                    actionButtons = (
                      <button
                        className="w-full px-3 py-2 bg-[#0C2D57] text-white rounded-lg text-xs font-semibold hover:bg-[#0a2347] transition-colors flex items-center justify-center gap-1.5"
                        onClick={() => router.push(`/juror/war-room/${app.CaseId}`)}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        War Room
                      </button>
                    );
                  }
                }
                
                return (
                  <div
                    key={app.ApplicationId}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-[#0C2D57] to-[#1a4d8f] px-4 py-2.5">
                      <h3 className="font-bold text-sm text-white line-clamp-1">
                        {app.CaseTitle}
                      </h3>
                      <p className="text-xs text-blue-200 mt-0.5">App #{app.ApplicationId}</p>
                    </div>
                    
                    {/* Card Body */}
                    <div className="p-4">
                      {/* Status Badge */}
                      <div className="mb-3">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusBadge.color}`}>
                          <span>{statusBadge.icon}</span>
                          <span className="line-clamp-1">{statusBadge.text}</span>
                        </div>
                      </div>
                      
                      {/* Case Details */}
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Trial:
                          </span>
                          <span className="font-semibold text-gray-800 text-xs">
                            {new Date(app.ScheduledDate).toLocaleDateString("en-US", { 
                              month: "short", 
                              day: "numeric"
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Pay:
                          </span>
                          <span className="font-bold text-green-600 text-xs">${app.PaymentAmount}</span>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-gray-100">
                        {actionButtons || (
                          <div className="text-center text-xs text-gray-500 py-1.5">
                            {app.Status === "pending" ? "Awaiting review" : "No actions"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* My Tasks - Show if assignments not completed */}
        {!assignmentsCompleted && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-[#0C2D57]">My Tasks</h2>
                <p className="text-sm text-gray-600">Complete these modules before applying to cases</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {tasks.map((t, i) => (
                <article
                  key={i}
                  className="relative rounded-md bg-white shadow-sm overflow-hidden group"
                >
                  <div className="p-4">
                    <div className="relative w-full h-40 rounded-md overflow-hidden">
                      <Image
                        src={t.img}
                        alt={t.title}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                  </div>
                  <div className="px-4 pb-10">
                    <h3 className="font-medium text-[15px] text-[#0C2D57] leading-snug">
                      {t.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-2">{t.duration}</p>
                  </div>
                  <div className="absolute right-4 bottom-4">
                    {t.key === "intro-video" ? (
                      <button
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors shadow-md text-white text-lg font-bold ${introVideoCompleted ? 'border-[#0C2D57] bg-[#0C2D57]' : 'border-gray-300 bg-white hover:border-[#0C2D57]'}`}
                        aria-label="Start Introduction Video"
                        onClick={() => !introVideoCompleted && setShowIntroVideo(true)}
                        disabled={introVideoCompleted}
                      >
                        <span className="block w-3 h-3 rounded-full bg-white" />
                      </button>
                    ) : t.key === "quiz" ? (
                      <button
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors shadow-md text-white text-lg font-bold ${quizCompleted ? 'border-[#0C2D57] bg-[#0C2D57]' : introVideoCompleted ? 'border-gray-300 bg-white hover:border-[#0C2D57]' : 'border-gray-200 bg-gray-100 cursor-not-allowed'}`}
                        aria-label="Start Juror Quiz"
                        onClick={() => introVideoCompleted && !quizCompleted && setShowQuiz(true)}
                        disabled={!introVideoCompleted || quizCompleted}
                      >
                        <span className="block w-3 h-3 rounded-full bg-white" />
                      </button>
                    ) : (
                      <div className="w-7 h-7 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center" />
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Assigned Cases Preview - Locked if not verified */}
        {!isVerified && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-[#0C2D57]">Assigned Cases</h2>
                <p className="text-sm text-gray-600">Available after account verification</p>
              </div>
            </div>
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="mb-4">
                  <Lock className="mx-auto h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Assigned Cases Locked</h3>
                <p className="text-gray-600">
                  You will be able to view and manage your assigned cases once your account is verified by an administrator.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Job Board Preview - Locked if not verified or assignments not complete */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-[#0C2D57]">Job Board Preview</h2>
            <p className="text-sm text-gray-600">
              {isVerified && assignmentsCompleted
                ? "Apply to available trial postings" 
                : !isVerified 
                  ? "Available after account verification"
                  : "Complete onboarding to access full job board"}
            </p>
          </div>
          
          {!isVerified ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="mb-4">
                  <Lock className="mx-auto h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Job Board Locked</h3>
                <p className="text-gray-600">
                  You will be able to browse and apply for cases once your account is verified by an administrator.
                </p>
              </div>
            </div>
          ) : availableCases.length === 0 ? (
            <div className="text-center text-gray-500 py-12 bg-white rounded-lg shadow-sm">
              <TruckIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">No cases currently available</p>
              <p className="text-sm mt-2">Check back later for new trial postings</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {availableCases.map((caseItem) => {
                const caseName = getCaseName(
                  caseItem.PlaintiffGroups,
                  caseItem.DefendantGroups
                );
                const trialDate = new Date(
                  caseItem.ScheduledDate
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const spotsLeft = caseItem.RequiredJurors - caseItem.ApprovedJurors;

                return (
                  <div
                    key={caseItem.CaseId}
                    className="border rounded-lg bg-white shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
                        <TruckIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-[#0C2D57] line-clamp-2 mb-1">
                          {caseName}
                        </h3>
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">Date:</span> {trialDate}
                        </p>
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">Time:</span> {caseItem.ScheduledTime}
                        </p>
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">Location:</span> {caseItem.County}
                        </p>
                        <p className="text-xs text-green-600 font-semibold mt-1">
                          {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <button
                        onClick={() => router.push(`/juror/apply/${caseItem.CaseId}`)}
                        disabled={!assignmentsCompleted}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#0C2D57] text-white rounded-lg hover:bg-[#0a2347] transition-colors text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowUpRightIcon className="w-3.5 h-3.5" />
                        Apply
                      </button>
                      <div className="flex items-center justify-center gap-1 ml-3 text-green-600 font-bold text-sm">
                        <BanknotesIcon className="w-4 h-4" />
                        <span>${caseItem.PaymentAmount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}