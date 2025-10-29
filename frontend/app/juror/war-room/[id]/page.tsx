"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon, EyeIcon, XMarkIcon } from "@heroicons/react/24/outline";

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
  : "http://localhost:4000";

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

type CaseData = {
  CaseId: number;
  CaseTitle: string;
  CaseDescription: string;
  PlaintiffGroups: string;
  DefendantGroups: string;
  ScheduledDate: string;
  ScheduledTime: string;
  County: string;
  CaseType: string;
};

type Document = {
  Id: number;
  FileName: string;
  Description: string;
  FileUrl: string;
};

type TeamMember = {
  Name: string;
  Role: string;
  Email: string;
};

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

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export default function JurorWarRoomPage() {
  const { id } = useParams();
  const router = useRouter();
  const caseId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";

  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);

  useEffect(() => {
    if (!caseId) return;

    const fetchWarRoomData = async () => {
      try {
        const token = getCookie("token");
        const headers = {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        };

        const caseRes = await fetch(`${API_BASE}/api/cases/${caseId}`, { headers });
        const caseJson = await caseRes.json();
        
        if (!caseRes.ok) {
          throw new Error("Failed to fetch case details");
        }

        setCaseData(caseJson.case || caseJson);

        const docsRes = await fetch(`${API_BASE}/api/cases/${caseId}/documents`, { headers });
        const docsJson = await docsRes.json();
        setDocuments(docsJson || []);

        const teamRes = await fetch(`${API_BASE}/api/cases/${caseId}/team`, { headers });
        const teamJson = await teamRes.json();
        setTeamMembers(teamJson || []);

        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching war room data:", err);
        setError(err.message || "Failed to load war room");
        setLoading(false);
      }
    };

    fetchWarRoomData();
  }, [caseId]);

  const handleViewDocument = (doc: Document) => {
    setViewingDoc(doc);
  };

  const renderDocumentViewer = () => {
    if (!viewingDoc) return null;

    const ext = getFileExtension(viewingDoc.FileName);
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
    const isPdf = ext === 'pdf';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h3 className="text-lg font-semibold text-[#0C2D57]">{viewingDoc.FileName}</h3>
              <p className="text-sm text-gray-600 italic">{viewingDoc.Description}</p>
            </div>
            <button
              onClick={() => setViewingDoc(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {isImage ? (
              <img 
                src={viewingDoc.FileUrl} 
                alt={viewingDoc.FileName}
                className="max-w-full h-auto mx-auto"
                onError={(e) => {
                  e.currentTarget.src = '';
                  e.currentTarget.alt = 'Failed to load image';
                }}
              />
            ) : isPdf ? (
              <iframe
                src={viewingDoc.FileUrl}
                className="w-full h-[70vh] border-0"
                title={viewingDoc.FileName}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Preview not available for this file type (.{ext})</p>
                <p className="text-sm text-gray-500">This file can only be viewed in a separate window</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#0C2D57]"></div>
          <span className="mt-4 text-lg text-[#0C2D57]">Loading war room...</span>
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
            Back to Dashboard
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
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.push("/juror")}
          className="flex items-center text-[#0C2D57] hover:underline mb-6 font-medium"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-[#0C2D57] mb-2">{caseName}</h1>
          <p className="text-gray-600 mb-4">Case #{caseData.CaseId}</p>

          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
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
          </div>

          {caseData.CaseDescription && (
            <div>
              <span className="font-semibold text-gray-700">Case Description:</span>
              <p className="text-gray-600 mt-1">{caseData.CaseDescription}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-[#0C2D57] mb-4">Legal Team</h2>
          {teamMembers.length === 0 ? (
            <p className="text-gray-500">No team members listed</p>
          ) : (
            <div className="space-y-2">
              {teamMembers.map((member, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="font-semibold text-[#0C2D57]">{member.Name}</p>
                    <p className="text-sm text-gray-600">{member.Role}</p>
                  </div>
                  <p className="text-sm text-gray-500">{member.Email}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-[#0C2D57] mb-4">Case Documents</h2>
          <p className="text-sm text-gray-600 mb-4">View-only access to case materials</p>
          {documents.length === 0 ? (
            <p className="text-gray-500">No documents available</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.Id} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100">
                  <div className="flex-1">
                    <p className="font-medium text-[#0C2D57]">{doc.FileName}</p>
                    <p className="text-sm text-gray-600 italic">{doc.Description}</p>
                  </div>
                  <button
                    onClick={() => handleViewDocument(doc)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0C2D57] text-white rounded hover:bg-[#0a2347] transition"
                  >
                    <EyeIcon className="w-5 h-5" />
                    <span>View</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This is a read-only view. You can view documents in your browser, but cannot make any changes to case materials. Please review all materials before the trial date.
          </p>
        </div>
      </div>

      {renderDocumentViewer()}
    </main>
  );
}