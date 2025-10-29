"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Lock, Clock, AlertCircle, Calendar, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
  : "http://localhost:4000";

type AttorneyUser = {
  attorneyId: number;
  firstName: string;
  lastName: string;
  email: string;
  isVerified: boolean;
  verificationStatus: string;
};

type Case = {
  Id: number;
  PlaintiffGroups: string;
  DefendantGroups: string;
  ScheduledDate: string;
  ScheduledTime: string;
  attorneyEmail: string;
  AttorneyStatus: string;
  AdminApprovalStatus: string;
};

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

function formatDate(dateString: string) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } catch {
    return dateString;
  }
}

function formatTime(timeString: string) {
  try {
    // timeString is like "14:30:00"
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch {
    return timeString;
  }
}

function getTimeWarning(scheduledDate: string, scheduledTime: string) {
  try {
    const trialDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();
    const diffInMs = trialDateTime.getTime() - now.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    
    if (diffInMinutes > 0 && diffInMinutes < 60) {
      return `Starts in ${diffInMinutes} min`;
    } else if (diffInMinutes < 0) {
      return "In Progress";
    }
    return null;
  } catch {
    return null;
  }
}

interface AttorneyCasesSectionProps {
  onBack: () => void;
}

export default function AttorneyCasesSection({ onBack }: AttorneyCasesSectionProps) {
  const [user, setUser] = useState<AttorneyUser | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const CASES_PER_PAGE = 6;
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("attorneyUser");
      if (stored) {
        try {
          const parsedUser = JSON.parse(stored);
          setUser(parsedUser);
        } catch (error) {
          console.error("Failed to parse attorney user:", error);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (user && user.isVerified) {
      fetchCases();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchCases = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = getCookie("token");
      const res = await fetch(`${API_BASE}/api/cases?userId=${encodeURIComponent(user.email)}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setCases(data);
      } else {
        console.error("Expected array, got:", data);
        setCases([]);
      }
    } catch (err) {
      console.error("Failed to fetch cases:", err);
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewCase = () => {
    router.push("/attorney/state/case-type");
  };

  const handleCaseClick = (caseId: number) => {
    router.push(`/attorney/cases/${caseId}`);
  };

  const handleWarRoomClick = (e: React.MouseEvent, caseId: number) => {
    e.stopPropagation();
    router.push(`/attorney/cases/${caseId}/war-room`);
  };

  const getStatusInfo = (c: Case) => {
    if (c.AdminApprovalStatus === "pending") {
      return {
        label: "Pending Approval",
        color: "bg-yellow-100 text-yellow-700 border-yellow-300",
        icon: <Clock className="w-3 h-3" />
      };
    }
    if (c.AdminApprovalStatus === "rejected") {
      return {
        label: "Rejected",
        color: "bg-red-100 text-red-700 border-red-300",
        icon: <AlertCircle className="w-3 h-3" />
      };
    }
    if (c.AttorneyStatus === "join_trial") {
      return {
        label: "Ready for Trial",
        color: "bg-green-100 text-green-700 border-green-300",
        icon: <ChevronRight className="w-3 h-3" />
      };
    }
    if (c.AttorneyStatus === "view_details") {
      return {
        label: "Completed",
        color: "bg-purple-100 text-purple-700 border-purple-300",
        icon: <ChevronRight className="w-3 h-3" />
      };
    }
    if (c.AttorneyStatus === "war_room") {
      return {
        label: "Open for Applications",
        color: "bg-blue-100 text-blue-700 border-blue-300",
        icon: <ChevronRight className="w-3 h-3" />
      };
    }
    return null;
  };

  const renderCaseButton = (c: Case) => {
    // Case is pending admin approval
    if (c.AdminApprovalStatus === "pending") {
      return (
        <button
          disabled
          className="w-full px-4 py-2.5 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold cursor-not-allowed border border-gray-300"
        >
          <Clock className="h-4 w-4" />
          Awaiting Admin Review
        </button>
      );
    }

    // Case is rejected by admin
    if (c.AdminApprovalStatus === "rejected") {
      return (
        <button
          disabled
          className="w-full px-4 py-2.5 bg-red-50 text-red-600 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold cursor-not-allowed border border-red-200"
        >
          <AlertCircle className="h-4 w-4" />
          Case Rejected
        </button>
      );
    }

    // Case is approved and in different attorney statuses
    if (c.AdminApprovalStatus === "approved") {
      // Ready for trial
      if (c.AttorneyStatus === "join_trial") {
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/attorney/cases/${c.Id}/trial`);
            }}
            className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm hover:shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Join Trial
          </button>
        );
      }

      // Trial completed - view details
      if (c.AttorneyStatus === "view_details") {
        return (
          <button
            onClick={(e) => handleWarRoomClick(e, c.Id)}
            className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-semibold hover:bg-purple-700 transition-colors shadow-sm hover:shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            View Details
          </button>
        );
      }

      // In war room - default state after approval
      return (
        <button
          onClick={(e) => handleWarRoomClick(e, c.Id)}
          className="w-full px-4 py-2.5 bg-[#16305B] text-white rounded-lg flex items-center justify-center gap-2 text-sm font-semibold hover:bg-[#1e417a] transition-colors shadow-sm hover:shadow-md"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
          War Room
        </button>
      );
    }

    // Fallback - should never reach here
    return null;
  };

  const paginatedCases = cases.slice((page - 1) * CASES_PER_PAGE, page * CASES_PER_PAGE);
  const totalPages = Math.ceil(cases.length / CASES_PER_PAGE);

  // Show locked state for unverified attorneys
  if (!user?.isVerified) {
    return (
      <main className="flex-1 px-10 py-8 bg-[#F7F6F3] transition-all duration-300 ease-in-out">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#16305B] hover:text-[#1e417a] transition-colors"
            aria-label="Go back to home"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-[#16305B]">Cases</h1>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="bg-white rounded-lg shadow-lg p-12 max-w-md text-center">
            <div className="mb-6">
              <Lock className="mx-auto h-16 w-16 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Restricted</h2>
            <p className="text-gray-600 mb-4">
              Your account is pending verification by an administrator. You will be able to access the Cases section once your account is approved.
            </p>
            <p className="text-sm text-gray-500">
              This usually takes 24-48 hours. You'll receive a notification once your account is verified.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-10 py-8 bg-[#F7F6F3] transition-all duration-300 ease-in-out">
      {/* Header with Back Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#16305B] hover:text-[#1e417a] transition-colors"
            aria-label="Go back to home"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#16305B]">Your Cases</h1>
            <p className="text-sm text-[#6B7280]">Manage and access your cases quickly</p>
          </div>
        </div>
        <button
          className="bg-[#16305B] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-[#1e417a] transition-colors shadow-sm hover:shadow-md font-semibold"
          onClick={handleNewCase}
        >
          <span className="text-xl">+</span>
          New Case
        </button>
      </div>

      {/* Cases Content */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#16305B]" />
        </div>
      ) : cases.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedCases.map((c) => {
              const statusInfo = getStatusInfo(c);
              const timeWarning = c.AttorneyStatus === "join_trial" 
                ? getTimeWarning(c.ScheduledDate, c.ScheduledTime) 
                : null;
              
              return (
                <div
                  key={c.Id}
                  onClick={() => handleCaseClick(c.Id)}
                  className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-[#16305B] cursor-pointer overflow-hidden group flex flex-col h-full"
                >
                  {/* Card Header */}
                  <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-[#16305B] to-[#1e417a] min-h-[64px]">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-base text-white mb-1 line-clamp-1 max-h-6 overflow-hidden">
                          {getCaseName(c.PlaintiffGroups, c.DefendantGroups)}
                        </h3>
                        <p className="text-xs text-blue-200">Case #{c.Id}</p>
                      </div>
                      {statusInfo && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border ${statusInfo.color} ml-2`}>
                          {statusInfo.icon}
                          <span className="hidden sm:inline">{statusInfo.label}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col">
                    {/* Date and Time */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-[#16305B]" />
                        <span className="font-medium">{formatDate(c.ScheduledDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-[#16305B]" />
                        <span className="font-medium">{formatTime(c.ScheduledTime)}</span>
                      </div>
                    </div>

                    {/* Time Warning for Join Trial */}
                    {timeWarning && (
                      <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-bold text-red-700 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          {timeWarning}
                        </p>
                      </div>
                    )}

                    {/* Action Button anchored to bottom */}
                    <div className="mt-auto">
                      {renderCaseButton(c)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-8 gap-4">
              <button
                className="px-5 py-2.5 rounded-lg bg-white border border-gray-300 text-[#16305B] font-semibold hover:bg-gray-50 hover:border-[#16305B] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="text-[#16305B] font-semibold px-4">
                Page {page} of {totalPages}
              </span>
              <button
                className="px-5 py-2.5 rounded-lg bg-white border border-gray-300 text-[#16305B] font-semibold hover:bg-gray-50 hover:border-[#16305B] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
          <div className="mb-4">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Cases Yet</h3>
          <p className="text-gray-600 mb-6">
            You haven't created any cases yet. Click the button below to file your first case.
          </p>
          <button 
            className="bg-[#16305B] text-white px-6 py-3 rounded-lg hover:bg-[#1e417a] transition-colors font-semibold shadow-sm hover:shadow-md"
            onClick={handleNewCase}
          >
            + Create New Case
          </button>
        </div>
      )}
    </main>
  );
}