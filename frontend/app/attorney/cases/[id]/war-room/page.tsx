"use client";
import AttorneySidebar from "@/app/attorney/components/AttorneySidebar";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import WitnessSection from "./components/WitnessSection";
import JuryChargeSection from "./components/JuryChargeSection";
import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon, PlusIcon, DocumentArrowUpIcon } from "@heroicons/react/24/outline";

type TeamMember = { 
  Name: string; 
  Role: string; 
  Email: string;
};

type Document = {
  Id: number;
  FileName: string;
  Description: string;
  FileUrl: string;
};

type FileToUpload = {
  file: File;
  description: string;
  progress: number;
  id: string;
};

type Application = {
  ApplicationId: number;
  JurorId: number;
  JurorName: string;
  JurorEmail: string;
  County: string;
  Status: "pending" | "approved" | "rejected";
  VoirDire1Responses: string;
  VoirDire2Responses: string;
  AppliedAt: string;
};

type CaseData = {
  Id: number;
  PlaintiffGroups: string;
  DefendantGroups: string;
  CaseTier?: string;
  AttorneyStatus?: string;
  CaseTitle?: string;
};

function getFirstName(groups: string, key: "plaintiffs" | "defendants") {
  try {
    const arr = JSON.parse(groups);
    return arr[0]?.[key]?.[0]?.name || "";
  } catch {
    return "";
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
  : "http://localhost:4000";

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

export default function WarRoomPage() {
  const { id } = useParams();
  const router = useRouter();
  const caseId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";

  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMembers, setNewMembers] = useState<TeamMember[]>([{ Name: "", Role: "", Email: "" }]);
  
  // Multiple file upload states
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<FileToUpload[]>([]);
  const [documentation, setDocumentation] = useState<Document[]>([]);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [deletingDocument, setDeletingDocument] = useState(false);

  // Applications state
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showApplicationsDropdown, setShowApplicationsDropdown] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // War room submission state
  const [submittingWarRoom, setSubmittingWarRoom] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch case data
  useEffect(() => {
    if (caseId) {
      const token = getCookie("token");
      fetch(`${API_BASE}/api/cases/${caseId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      })
        .then(res => res.json())
        .then(data => setCaseData(data.case || data))
        .catch(err => console.error("Failed to fetch case:", err));
    }
  }, [caseId]);

  // Fetch war room info
  useEffect(() => {
    if (caseId) {
      const token = getCookie("token");
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };
      
      Promise.all([
        fetch(`${API_BASE}/api/cases/${caseId}/team`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/api/cases/${caseId}/documents`, { headers }).then(r => r.json()),
        fetch(`${API_BASE}/api/attorney/cases/${caseId}/applications`, { headers }).then(r => r.json())
      ]).then(([team, docs, apps]) => {
        setTeamMembers(team || []);
        setDocumentation(docs || []);
        setApplications(apps.applications || []);
      }).catch(err => {
        console.error("Failed to fetch war room data:", err);
      });
    }
  }, [caseId]);

  async function addTeamMembers(caseId: string, members: TeamMember[]) {
    const token = getCookie("token");
    for (const member of members) {
      await fetch(`${API_BASE}/api/cases/${caseId}/team`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: member.Name,
          role: member.Role,
          email: member.Email
        }),
      });
    }
    const res = await fetch(`${API_BASE}/api/cases/${caseId}/team`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    setTeamMembers(data || []);
  }

  async function uploadDocuments() {
    if (filesToUpload.length === 0) return;
    
    setUploadingDocuments(true);
    const token = getCookie("token");

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const fileData = filesToUpload[i];
        const formData = new FormData();
        formData.append("file", fileData.file);
        formData.append("description", fileData.description);

        // Simulate progress (in real app, use XHR with progress events)
        setFilesToUpload(prev => prev.map((f, idx) => 
          idx === i ? { ...f, progress: 50 } : f
        ));

        await fetch(`${API_BASE}/api/cases/${caseId}/documents`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: formData,
        });

        setFilesToUpload(prev => prev.map((f, idx) => 
          idx === i ? { ...f, progress: 100 } : f
        ));
      }

      // Refresh documentation list
      const res = await fetch(`${API_BASE}/api/cases/${caseId}/documents`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setDocumentation(data || []);

      // Close modal and reset
      setShowAddDocument(false);
      setFilesToUpload([]);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload some documents");
    } finally {
      setUploadingDocuments(false);
    }
  }

  async function deleteDocument(caseId: string, docId: number) {
    const token = getCookie("token");
    const res = await fetch(
      `${API_BASE}/api/cases/${caseId}/documents/${docId}`,
      { 
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete document");
    }

    return await res.json();
  }

  async function updateApplicationStatus(applicationId: number, status: "approved" | "rejected") {
    setUpdatingStatus(true);
    try {
      const token = getCookie("token");
      const res = await fetch(`${API_BASE}/api/attorney/applications/${applicationId}/status`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      const appsRes = await fetch(`${API_BASE}/api/attorney/cases/${caseId}/applications`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const appsData = await appsRes.json();
      setApplications(appsData.applications || []);
      
      setShowApplicationModal(false);
      setSelectedApplication(null);
    } catch (error) {
      console.error("Update status error:", error);
      alert("Failed to update application status");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleSubmitWarRoom() {
    setSubmittingWarRoom(true);
    setErrorMessage(null);
    
    try {
      const token = getCookie("token");
      const res = await fetch(`${API_BASE}/api/attorney/cases/${caseId}/submit-war-room`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit war room");
      }

      setShowSuccessMessage(true);
      setTimeout(() => {
        router.push("/attorney");
      }, 2000);
    } catch (error: any) {
      console.error("Submit war room error:", error);
      setErrorMessage(error.message || "Failed to submit war room");
    } finally {
      setSubmittingWarRoom(false);
    }
  }

  const approvedCount = applications.filter(app => app.Status === "approved").length;
  const pendingCount = applications.filter(app => app.Status === "pending").length;
  const canSubmit = approvedCount >= 2 && caseData?.AttorneyStatus === "war_room";

  const handleBackToCases = () => {
    router.push("/attorney");
    // After navigation, the attorney dashboard will show cases section
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('navigate-to-cases'));
      }
    }, 100);
  };

  const getCaseName = () => {
    if (caseData?.CaseTitle) {
      return caseData.CaseTitle;
    }
    const plaintiff = getFirstName(caseData?.PlaintiffGroups || "", "plaintiffs");
    const defendant = getFirstName(caseData?.DefendantGroups || "", "defendants");
    return `${plaintiff} v. ${defendant}`;
  };

  return (
    <div className="flex min-h-screen bg-[#F7F6F3]">
      <AttorneySidebar 
        selectedSection={"cases"} 
        onSectionChange={(section) => {
          if (section === "home") router.push("/attorney");
          if (section === "profile") router.push("/attorney");
          if (section === "cases") router.push("/attorney");
          if (section === "calendar") router.push("/attorney");
          if (section === "notifications") router.push("/attorney");
        }} 
      />
      <div className="flex-1 relative">
        <div className="max-w-4xl mx-auto pt-8 pb-16 px-2">
          {!caseData ? (
            <div className="flex justify-center items-center h-[400px]">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#16305B]"></div>
              <span className="ml-4 text-lg text-[#16305B]">Loading...</span>
            </div>
          ) : (
            <>
              {/* Success Message */}
              {showSuccessMessage && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded flex items-center gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">War Room Submitted!</p>
                    <p className="text-sm text-green-700">All jurors have been notified. Redirecting...</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded flex items-center gap-3">
                  <ExclamationCircleIcon className="w-6 h-6 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-800">Submission Failed</p>
                    <p className="text-sm text-red-700">{errorMessage}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-start mb-2">
                <button
                  className="text-[#16305B] underline text-sm font-medium hover:text-[#1e417a]"
                  onClick={handleBackToCases}
                >
                  &lt; Back to Cases
                </button>
                <div className="flex flex-col items-end">
                  <span className="text-[#363636] font-semibold">
                    War Room Completion Due:{" "}
                    <span className="text-2xl text-[#16305B] font-bold">3 days</span>
                    <span title="Help" className="ml-2 text-[#6B7280] cursor-pointer">ⓘ</span>
                  </span>
                  <button 
                    className={`mt-2 px-4 py-2 rounded font-semibold shadow transition ${
                      canSubmit 
                        ? "bg-[#16305B] text-white hover:bg-[#1e417a]" 
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                    onClick={handleSubmitWarRoom}
                    disabled={!canSubmit || submittingWarRoom}
                  >
                    {submittingWarRoom ? "Submitting..." : "Submit War Room"}
                  </button>
                  {!canSubmit && approvedCount < 2 && (
                    <p className="text-xs text-red-600 mt-1">Need 2 approved jurors ({approvedCount}/2)</p>
                  )}
                </div>
              </div>

              <h1 className="text-2xl font-bold mt-2 mb-1 text-[#363636]">
                {getCaseName()} War Room
              </h1>
              <div className="text-[#363636] font-semibold mb-2">Case # {caseData.Id}</div>

              {/* Team Section */}
              <section className="mb-6">
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <div className="font-bold text-base text-[#363636]">Team</div>
                    <div className="text-sm text-[#6B7280]">Manage your legal team</div>
                  </div>
                  <button
                    className="bg-[#16305B] text-white px-4 py-2 rounded font-semibold shadow hover:bg-[#1e417a]"
                    onClick={() => setShowAddTeam(true)}
                  >
                    <span className="mr-1">+</span> Add Team Member
                  </button>
                </div>
                <div className="flex flex-col gap-1 mb-2 mt-2">
                  {teamMembers.length === 0 ? (
                    <span className="text-[#6B7280]">Add/Invite legal team members to this court case.</span>
                  ) : (
                    teamMembers.map((member, idx) => (
                      <div key={idx} className="flex gap-4 items-center">
                        <a href="#" className="text-[#16305B] underline font-medium">{member.Name}</a>
                        <span className="text-[#6B7280] text-sm">{member.Role}</span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Documentation Section */}
              <section className="mb-6">
                <div className="flex justify-between items-center mb-1">
                  <div className="font-bold text-base text-[#363636]">Documentation</div>
                  <button
                    className="bg-[#16305B] text-white px-4 py-2 rounded font-semibold shadow hover:bg-[#1e417a]"
                    onClick={() => setShowAddDocument(true)}
                  >
                    <span className="mr-1">+</span> Add Document
                  </button>
                </div>
                <div className="text-sm text-[#6B7280] mb-2">
                  Manage your presentations, exhibits, and any documentation you will need to present your case
                </div>
                <table className="w-full bg-white rounded text-left mb-2 border">
                  <thead>
                    <tr>
                      <th className="py-2 px-3 font-semibold text-[#363636] border-b">Document Name</th>
                      <th className="py-2 px-3 font-semibold text-[#363636] border-b">Description</th>
                      <th className="py-2 px-3 font-semibold text-[#363636] border-b">Delete?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentation.length === 0 ? (
                      <tr>
                        <td className="py-2 px-3 text-[#6B7280]" colSpan={3}>
                          Add your War Room documents.
                        </td>
                      </tr>
                    ) : (
                      documentation.map((doc) => (
                        <tr key={doc.Id} className="border-t">
                          <td className="py-2 px-3">
                            <a href={doc.FileUrl || "#"} className="underline text-[#16305B]" target="_blank" rel="noopener noreferrer">
                              {doc.FileName}
                            </a>
                          </td>
                          <td className="py-2 px-3 italic text-[#363636]">{doc.Description}</td>
                          <td className="py-2 px-3">
                            <button
                              title="Delete"
                              className="text-[#363636] hover:text-[#B10000]"
                              onClick={() => {
                                setDeleteDoc(doc);
                                setShowDeleteModal(true);
                              }}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </section>

              {/* Voir Dire Section */}
              <section className="mb-6">
                <div className="font-bold text-base mb-2 text-[#363636]">Voir Dire</div>
                <div className="text-sm text-[#6B7280] mb-2">
                  Manage the Voir Dire questions and review potential Juror Responses ({approvedCount}/2 selected, {pendingCount} pending)
                </div>
                <div className="relative">
                  <div 
                    className="bg-[#F3F4F6] px-4 py-2 rounded font-semibold flex items-center justify-between text-[#363636] border cursor-pointer hover:bg-gray-200"
                    onClick={() => setShowApplicationsDropdown(!showApplicationsDropdown)}
                  >
                    <span>Voir Dire (Disqualifier) - Juror Responses</span>
                    <span className="text-[#6B7280]">⋯</span>
                  </div>

                  {showApplicationsDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded border shadow-lg z-10">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="py-2 px-3 font-semibold text-[#363636] text-sm">Juror Name</th>
                            <th className="py-2 px-3 font-semibold text-[#363636] text-sm">County</th>
                            <th className="py-2 px-3 font-semibold text-[#363636] text-sm">Status</th>
                            <th className="py-2 px-3 font-semibold text-[#363636] text-sm">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {applications.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-4 px-3 text-center text-[#6B7280]">
                                No applications yet
                              </td>
                            </tr>
                          ) : (
                            applications.map((app) => (
                              <tr key={app.ApplicationId} className="border-t">
                                <td className="py-2 px-3 text-[#363636]">{app.JurorName}</td>
                                <td className="py-2 px-3 text-[#363636]">{app.County}</td>
                                <td className="py-2 px-3">
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                    app.Status === "approved" ? "bg-green-100 text-green-700" :
                                    app.Status === "rejected" ? "bg-red-100 text-red-700" :
                                    "bg-yellow-100 text-yellow-700"
                                  }`}>
                                    {app.Status.charAt(0).toUpperCase() + app.Status.slice(1)}
                                  </span>
                                </td>
                                <td className="py-2 px-3">
                                  <button
                                    className="text-[#16305B] underline text-sm font-medium"
                                    onClick={() => {
                                      setSelectedApplication(app);
                                      setShowApplicationModal(true);
                                      setShowApplicationsDropdown(false);
                                    }}
                                  >
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>

               {/* Witness Section */}
              <section className="mb-6">
                <WitnessSection caseId={caseId} />
              </section>

              {/* Jury Charge Section */}
              <section className="mb-6">
                <JuryChargeSection caseId={caseId} />
              </section>
            </>
          )}
        </div>

        {/* FIXED: Modals now positioned relative to viewport */}
        {(showAddTeam || showAddDocument || showDeleteModal || showApplicationModal) && (
          <div 
  className="fixed inset-0 flex items-center justify-center z-50 p-4"
  style={{
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)'
  }}
>
            <div className="max-h-[90vh] overflow-y-auto">
              {/* Application Modal - ENHANCED */}
              {showApplicationModal && selectedApplication && (
                <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 w-full max-w-3xl">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                    <div>
                      <h2 className="text-2xl font-bold text-[#16305B]">Juror Application</h2>
                      <p className="text-sm text-gray-600 mt-1">Review responses and make a decision</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowApplicationModal(false);
                        setSelectedApplication(null);
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                  
                  {/* Juror Info Card */}
                  <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-blue-900 uppercase tracking-wide mb-1">Juror Name</p>
                        <p className="text-base font-bold text-[#16305B]">{selectedApplication.JurorName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-blue-900 uppercase tracking-wide mb-1">Email</p>
                        <p className="text-base font-semibold text-gray-700">{selectedApplication.JurorEmail}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-blue-900 uppercase tracking-wide mb-1">County</p>
                        <p className="text-base font-semibold text-gray-700">{selectedApplication.County}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-blue-900 uppercase tracking-wide mb-1">Application Status</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                          selectedApplication.Status === "approved" ? "bg-green-500 text-white" :
                          selectedApplication.Status === "rejected" ? "bg-red-500 text-white" :
                          "bg-yellow-500 text-white"
                        }`}>
                          {selectedApplication.Status.charAt(0).toUpperCase() + selectedApplication.Status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Voir Dire Responses - Scrollable Area */}
                  <div className="max-h-96 overflow-y-auto mb-6 pr-2">
                    {/* Part 1: Standard Questions */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-[#16305B] text-white rounded-full font-bold text-sm">
                          1
                        </div>
                        <h3 className="text-lg font-bold text-[#16305B]">Standard Voir Dire Questions</h3>
                      </div>
                      <div className="space-y-3">
                        {JSON.parse(selectedApplication.VoirDire1Responses).map((item: any, idx: number) => (
                          <div key={idx} className="p-4 bg-white rounded-lg border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                                {idx + 1}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-800 mb-2 leading-relaxed">
                                  {item.question}
                                </p>
                                <div className="flex items-start gap-2 mt-2">
                                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wide mt-0.5">Answer:</span>
                                  <p className="text-sm text-gray-700 font-medium leading-relaxed flex-1">
                                    {item.answer}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Part 2: Case-Specific Questions */}
                    {JSON.parse(selectedApplication.VoirDire2Responses).length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-[#16305B] text-white rounded-full font-bold text-sm">
                            2
                          </div>
                          <h3 className="text-lg font-bold text-[#16305B]">Case-Specific Questions</h3>
                        </div>
                        <div className="space-y-3">
                          {JSON.parse(selectedApplication.VoirDire2Responses).map((item: any, idx: number) => (
                            <div key={idx} className="p-4 bg-white rounded-lg border-l-4 border-purple-500 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                                  {idx + 1}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-gray-800 mb-2 leading-relaxed">
                                    {item.question}
                                  </p>
                                  <div className="flex items-start gap-2 mt-2">
                                    <span className="text-xs font-bold text-purple-700 uppercase tracking-wide mt-0.5">Answer:</span>
                                    <p className="text-sm text-gray-700 font-medium leading-relaxed flex-1">
                                      {item.answer}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    {selectedApplication.Status === "pending" && (
                      <>
                        <button
                          className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-bold hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                          onClick={() => updateApplicationStatus(selectedApplication.ApplicationId, "approved")}
                          disabled={updatingStatus}
                        >
                          {updatingStatus ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="w-5 h-5" />
                              <span>Approve Juror</span>
                            </>
                          )}
                        </button>
                        <button
                          className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg font-bold hover:from-red-700 hover:to-red-800 disabled:opacity-50 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                          onClick={() => updateApplicationStatus(selectedApplication.ApplicationId, "rejected")}
                          disabled={updatingStatus}
                        >
                          {updatingStatus ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <XMarkIcon className="w-5 h-5" />
                              <span>Reject Juror</span>
                            </>
                          )}
                        </button>
                      </>
                    )}
                    <button
                      className="px-8 py-3 bg-gray-100 text-[#16305B] rounded-lg font-bold hover:bg-gray-200 transition-colors border-2 border-gray-300"
                      onClick={() => {
                        setShowApplicationModal(false);
                        setSelectedApplication(null);
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Team Modal - IMPROVED */}
              {showAddTeam && (
                <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 w-full max-w-md">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[#16305B]">Add Team Member</h2>
                    <button
                      onClick={() => setShowAddTeam(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4 mb-6">
                    {newMembers.map((member, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="Enter full name"
                              className="border border-gray-300 px-3 py-2 rounded-lg w-full text-[#16305B] bg-white focus:outline-none focus:ring-2 focus:ring-[#16305B] focus:border-transparent"
                              value={member.Name}
                              onChange={e => {
                                const arr = [...newMembers];
                                arr[idx].Name = e.target.value;
                                setNewMembers(arr);
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Role <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., Paralegal, Associate"
                              className="border border-gray-300 px-3 py-2 rounded-lg w-full text-[#16305B] bg-white focus:outline-none focus:ring-2 focus:ring-[#16305B] focus:border-transparent"
                              value={member.Role}
                              onChange={e => {
                                const arr = [...newMembers];
                                arr[idx].Role = e.target.value;
                                setNewMembers(arr);
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="email"
                              placeholder="email@example.com"
                              className="border border-gray-300 px-3 py-2 rounded-lg w-full text-[#16305B] bg-white focus:outline-none focus:ring-2 focus:ring-[#16305B] focus:border-transparent"
                              value={member.Email}
                              onChange={e => {
                                const arr = [...newMembers];
                                arr[idx].Email = e.target.value;
                                setNewMembers(arr);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      className="flex-1 bg-[#16305B] text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-[#1e417a] transition-colors shadow-sm"
                      onClick={async () => {
                        const isValid = newMembers.every(m => m.Name && m.Role && m.Email);
                        if (!isValid) {
                          alert("Please fill all fields");
                          return;
                        }
                        await addTeamMembers(caseId, newMembers);
                        setShowAddTeam(false);
                        setNewMembers([{ Name: "", Role: "", Email: "" }]);
                      }}
                    >
                      Add Member
                    </button>
                    <button
                      className="px-6 py-2.5 bg-gray-200 text-[#16305B] rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                      onClick={() => setShowAddTeam(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Document Modal - IMPROVED WITH MULTIPLE UPLOADS */}
              {showAddDocument && (
                <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 w-full max-w-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[#16305B]">Upload Documents</h2>
                    <button
                      onClick={() => {
                        setShowAddDocument(false);
                        setFilesToUpload([]);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>

                  {/* File Input Area */}
                  <div className="mb-4">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <DocumentArrowUpIcon className="w-10 h-10 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 font-medium">Click to upload documents</p>
                        <p className="text-xs text-gray-500">or drag and drop files here</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        onChange={e => {
                          const files = Array.from(e.target.files || []);
                          const newFiles = files.map(file => ({
                            file,
                            description: "",
                            progress: 0,
                            id: Math.random().toString(36)
                          }));
                          setFilesToUpload(prev => [...prev, ...newFiles]);
                        }}
                      />
                    </label>
                  </div>

                  {/* Files List */}
                  {filesToUpload.length > 0 && (
                    <div className="mb-4 space-y-3 max-h-96 overflow-y-auto">
                      {filesToUpload.map((fileData, idx) => (
                        <div key={fileData.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">{fileData.file.name}</p>
                              <p className="text-xs text-gray-500">{(fileData.file.size / 1024).toFixed(2)} KB</p>
                            </div>
                            <button
                              onClick={() => setFilesToUpload(prev => prev.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:text-red-700"
                              title="Remove file"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                          
                          <input
                            type="text"
                            placeholder="Add description (optional)"
                            className="border border-gray-300 px-3 py-2 rounded-lg w-full text-sm text-[#16305B] bg-white focus:outline-none focus:ring-2 focus:ring-[#16305B]"
                            value={fileData.description}
                            onChange={e => {
                              const arr = [...filesToUpload];
                              arr[idx].description = e.target.value;
                              setFilesToUpload(arr);
                            }}
                          />

                          {/* Progress Bar */}
                          {fileData.progress > 0 && (
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${fileData.progress}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-600 mt-1">{fileData.progress}% uploaded</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Overall Progress */}
                  {uploadingDocuments && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#16305B]"></div>
                        <p className="text-sm font-medium text-blue-900">
                          Uploading {filesToUpload.filter(f => f.progress === 100).length} of {filesToUpload.length} files...
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      className="flex-1 bg-[#16305B] text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-[#1e417a] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={uploadDocuments}
                      disabled={filesToUpload.length === 0 || uploadingDocuments}
                    >
                      {uploadingDocuments ? "Uploading..." : `Upload ${filesToUpload.length} Document${filesToUpload.length !== 1 ? 's' : ''}`}
                    </button>
                    <button
                      className="px-6 py-2.5 bg-gray-200 text-[#16305B] rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                      onClick={() => {
                        setShowAddDocument(false);
                        setFilesToUpload([]);
                      }}
                      disabled={uploadingDocuments}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Delete Modal */}
              {showDeleteModal && deleteDoc && (
                <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 w-full max-w-md">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[#16305B]">Delete Document</h2>
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <p className="text-gray-700 mb-6">
                    Are you sure you want to delete <strong className="text-gray-900">{deleteDoc.FileName}</strong>? This action cannot be undone.
                  </p>
                  
                  <div className="flex gap-3">
                    <button
                      className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                      onClick={async () => {
                        if (!deleteDoc) return;
                        try {
                          setDeletingDocument(true);
                          await deleteDocument(caseId, deleteDoc.Id);
                          setDocumentation(prev => prev.filter(doc => doc.Id !== deleteDoc.Id));
                          setShowDeleteModal(false);
                          setDeleteDoc(null);
                        } catch (err) {
                          console.error("Delete failed:", err);
                          alert("Failed to delete document");
                        } finally {
                          setDeletingDocument(false);
                        }
                      }}
                      disabled={deletingDocument}
                    >
                      {deletingDocument ? "Deleting..." : "Delete"}
                    </button>
                    <button
                      className="px-6 py-2.5 bg-gray-200 text-[#16305B] rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                      onClick={() => {
                        setShowDeleteModal(false);
                        setDeleteDoc(null);
                      }}
                      disabled={deletingDocument}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}