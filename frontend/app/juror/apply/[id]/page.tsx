"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
  : "http://localhost:4000";

type CaseDetails = {
  CaseId: number;
  CaseTitle: string;
  CaseDescription: string;
  CaseType: string;
  County: string;
  ScheduledDate: string;
  ScheduledTime: string;
  PaymentAmount: number;
  PlaintiffGroups: string;
  DefendantGroups: string;
  VoirDire1Questions: string;
  LawFirmName: string;
  AttorneyName: string;
};

type VoirDirePart2 = {
  Id: number;
  Question: string;
  Response: string;
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

export default function JurorApplyPage() {
  const { id } = useParams();
  const caseId = id;
  const router = useRouter();
  const [caseData, setCaseData] = useState<CaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [voirDire1Questions, setVoirDire1Questions] = useState<string[]>([]);
  const [voirDire2Questions, setVoirDire2Questions] = useState<VoirDirePart2[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (caseId) {
      fetchCaseDetails();
      fetchVoirDire2();
    }
  }, [caseId]);

  const fetchCaseDetails = async () => {
    try {
      const token = getCookie("token");
      const response = await fetch(`${API_BASE}/api/cases/${caseId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch case details");
      }

      const data = await response.json();
      const caseInfo = data.case || data;
      setCaseData(caseInfo);

      // Parse Part 1 questions from Cases table
      try {
        const vd1 = JSON.parse(caseInfo.VoirDire1Questions || "[]");
        setVoirDire1Questions(Array.isArray(vd1) ? vd1 : []);
      } catch (err) {
        console.error("Error parsing voir dire part 1:", err);
      }
    } catch (error) {
      console.error("Error fetching case:", error);
      setError("Failed to load case details");
    }
  };

  const fetchVoirDire2 = async () => {
    try {
      const token = getCookie("token");
      const response = await fetch(`${API_BASE}/api/cases/${caseId}/voir-dire`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVoirDire2Questions(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching voir dire part 2:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all questions are answered
    const totalQuestions = voirDire1Questions.length + voirDire2Questions.length;
    const answeredQuestions = Object.keys(answers).length;
    
    if (answeredQuestions < totalQuestions) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const token = getCookie("token");
      
      // Format responses for backend
      const voirDireResponses = {
        part1: voirDire1Questions.map((q, i) => ({
          question: q,
          answer: answers[`vd1-${i}`] || ""
        })),
        part2: voirDire2Questions.map((q, i) => ({
          question: q.Question,
          answer: answers[`vd2-${i}`] || ""
        }))
      };

      const response = await fetch(`${API_BASE}/api/juror/applications/apply`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          caseId: caseId,
          voirDireResponses: JSON.stringify(voirDireResponses)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit application");
      }

      alert("Application submitted successfully!");
      router.push("/juror");
    } catch (error: any) {
      console.error("Error submitting application:", error);
      alert(error.message || "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#0C2D57]"></div>
          <span className="mt-4 text-lg text-[#0C2D57]">Loading case details...</span>
        </div>
      </main>
    );
  }

  if (error || !caseData) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error || "Case not found"}</p>
          <button
            onClick={() => router.push("/juror")}
            className="bg-[#0C2D57] text-white px-6 py-2 rounded font-semibold"
          >
            Back to Job Board
          </button>
        </div>
      </main>
    );
  }

  const caseName = getCaseName(caseData.PlaintiffGroups, caseData.DefendantGroups);
  const trialDate = new Date(caseData.ScheduledDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  return (
    <main className="min-h-screen bg-[#FAF9F6] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push("/juror")}
          className="flex items-center text-[#0C2D57] hover:underline mb-6 font-medium"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Job Board
        </button>

        {/* Case Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-[#0C2D57] mb-2">{caseName}</h1>
          <p className="text-gray-600 mb-4">{caseData.LawFirmName}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-700">Trial Date:</span>
              <p className="text-gray-600">{trialDate}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Time:</span>
              <p className="text-gray-600">{caseData.ScheduledTime}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Location:</span>
              <p className="text-gray-600">{caseData.County}, {caseData.CaseType}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Compensation:</span>
              <p className="text-green-600 font-semibold">${caseData.PaymentAmount}</p>
            </div>
          </div>

          {caseData.CaseDescription && (
            <div className="mt-4">
              <span className="font-semibold text-gray-700">Case Description:</span>
              <p className="text-gray-600 mt-1">{caseData.CaseDescription}</p>
            </div>
          )}
        </div>

        {/* Application Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-[#0C2D57] mb-4">Voir Dire Questions</h2>
            <p className="text-sm text-gray-600 mb-6">
              Please answer all questions honestly with Yes or No. Your responses will be reviewed by the attorney.
            </p>

            {/* Part 1 Questions */}
            {voirDire1Questions.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-[#0C2D57] mb-4">Part 1: Standard Qualification Questions</h3>
                <div className="space-y-6">
                  {voirDire1Questions.map((question, index) => (
                    <div key={`vd1-${index}`} className="border-b pb-4">
                      <label className="block text-gray-700 font-medium mb-3">
                        {index + 1}. {question}
                      </label>
                      <div className="flex gap-6">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`vd1-${index}`}
                            value="Yes"
                            checked={answers[`vd1-${index}`] === "Yes"}
                            onChange={(e) => handleAnswerChange(`vd1-${index}`, e.target.value)}
                            required
                            className="w-4 h-4 text-[#0C2D57] border-gray-300 focus:ring-[#0C2D57]"
                          />
                          <span className="ml-2 text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`vd1-${index}`}
                            value="No"
                            checked={answers[`vd1-${index}`] === "No"}
                            onChange={(e) => handleAnswerChange(`vd1-${index}`, e.target.value)}
                            required
                            className="w-4 h-4 text-[#0C2D57] border-gray-300 focus:ring-[#0C2D57]"
                          />
                          <span className="ml-2 text-gray-700">No</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Part 2 Questions */}
            {voirDire2Questions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-[#0C2D57] mb-4">Part 2: Case-Specific Questions</h3>
                <div className="space-y-6">
                  {voirDire2Questions.map((item, index) => (
                    <div key={`vd2-${index}`} className="border-b pb-4">
                      <label className="block text-gray-700 font-medium mb-3">
                        {voirDire1Questions.length + index + 1}. {item.Question}
                      </label>
                      <div className="flex gap-6">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`vd2-${index}`}
                            value="Yes"
                            checked={answers[`vd2-${index}`] === "Yes"}
                            onChange={(e) => handleAnswerChange(`vd2-${index}`, e.target.value)}
                            required
                            className="w-4 h-4 text-[#0C2D57] border-gray-300 focus:ring-[#0C2D57]"
                          />
                          <span className="ml-2 text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name={`vd2-${index}`}
                            value="No"
                            checked={answers[`vd2-${index}`] === "No"}
                            onChange={(e) => handleAnswerChange(`vd2-${index}`, e.target.value)}
                            required
                            className="w-4 h-4 text-[#0C2D57] border-gray-300 focus:ring-[#0C2D57]"
                          />
                          <span className="ml-2 text-gray-700">No</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {voirDire1Questions.length === 0 && voirDire2Questions.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No voir dire questions available for this case.
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push("/juror")}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-[#0C2D57] text-white rounded-lg font-semibold hover:bg-[#0a2347] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}