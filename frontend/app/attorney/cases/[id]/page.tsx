"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

// Properly construct API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')}/api`
  : "http://localhost:4000/api";

type CaseDetails = {
  CaseId: number;
  CaseTitle: string;
  CaseType: string;
  CaseTier: string;
  County: string;
  CaseDescription: string;
  ScheduledDate: string;
  ScheduledTime: string;
  PaymentMethod: string;
  PaymentAmount: string;
  PlaintiffGroups: string;
  DefendantGroups: string;
  VoirDire1Questions: string;
  VoirDire2Questions: string;
  AttorneyStatus: string;
  AdminApprovalStatus: string;
  CreatedAt: string;
};

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

export default function CaseDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const caseId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";

  const [caseData, setCaseData] = useState<CaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (caseId) {
      const token = getCookie("token");
      
      console.log("Fetching case:", caseId);
      console.log("Token found:", token ? "Yes" : "No");
      console.log("Full API URL:", `${API_BASE}/cases/${caseId}`);
      
      if (!token) {
        setError("No authentication token found. Please log in again.");
        setLoading(false);
        return;
      }

      fetch(`${API_BASE}/cases/${caseId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })
        .then(res => {
          console.log("Response status:", res.status);
          if (!res.ok) {
            return res.json().then(err => {
              throw new Error(err.message || "Failed to fetch case details");
            });
          }
          return res.json();
        })
        .then(data => {
          console.log("Case data received:", data);
          setCaseData(data.case || data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching case:", err);
          setError(err.message);
          setLoading(false);
        });
    }
  }, [caseId]);

  const parseJsonSafely = (str: string) => {
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending_admin_approval: "bg-yellow-100 text-yellow-800",
      war_room: "bg-blue-100 text-blue-800",
      join_trial: "bg-green-100 text-green-800",
      view_details: "bg-purple-100 text-purple-800",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[status] || "bg-gray-100 text-gray-800"}`}>
        {status.replace(/_/g, " ").toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#16305B] mx-auto"></div>
          <span className="mt-4 block text-lg text-[#16305B]">Loading case details...</span>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Case</h2>
          <p className="text-gray-600 mb-4">{error || "Case not found"}</p>
          <button
            onClick={() => router.push("/attorney")}
            className="bg-[#16305B] text-white px-6 py-2 rounded font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const plaintiffGroups = parseJsonSafely(caseData.PlaintiffGroups);
  const defendantGroups = parseJsonSafely(caseData.DefendantGroups);
  const voirDire1 = parseJsonSafely(caseData.VoirDire1Questions);
  const voirDire2 = parseJsonSafely(caseData.VoirDire2Questions);

  // Debug logging for voir dire questions
  console.log("VoirDire1 raw:", caseData.VoirDire1Questions);
  console.log("VoirDire1 parsed:", voirDire1);
  console.log("VoirDire2 raw:", caseData.VoirDire2Questions);
  console.log("VoirDire2 parsed:", voirDire2);

  return (
    <div className="min-h-screen bg-[#F7F6F3]">
      <div className="flex-1 px-10 py-8">
        {/* Back to Dashboard Button */}
        <button
          onClick={() => router.push('/attorney')}
          className="mb-6 flex items-center gap-2 text-[#16305B] hover:text-[#1e417a] transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              className="text-[#16305B] underline text-sm font-medium mb-4"
              onClick={() => router.push("/attorney")}
            >
              &lt; Back to Cases
            </button>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-[#16305B] mb-2">
                  {caseData.CaseTitle}
                </h1>
                <p className="text-gray-600">Case #{caseData.CaseId}</p>
              </div>
              <div className="flex flex-col gap-2">
                {getStatusBadge(caseData.AttorneyStatus)}
                <button
                  onClick={() => router.push(`/attorney/cases/${caseId}/war-room`)}
                  className="bg-[#16305B] text-white px-6 py-2 rounded font-semibold hover:bg-[#1e417a]"
                >
                  Enter Case Room
                </button>
              </div>
            </div>
          </div>

          {/* Case Information Sections */}
          <div className="space-y-6">
            {/* Basic Information */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-[#16305B] mb-4">Basic Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Case Type</label>
                  <p className="text-[#363636] mt-1 uppercase font-bold">{caseData.CaseType}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Case Tier</label>
                  <p className="text-[#363636] mt-1">{caseData.CaseTier}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">County</label>
                  <p className="text-[#363636] mt-1">{caseData.County}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Created</label>
                  <p className="text-[#363636] mt-1">
                    {new Date(caseData.CreatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <label className="text-sm font-semibold text-gray-600">Description</label>
                <p className="text-[#363636] mt-1">{caseData.CaseDescription}</p>
              </div>
            </section>

            {/* Scheduling Information */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-[#16305B] mb-4">Trial Schedule</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Scheduled Date</label>
                  <p className="text-[#363636] mt-1">
                    {new Date(caseData.ScheduledDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Scheduled Time</label>
                  <p className="text-[#363636] mt-1">{caseData.ScheduledTime}</p>
                </div>
              </div>
            </section>

            {/* Payment Information */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-[#16305B] mb-4">Payment Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Payment Method</label>
                  <p className="text-[#363636] mt-1">{caseData.PaymentMethod}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Payment Amount</label>
                  <p className="text-[#363636] mt-1">${caseData.PaymentAmount}</p>
                </div>
              </div>
            </section>

            {/* Plaintiff Groups */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-[#16305B] mb-4">Plaintiff Details</h2>
              {plaintiffGroups.map((group: any, idx: number) => (
                <div key={idx} className="mb-4 pb-4 border-b last:border-b-0">
                  <h3 className="font-semibold text-[#16305B] mb-2">Group {idx + 1}</h3>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Representatives:</p>
                    {group.reps?.map((rep: any, i: number) => (
                      <p key={i} className="text-[#363636] ml-2">
                        {rep.name} ({rep.email})
                      </p>
                    ))}
                    <p className="text-sm font-semibold text-gray-600 mt-2 mb-1">Plaintiffs:</p>
                    {group.plaintiffs?.map((p: any, i: number) => (
                      <p key={i} className="text-[#363636] ml-2">{p.name}</p>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            {/* Defendant Groups */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-[#16305B] mb-4">Defendant Details</h2>
              {defendantGroups.map((group: any, idx: number) => (
                <div key={idx} className="mb-4 pb-4 border-b last:border-b-0">
                  <h3 className="font-semibold text-[#16305B] mb-2">Group {idx + 1}</h3>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Representatives:</p>
                    {group.reps?.map((rep: any, i: number) => (
                      <p key={i} className="text-[#363636] ml-2">
                        {rep.name} ({rep.email})
                      </p>
                    ))}
                    <p className="text-sm font-semibold text-gray-600 mt-2 mb-1">Defendants:</p>
                    {group.defendants?.map((d: any, i: number) => (
                      <p key={i} className="text-[#363636] ml-2">{d.name}</p>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            {/* Voir Dire Questions */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-[#16305B] mb-4">Voir Dire Questions</h2>
              <div className="mb-4">
                <h3 className="font-semibold text-[#16305B] mb-2">Standard Questions</h3>
                {voirDire1 && voirDire1.length > 0 ? (
                  <ul className="list-disc ml-6 space-y-1 text-[#363636]">
                    {voirDire1.map((q: string, i: number) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic ml-2">No standard questions available</p>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-[#16305B] mb-2">Custom Questions</h3>
                {voirDire2 && voirDire2.length > 0 ? (
                  <ul className="list-disc ml-6 space-y-1 text-[#363636]">
                    {voirDire2.map((q: string, i: number) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 italic ml-2">No custom questions added</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}