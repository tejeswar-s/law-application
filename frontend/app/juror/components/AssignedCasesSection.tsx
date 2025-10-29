"use client";

import {
  QuestionMarkCircleIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
  : "http://localhost:4000";

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

type ApprovedCase = {
  ApplicationId: number;
  CaseId: number;
  CaseTitle: string;
  ScheduledDate: string;
  ScheduledTime: string;
  PaymentAmount: number;
  LawFirmName: string;
};

export default function AssignedCasesSection() {
  const [approvedCases, setApprovedCases] = useState<ApprovedCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getCookie("token");
        
        // Fetch juror profile to check approval status
        const profileRes = await fetch(`${API_BASE}/api/juror/profile`, {
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
          },
        });
        const profileData = await profileRes.json();
        if (profileData.success) {
          setIsVerified(profileData.juror?.verified || false);
        }

        // Fetch approved cases only if verified
        if (profileData.juror?.verified) {
          const res = await fetch(`${API_BASE}/api/juror/applications`, {
            headers: {
              "Authorization": token ? `Bearer ${token}` : "",
            },
          });
          const data = await res.json();
          if (data.success) {
            const approved = data.applications.filter((app: any) => app.Status === "approved");
            setApprovedCases(approved);
          }
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="flex-1 min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#0C2D57]"></div>
          <span className="mt-4 text-lg text-[#0C2D57]">Loading...</span>
        </div>
      </main>
    );
  }

  // Show locked state for unverified jurors
  if (!isVerified) {
    return (
      <main className="flex-1 min-h-screen overflow-y-auto p-0 bg-[#FAF9F6]">
        <div className="p-8 md:p-10 w-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#0C2D57] leading-tight">
                Assigned Cases
              </h1>
              <p className="mt-2 text-sm text-gray-600">Cases you've been approved for</p>
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
                Your account is pending verification by an administrator. You will be able to access the Assigned Cases section once your account is verified.
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

  return (
    <main className="flex-1 min-h-screen overflow-y-auto p-0">
      <div className="p-8 md:p-10 bg-[#FAF9F6] min-h-screen w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0C2D57] leading-tight">
              Assigned Cases
            </h1>
            <p className="mt-2 text-sm text-gray-600">Cases you've been approved for</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <button className="flex items-center gap-2 px-3 py-1 rounded hover:bg-white/60">
              <QuestionMarkCircleIcon className="w-5 h-5 text-gray-600" />
              <span>Help</span>
            </button>
          </div>
        </div>

        {/* Approved Cases */}
        <section>
          {approvedCases.length === 0 ? (
            <div className="text-center text-gray-500 py-12 bg-white rounded-lg shadow-sm">
              <p className="mb-4">You do not have any approved cases yet.</p>
              <button 
                className="px-4 py-2 bg-[#0C2D57] text-white rounded-md hover:bg-[#0a2347]"
                onClick={() => router.push("/juror")}
              >
                Browse Available Cases
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedCases.map((caseItem) => (
                <div key={caseItem.ApplicationId} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-[#0C2D57] mb-2">{caseItem.CaseTitle}</h3>
                    <p className="text-sm text-gray-600">{caseItem.LawFirmName}</p>
                  </div>
                  
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trial Date:</span>
                      <span className="font-medium text-gray-800">
                        {new Date(caseItem.ScheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium text-gray-800">{caseItem.ScheduledTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Compensation:</span>
                      <span className="font-semibold text-green-600">${caseItem.PaymentAmount}</span>
                    </div>
                  </div>

                  <button
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#0C2D57] text-white rounded-md hover:bg-[#0a2347] transition"
                    onClick={() => router.push(`/juror/war-room/${caseItem.CaseId}`)}
                  >
                    <span>Access War Room</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}