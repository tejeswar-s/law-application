"use client";

import Image from "next/image";
import {
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { TruckIcon } from "@heroicons/react/24/solid";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, "")
  : "http://localhost:4000";

type AvailableCase = {
  CaseId: number;
  CaseTitle: string;
  CaseDescription: string;
  CaseType: string;
  CaseTier: string;
  County: string;
  ScheduledDate: string;
  ScheduledTime: string;
  PaymentAmount: number;
  RequiredJurors: number;
  ApprovedJurors: number;
  LawFirmName: string;
  AttorneyName: string;
  PlaintiffGroups: string;
  DefendantGroups: string;
};

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
}

function getCaseName(plaintiffGroups: string, defendantGroups: string) {
  try {
    const plaintiffs = JSON.parse(plaintiffGroups);
    const defendants = JSON.parse(defendantGroups);
    const plaintiffName =
      plaintiffs[0]?.plaintiffs?.[0]?.name || "Plaintiff";
    const defendantName =
      defendants[0]?.defendants?.[0]?.name || "Defendant";
    return `${plaintiffName} v. ${defendantName}`;
  } catch {
    return "Case";
  }
}

export default function JobBoardSection() {
  const router = useRouter();
  const [cases, setCases] = useState<AvailableCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [jurorLocation, setJurorLocation] = useState({
    state: "",
    county: "",
  });
  const [showOnboardingRequired, setShowOnboardingRequired] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    fetchAvailableCases();
  }, []);

  const fetchAvailableCases = async () => {
  setLoading(true);
  try {
    const token = getCookie("token");
    
    // First check approval status
    const profileRes = await fetch(`${API_BASE}/api/juror/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    
    if (profileRes.ok) {
      const profileData = await profileRes.json();
      if (profileData.success) {
        setIsVerified(profileData.juror?.verified || false);
        
        // Only fetch cases if verified
        if (!profileData.juror?.verified) {
          setLoading(false);
          return;
        }
      }
    }

    const response = await fetch(
      `${API_BASE}/api/juror/cases/available`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 403) {
      const errorData = await response.json();
      if (errorData.code === "ONBOARDING_REQUIRED") {
        setShowOnboardingRequired(true);
        return;
      }
    }

    if (!response.ok) {
      throw new Error("Failed to fetch cases");
    }

    const data = await response.json();
    if (data.success) {
      // 🔍 ADD THESE DEBUGGING LOGS 👇
      console.log("=== JOB BOARD - FRONTEND RECEIVED DATA ===");
      console.log("All cases:", data.cases);
      if (data.cases && data.cases.length > 0) {
        console.log("First case:", data.cases[0]);
        console.log("RequiredJurors:", data.cases[0].RequiredJurors);
        console.log("RequiredJurors type:", typeof data.cases[0].RequiredJurors);
        console.log("ApprovedJurors:", data.cases[0].ApprovedJurors);
        console.log("ApprovedJurors type:", typeof data.cases[0].ApprovedJurors);
        console.log("Calculation test:", data.cases[0].RequiredJurors - data.cases[0].ApprovedJurors);
      }
      
      setCases(data.cases || []);
      setJurorLocation(data.jurorLocation || { state: "", county: "" });
    }
  } catch (error) {
    console.error("Error fetching available cases:", error);
  } finally {
    setLoading(false);
  }
};

  const handleApply = (caseId: number) => {
    router.push(`/juror/apply/${caseId}`);
  };

  const handleGoToHome = () => {
    window.location.href = "/juror";
  };

  // Show locked state for unverified jurors
  if (!isVerified && !loading) {
    return (
      <main className="flex-1 min-h-screen overflow-y-auto p-0 bg-[#FAF9F6]">
        <div className="p-8 md:p-10 w-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#0C2D57] leading-tight">
                Job Board
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Apply to available trial postings
              </p>
            </div>
          </div>

          {/* Locked State */}
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="bg-white rounded-lg shadow-lg p-12 max-w-md text-center">
              <div className="mb-6">
                <Lock className="mx-auto h-16 w-16 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Restricted</h2>
              <p className="text-gray-600 mb-4">
                Your account is pending verification by an administrator. You will be able to access the Job Board section once your account is verified.
              </p>
              <p className="text-sm text-gray-500">
                This usually takes 24-48 hours. You'll receive a notification once your account is verified.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // show onboarding required message
  if (showOnboardingRequired) {
    return (
      <main className="flex-1 min-h-screen overflow-y-auto p-0">
        <div className="p-8 md:p-10 bg-[#FAF9F6] min-h-screen w-full flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full border-2 border-yellow-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <ExclamationTriangleIcon className="w-10 h-10 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-[#0C2D57] mb-3">
                Onboarding Required
              </h2>
              <p className="text-gray-600 mb-2">
                To access the Job Board and apply for cases, you must
                first complete the onboarding process.
              </p>
              <p className="text-gray-600 mb-6">
                Please complete the following requirements:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6 w-full text-left">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-[#0C2D57] rounded-full mr-3"></span>
                    Watch the Introduction Video
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-[#0C2D57] rounded-full mr-3"></span>
                    Complete the Juror Qualification Quiz
                  </li>
                </ul>
              </div>
              <button
                onClick={handleGoToHome}
                className="w-full bg-[#0C2D57] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#0a2347] transition-colors"
              >
                Go to Home to Complete Onboarding
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // filter cases
  const filteredCases = cases.filter((caseItem) => {
    const caseName = getCaseName(
      caseItem.PlaintiffGroups,
      caseItem.DefendantGroups
    );
    return (
      caseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.CaseTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // sort cases
  const sortedCases = [...filteredCases].sort((a, b) => {
    if (sortBy === "trialDateAscending") {
      return (
        new Date(a.ScheduledDate).getTime() -
        new Date(b.ScheduledDate).getTime()
      );
    }
    if (sortBy === "trialDateDescending") {
      return (
        new Date(b.ScheduledDate).getTime() -
        new Date(a.ScheduledDate).getTime()
      );
    }
    if (sortBy === "compensationAscending") {
      return a.PaymentAmount - b.PaymentAmount;
    }
    if (sortBy === "compensationDescending") {
      return b.PaymentAmount - a.PaymentAmount;
    }
    return 0;
  });

  return (
    <main className="flex-1 min-h-screen overflow-y-auto p-0">
      <div className="p-8 md:p-10 bg-[#FAF9F6] min-h-screen w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0C2D57] leading-tight">
              Job Board
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Apply to available trial postings
              {jurorLocation.county && (
                <span className="ml-2 text-[#0C2D57] font-medium">
                  • Showing cases for {jurorLocation.county},{" "}
                  {jurorLocation.state}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <button className="flex items-center gap-2 px-3 py-1 rounded hover:bg-white/60">
              <QuestionMarkCircleIcon className="w-5 h-5 text-gray-600" />
              <span>Help</span>
            </button>
          </div>
        </div>

        {/* Search + Sort */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center w-2/3">
            <input
              type="text"
              placeholder="Search cases..."
              className="w-full px-4 py-2 border rounded-md text-sm text-gray-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="bg-[#0C2D57] text-white px-4 py-2 rounded-md ml-2">
              Search
            </button>
          </div>
          <div className="relative inline-block text-left">
            <select
              className="px-4 py-2 border rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0C2D57]"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="">Sort By</option>
              <option value="trialDateAscending">Trial Date (Earliest)</option>
              <option value="trialDateDescending">Trial Date (Latest)</option>
              <option value="compensationAscending">Pay (Low to High)</option>
              <option value="compensationDescending">Pay (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Job Board */}
        <section>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#0C2D57]"></div>
              <span className="ml-4 text-lg text-[#0C2D57]">
                Loading cases...
              </span>
            </div>
          ) : sortedCases.length === 0 ? (
            <div className="text-center text-gray-500 py-12 bg-white rounded-lg shadow-sm">
              <TruckIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">No cases currently available</p>
              <p className="text-sm mt-2">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Check back later for new trial postings"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sortedCases.map((caseItem) => {
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
                const spotsLeft =
                  caseItem.RequiredJurors - caseItem.ApprovedJurors;

                return (
                  <div
                    key={caseItem.CaseId}
                    className="border rounded-md bg-white shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-md bg-gray-100 flex items-center justify-center text-gray-400">
                        <TruckIcon className="w-7 h-7" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm text-[#0C2D57]">
                          {caseName}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-medium">Date:</span>{" "}
                          {trialDate}
                        </p>
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">Time:</span>{" "}
                          {caseItem.ScheduledTime}
                        </p>
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">Location:</span>{" "}
                          {caseItem.County}
                        </p>
                        <p className="text-xs text-green-600 font-medium mt-1">
                          {spotsLeft} spot
                          {spotsLeft !== 1 ? "s" : ""} left
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 flex items-center justify-between">
                      <button
                        onClick={() => handleApply(caseItem.CaseId)}
                        className="flex items-center justify-center gap-1 w-1/2 py-2 bg-[#0C2D57] text-white rounded hover:bg-[#0a2347] transition-colors"
                      >
                        Apply
                      </button>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <span className="font-semibold text-green-700">
                          ${caseItem.PaymentAmount}
                        </span>
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