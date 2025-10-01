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
};

export default function HomeSection({ sidebarCollapsed }: { sidebarCollapsed: boolean }) {
  const [juror, setJuror] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const [introVideoCompleted, setIntroVideoCompleted] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
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
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/all-cases`);
        const data = await res.json();
        const cases = Array.isArray(data) ? data : (Array.isArray(data.recordset) ? data.recordset : []);
        setJobs(cases.slice(0, 4).map((c: any) => ({
          name: getCaseName(c.PlaintiffGroups, c.DefendantGroups),
          trialDate: c.ScheduledDate ? new Date(c.ScheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
          trialTime: c.ScheduledTime,
          price: c.JurorPay || c.jurorPay || c.PaymentAmount || 0,
          id: c.Id,
        })));
      } catch (err) {
        // handle error
      }
    };
    fetchJobs();
  }, []);

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

  const isFullyQualified = introVideoCompleted && quizCompleted;
  const pendingCount = applications.filter(app => app.Status === "pending").length;
  const approvedCount = applications.filter(app => app.Status === "approved").length;

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

        {/* My Applications */}
        {applications.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-[#0C2D57]">My Applications</h2>
                <p className="text-sm text-gray-600">
                  {approvedCount} approved, {pendingCount} pending review
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 font-semibold text-[#0C2D57] text-sm">Case</th>
                    <th className="py-3 px-4 font-semibold text-[#0C2D57] text-sm">Trial Date</th>
                    <th className="py-3 px-4 font-semibold text-[#0C2D57] text-sm">Compensation</th>
                    <th className="py-3 px-4 font-semibold text-[#0C2D57] text-sm">Status</th>
                    <th className="py-3 px-4 font-semibold text-[#0C2D57] text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.ApplicationId} className="border-t">
                      <td className="py-3 px-4 text-[#0C2D57]">{app.CaseTitle}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(app.ScheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="py-3 px-4 text-green-600 font-semibold">${app.PaymentAmount}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded text-xs font-semibold ${
                          app.Status === "approved" ? "bg-green-100 text-green-700" :
                          app.Status === "rejected" ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {app.Status.charAt(0).toUpperCase() + app.Status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {app.Status === "approved" && (
                          <button
                            className="text-[#0C2D57] underline text-sm font-medium"
                            onClick={() => router.push(`/juror/war-room/${app.CaseId}`)}
                          >
                            View War Room
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* My Tasks (only if not fully qualified) */}
        {!isFullyQualified && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-[#0C2D57]">My Tasks</h2>
                <p className="text-sm text-gray-600">Before you get started complete these modules</p>
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

        {/* Job Board Preview */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-[#0C2D57]">Job Board Preview</h2>
            <p className="text-sm text-gray-600">
              {isFullyQualified 
                ? "Apply to available trial postings" 
                : "Complete onboarding to access full job board"}
            </p>
          </div>
          {jobs.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              No cases are currently available.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {jobs.map((job, idx) => (
                <div key={job.id} className="border rounded-md bg-white shadow-sm p-4 flex flex-col justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-md bg-gray-100 flex items-center justify-center text-gray-400">
                      <TruckIcon className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm text-[#0C2D57]">{job.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">Trial Date: {job.trialDate}</p>
                      <p className="text-xs text-gray-500">Time: {job.trialTime}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      className="flex items-center justify-center gap-1 w-1/2 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      title="Apply"
                      disabled={!isFullyQualified}
                      onClick={() => router.push(`/juror/apply/${job.id}`)}
                    >
                      <ArrowUpRightIcon className="w-4 h-4 text-gray-600" />
                      Apply
                    </button>
                    <div className="flex items-center justify-center gap-1 w-1/2 text-green-600 font-semibold">
                      <BanknotesIcon className="w-5 h-5" />
                      <span>${job.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}