"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import WitnessSection from "./components/WitnessSection";
import JuryChargeSection from "./components/JuryChargeSection";
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  XMarkIcon, 
  DocumentArrowUpIcon,
  UserGroupIcon,
  DocumentPlusIcon,
  TrashIcon,
  DocumentTextIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  ClockIcon,
  MapPinIcon,
  EnvelopeIcon,
  BriefcaseIcon
} from "@heroicons/react/24/outline";

type TeamMember = { 
  Name: string; 
  Role: string; 
  Email: string;
  Id?: number;
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
  CaseTier?: 'tier_1' | 'tier_2' | 'tier_3';
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

function createAuthHeaders(token?: string, extra?: Record<string, string>) {
  const headers: Record<string, string> = extra ? { ...extra } : {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}
// Loading Spinner Component
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative inline-block">
          <div className="w-24 h-24 border-8 border-slate-200 border-t-[#16305B] rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-24 h-24 border-8 border-transparent border-b-blue-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
        </div>
        <p className="mt-6 text-xl font-bold text-[#16305B]">Loading War Room...</p>
        <p className="mt-2 text-sm text-slate-600 font-medium">Please wait while we fetch your case details</p>
      </div>
    </div>
  );
}

// Helper function to parse and display Voir Dire responses
function parseVoirDireResponses(responsesString: string) {
  try {
    const responses = JSON.parse(responsesString);
    if (Array.isArray(responses) && responses.length > 0) {
      return responses;
    }
    return null;
  } catch {
    // If not JSON, return as plain text
    return responsesString ? [{ question: "Response", answer: responsesString }] : null;
  }
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
  const [applicationFilter, setApplicationFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  // War room submission state
  const [submittingWarRoom, setSubmittingWarRoom] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTierModal, setShowTierModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'tier_1' | 'tier_2' | 'tier_3' | null>(null);
  const [upgradingTier, setUpgradingTier] = useState(false);

  // Loading states
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isAddingTeam, setIsAddingTeam] = useState(false);

  // Fetch case data
  useEffect(() => {
    const fetchCase = async () => {
      try {
        const token = getCookie("token");
        const res = await fetch(`${API_BASE}/api/cases/${caseId}`, {
          headers: createAuthHeaders(token ?? undefined)
        });
        const data = await res.json();
        
        if (data.success) {
          setCaseData(data.case);
          setSelectedTier(data.case.CaseTier as 'tier_1' | 'tier_2' | 'tier_3' || null);
        }
      } catch (err) {
        console.error("Failed to fetch case:", err);
      }
    };

    if (caseId) {
      fetchCase();
    }
  }, [caseId]);

  // Fetch war room info
  useEffect(() => {
    if (!caseId) return;
    
    const fetchWarRoomInfo = async () => {
      setIsPageLoading(true);
      try {
        const token = getCookie("token");

        // Fetch all data in parallel
        const [teamRes, docsRes, appsRes] = await Promise.all([
          fetch(`${API_BASE}/api/cases/${caseId}/war-room/team`, {
            headers: createAuthHeaders(token ?? undefined)
          }),
          fetch(`${API_BASE}/api/cases/${caseId}/war-room/documents`, {
            headers: createAuthHeaders(token ?? undefined)
          }),
          fetch(`${API_BASE}/api/cases/${caseId}/applications`, {
            headers: createAuthHeaders(token ?? undefined)
          })
        ]);

        const [teamData, docsData, appsData] = await Promise.all([
          teamRes.json(),
          docsRes.json(),
          appsRes.json()
        ]);

        if (teamData.members) {
          setTeamMembers(teamData.members);
        }

        if (docsData.documents) {
          setDocumentation(docsData.documents);
        }

        if (appsData.applications) {
          setApplications(appsData.applications);
        }
      } catch (err) {
        console.error("Failed to fetch war room info:", err);
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchWarRoomInfo();
  }, [caseId]);

  async function addTeamMembers(caseId: string, members: TeamMember[]) {
    setIsAddingTeam(true);
    try {
      const token = getCookie("token");
      
      // Add all members
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
      
      // Fetch updated team list
      const res = await fetch(`${API_BASE}/api/cases/${caseId}/team`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setTeamMembers(data || []);
      
      // Reset form
      setNewMembers([{ Name: "", Role: "", Email: "" }]);
      setShowAddTeam(false);
    } catch (err) {
      console.error("Failed to add team members:", err);
      alert("Failed to add team members. Please try again.");
    } finally {
      setIsAddingTeam(false);
    }
  }

  async function uploadDocuments() {
    if (filesToUpload.length === 0) return;
    
    setUploadingDocuments(true);
    const token = getCookie("token");

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const fileToUpload = filesToUpload[i];
        const formData = new FormData();
        formData.append("file", fileToUpload.file);
        formData.append("description", fileToUpload.description);

        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setFilesToUpload(prev => 
              prev.map(f => f.id === fileToUpload.id ? { ...f, progress } : f)
            );
          }
        });

        await new Promise<void>((resolve, reject) => {
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });
          
          xhr.addEventListener("error", () => reject(new Error("Upload failed")));
          
          xhr.open("POST", `${API_BASE}/api/cases/${caseId}/war-room/documents`);
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.send(formData);
        });
      }

      // Refresh documents after upload
      const docsRes = await fetch(`${API_BASE}/api/cases/${caseId}/war-room/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const docsData = await docsRes.json();
      if (docsData.documents) {
        setDocumentation(docsData.documents);
      }

      setShowAddDocument(false);
      setFilesToUpload([]);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload one or more documents");
    } finally {
      setUploadingDocuments(false);
    }
  }

  async function deleteDocument(caseId: string, documentId: number) {
    const token = getCookie("token");
    const res = await fetch(`${API_BASE}/api/cases/${caseId}/war-room/documents/${documentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to delete document");
  }

  async function updateApplicationStatus(applicationId: number, newStatus: "approved" | "rejected") {
    setUpdatingStatus(true);
    try {
      const token = getCookie("token");
      const res = await fetch(`${API_BASE}/api/cases/${caseId}/applications/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error("Failed to update status");

      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.ApplicationId === applicationId 
            ? { ...app, Status: newStatus }
            : app
        )
      );

      if (selectedApplication?.ApplicationId === applicationId) {
        setSelectedApplication(prev => prev ? { ...prev, Status: newStatus } : null);
      }
    } catch (err) {
      console.error("Failed to update application status:", err);
      alert("Failed to update application status");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function submitWarRoom() {
    setSubmittingWarRoom(true);
    setErrorMessage(null);
    
    try {
      const token = getCookie("token");
      const res = await fetch(`${API_BASE}/api/cases/${caseId}/war-room/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit war room");
      }

      if (data.success) {
        setShowSuccessMessage(true);
        setTimeout(() => {
          setShowSuccessMessage(false);
          router.push(`/attorney/cases/${caseId}`);
        }, 2000);
      }
    } catch (err: unknown) {
      console.error("Failed to submit war room:", err);
      const message = err instanceof Error ? err.message : "Failed to submit war room. Please try again.";
      setErrorMessage(message);
    } finally {
      setSubmittingWarRoom(false);
    }
  }

  const plaintiffName = caseData ? getFirstName(caseData.PlaintiffGroups, "plaintiffs") : "";
  const defendantName = caseData ? getFirstName(caseData.DefendantGroups, "defendants") : "";
  const caseTitle = caseData?.CaseTitle || `${plaintiffName} v. ${defendantName}`;

  const pendingCount = applications.filter(app => app.Status === "pending").length;
  const approvedCount = applications.filter(app => app.Status === "approved").length;
  const rejectedCount = applications.filter(app => app.Status === "rejected").length;

  const filteredApplications = applications.filter(app => {
    if (applicationFilter === "all") return true;
    return app.Status === applicationFilter;
  });

  // Show loading spinner while fetching data
  if (isPageLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Enhanced Header with Glassmorphism */}
        <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#16305B]/5 to-blue-500/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl -ml-48 -mb-48"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-[#16305B] to-[#1e417a] rounded-xl shadow-lg">
                  <BriefcaseIcon className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#16305B] to-[#1e417a]">
                  War Room
                </h1>
              </div>
              <p className="text-lg text-slate-600 font-semibold ml-14">{caseTitle}</p>
            </div>
            <div className="flex items-center gap-4">
              {caseData?.CaseTier && (
                <div className="flex items-center gap-3">
                  <div className="px-6 py-3 bg-gradient-to-r from-[#16305B] to-[#1e417a] text-white rounded-2xl font-bold shadow-xl flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Tier {caseData.CaseTier.replace('tier_', '')}
                  </div>
                  <button
                    onClick={() => setShowTierModal(true)}
                    className="px-6 py-3 bg-white/50 backdrop-blur-sm text-[#16305B] rounded-2xl font-bold hover:bg-white/80 transition-all duration-200 shadow-lg hover:shadow-xl border border-[#16305B]/20"
                  >
                    Upgrade
                  </button>
                </div>
              )}
              <button
                onClick={submitWarRoom}
                disabled={submittingWarRoom}
                className="px-8 py-3 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white rounded-2xl font-bold hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 transition-all duration-200 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 group"
              >
                {submittingWarRoom ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span>Submit War Room</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-300 rounded-2xl p-6 flex items-center gap-4 shadow-xl animate-in slide-in-from-top">
            <div className="p-3 bg-emerald-100 rounded-full">
              <CheckCircleIcon className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <p className="text-emerald-900 font-bold text-lg">War Room Submitted Successfully!</p>
              <p className="text-emerald-700 font-medium">Redirecting to case details...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-gradient-to-r from-rose-50 via-red-50 to-pink-50 border-2 border-rose-300 rounded-2xl p-6 flex items-center gap-4 shadow-xl">
            <div className="p-3 bg-rose-100 rounded-full">
              <ExclamationCircleIcon className="w-8 h-8 text-rose-600" />
            </div>
            <div>
              <p className="text-rose-900 font-bold text-lg">Error</p>
              <p className="text-rose-700 font-medium">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Enhanced Team Members Section */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-[#16305B] to-[#1e417a] rounded-xl shadow-lg">
                      <UserGroupIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-[#16305B]">Team Members</h2>
                      <p className="text-sm text-slate-600 font-medium">{teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''} in your team</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddTeam(!showAddTeam)}
                    disabled={isAddingTeam}
                    className="p-3 bg-gradient-to-br from-[#16305B] to-[#1e417a] text-white rounded-xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                  </button>
                </div>
              </div>

              {/* Team Members List */}
              <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {teamMembers.map((member, idx) => (
                  <div key={idx} className="group relative bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border-2 border-slate-200 hover:border-[#16305B] transition-all duration-300 p-5 overflow-hidden">
                    {/* Decorative gradient bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#16305B] to-blue-600"></div>
                    
                    <div className="pl-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#16305B] to-[#1e417a] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {member.Name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-lg">{member.Name}</div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                              <BriefcaseIcon className="w-4 h-4" />
                              {member.Role}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1">
                              <EnvelopeIcon className="w-3.5 h-3.5" />
                              {member.Email}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {teamMembers.length === 0 && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-4">
                      <UserGroupIcon className="w-10 h-10 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-semibold text-lg mb-2">No Team Members Yet</p>
                    <p className="text-slate-400 text-sm">Add team members to collaborate on this case</p>
                  </div>
                )}
              </div>

              {/* Add Team Form */}
              {showAddTeam && (
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-t-2 border-blue-200">
                  {newMembers.map((member, idx) => (
                    <div key={idx} className="space-y-3 mb-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={member.Name}
                          onChange={(e) => {
                            const updated = [...newMembers];
                            updated[idx].Name = e.target.value;
                            setNewMembers(updated);
                          }}
                          disabled={isAddingTeam}
                          className="w-full px-4 py-3 pl-10 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-[#16305B] focus:border-[#16305B] transition-all bg-white text-slate-900 placeholder-slate-400 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <UserGroupIcon className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Role (e.g., Lead Attorney, Paralegal)"
                          value={member.Role}
                          onChange={(e) => {
                            const updated = [...newMembers];
                            updated[idx].Role = e.target.value;
                            setNewMembers(updated);
                          }}
                          disabled={isAddingTeam}
                          className="w-full px-4 py-3 pl-10 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-[#16305B] focus:border-[#16305B] transition-all bg-white text-slate-900 placeholder-slate-400 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <BriefcaseIcon className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                      </div>
                      <div className="relative">
                        <input
                          type="email"
                          placeholder="Email Address"
                          value={member.Email}
                          onChange={(e) => {
                            const updated = [...newMembers];
                            updated[idx].Email = e.target.value;
                            setNewMembers(updated);
                          }}
                          disabled={isAddingTeam}
                          className="w-full px-4 py-3 pl-10 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-[#16305B] focus:border-[#16305B] transition-all bg-white text-slate-900 placeholder-slate-400 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <EnvelopeIcon className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => {
                        setNewMembers([...newMembers, { Name: "", Role: "", Email: "" }]);
                      }}
                      disabled={isAddingTeam}
                      className="px-5 py-3 bg-white text-[#16305B] rounded-xl font-bold hover:bg-slate-100 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed border border-[#16305B]/20"
                    >
                      Add Another
                    </button>
                    <button
                      onClick={async () => {
                        const validMembers = newMembers.filter(
                          m => m.Name && m.Role && m.Email
                        );
                        if (validMembers.length > 0) {
                          await addTeamMembers(caseId, validMembers);
                        }
                      }}
                      disabled={isAddingTeam}
                      className="flex-1 px-8 py-3 bg-gradient-to-r from-[#16305B] to-[#1e417a] text-white rounded-xl font-bold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isAddingTeam ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-5 h-5" />
                          <span>Save Team</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ENHANCED Applications Section */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-[#16305B] via-[#1e417a] to-[#16305B] p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                      <DocumentTextIcon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Juror Applications</h2>
                      <p className="text-blue-100 text-sm font-medium mt-0.5">
                        Review and manage applicant submissions
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowApplicationsDropdown(!showApplicationsDropdown)}
                    className="px-6 py-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-xl font-bold transition-all duration-200 shadow-lg border border-white/20 flex items-center gap-2"
                  >
                    <span>{showApplicationsDropdown ? 'Hide' : 'Show'}</span>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm">{applications.length}</span>
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {/* Pending Card */}
                  <div className="group relative overflow-hidden bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-2xl border-2 border-amber-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider bg-amber-100 px-3 py-1 rounded-full">
                          Pending
                        </span>
                        <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                      </div>
                      <div className="text-4xl font-black text-amber-700 mb-1">{pendingCount}</div>
                      <div className="text-sm text-amber-600 font-semibold">Awaiting Review</div>
                    </div>
                  </div>

                  {/* Approved Card */}
                  <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-2xl border-2 border-emerald-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/20 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-100 px-3 py-1 rounded-full">
                          Approved
                        </span>
                        <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="text-4xl font-black text-emerald-700 mb-1">{approvedCount}</div>
                      <div className="text-sm text-emerald-600 font-semibold">Selected Jurors</div>
                    </div>
                  </div>

                  {/* Rejected Card */}
                  <div className="group relative overflow-hidden bg-gradient-to-br from-rose-50 via-red-50 to-pink-50 rounded-2xl border-2 border-rose-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-200/20 rounded-full -mr-16 -mt-16"></div>
                    <div className="relative p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-rose-600 uppercase tracking-wider bg-rose-100 px-3 py-1 rounded-full">
                          Rejected
                        </span>
                        <XMarkIcon className="w-5 h-5 text-rose-500" />
                      </div>
                      <div className="text-4xl font-black text-rose-700 mb-1">{rejectedCount}</div>
                      <div className="text-sm text-rose-600 font-semibold">Not Selected</div>
                    </div>
                  </div>
                </div>

                {/* Applications List */}
                {showApplicationsDropdown && (
                  <div className="space-y-4">
                    {/* Filter Tabs */}
                    <div className="flex gap-2 sticky top-0 bg-white z-10 pb-4 border-b border-slate-200">
                      {[
                        { key: 'all', label: 'All', count: applications.length },
                        { key: 'pending', label: 'Pending', count: pendingCount },
                        { key: 'approved', label: 'Approved', count: approvedCount },
                        { key: 'rejected', label: 'Rejected', count: rejectedCount }
                      ].map(filter => (
                        <button
                          key={filter.key}
                          onClick={() => setApplicationFilter(filter.key as any)}
                          className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                            applicationFilter === filter.key
                              ? 'bg-[#16305B] text-white shadow-lg'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {filter.label} ({filter.count})
                        </button>
                      ))}
                    </div>

                    {/* Applications Cards */}
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {filteredApplications.length > 0 ? (
                        filteredApplications.map((app) => (
                          <div
                            key={app.ApplicationId}
                            className="group relative bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border-2 border-slate-200 hover:border-[#16305B] transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg overflow-hidden"
                            onClick={() => {
                              setSelectedApplication(app);
                              setShowApplicationModal(true);
                            }}
                          >
                            {/* Status Indicator Bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                              app.Status === "approved" 
                                ? "bg-gradient-to-b from-emerald-400 to-green-500" 
                                : app.Status === "rejected" 
                                ? "bg-gradient-to-b from-rose-400 to-red-500" 
                                : "bg-gradient-to-b from-amber-400 to-yellow-500"
                            }`}></div>

                            <div className="p-5 pl-6">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  {/* Juror Info */}
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="w-14 h-14 bg-gradient-to-br from-[#16305B] to-[#1e417a] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
                                      {app.JurorName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-bold text-slate-900 text-lg group-hover:text-[#16305B] transition-colors">
                                        {app.JurorName}
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                        <MapPinIcon className="w-4 h-4" />
                                        {app.County}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Application Date */}
                                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                    <ClockIcon className="w-4 h-4" />
                                    Applied {new Date(app.AppliedAt).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric', 
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>

                                {/* Status Badge */}
                                <div className="flex flex-col items-end gap-3">
                                  <div className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg border-2 transition-all duration-200 ${
                                    app.Status === "approved" 
                                      ? "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-300" 
                                      : app.Status === "rejected" 
                                      ? "bg-gradient-to-r from-rose-100 to-red-100 text-rose-800 border-rose-300" 
                                      : "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-300"
                                  }`}>
                                    {app.Status === "approved" && "✓ "}
                                    {app.Status === "rejected" && "✗ "}
                                    {app.Status === "pending" && "⏱ "}
                                    {app.Status.charAt(0).toUpperCase() + app.Status.slice(1)}
                                  </div>
                                  
                                  {/* View Details Arrow */}
                                  <div className="flex items-center gap-1 text-xs font-bold text-[#16305B] group-hover:gap-2 transition-all">
                                    <span>View Details</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-16">
                          <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-4">
                            <DocumentTextIcon className="w-10 h-10 text-slate-400" />
                          </div>
                          <p className="text-slate-500 font-semibold text-lg mb-2">No {applicationFilter !== 'all' ? applicationFilter : ''} Applications</p>
                          <p className="text-slate-400 text-sm">
                            {applicationFilter === 'all' 
                              ? 'Juror applications will appear here once submitted' 
                              : `No ${applicationFilter} applications found`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Witness Section */}
            <WitnessSection caseId={caseId} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Documentation Section - PROFESSIONAL TOOLTIPS */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-[#16305B] to-[#1e417a] rounded-xl shadow-lg">
                      <DocumentPlusIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-[#16305B]">Documentation</h2>
                      <p className="text-sm text-slate-600 font-medium">{documentation.length} document{documentation.length !== 1 ? 's' : ''} uploaded</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddDocument(!showAddDocument)}
                    className="p-3 bg-gradient-to-br from-[#16305B] to-[#1e417a] text-white rounded-xl hover:shadow-lg transition-all duration-200 group relative"
                  >
                    <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                    {/* Add Button Tooltip */}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none shadow-xl">
                      Add Documents
                      <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Documents List */}
              <div className="p-6 space-y-3 max-h-96 overflow-y-auto custom-scrollbar relative z-0">
              {documentation.map((doc) => (
                <div
                  key={doc.Id}
                  className="group relative bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border-2 border-slate-200 hover:border-blue-400 transition-all duration-200 p-4 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <DocumentTextIcon className="w-6 h-6 text-[#16305B]" />
                      </div>

                      {/* ===================== File Info ===================== */}
                      <div className="flex-1 min-w-0 space-y-0.5 relative">
                        {/* ---------- File Name ---------- */}
                        <div className="relative group/filename">
                          <div
                            className="font-semibold text-slate-900 text-base truncate cursor-default"
                            title={doc.FileName.length <= 35 ? doc.FileName : undefined}
                          >
                            {doc.FileName}
                          </div>

                          {/* Tooltip for long file names */}
                          {doc.FileName.length > 35 && (
                            <div className="fixed px-3 py-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white text-sm font-semibold rounded-xl shadow-xl max-w-xs whitespace-normal break-words opacity-0 invisible group-hover/filename:opacity-100 group-hover/filename:visible transition-all duration-300 ease-out pointer-events-none z-[9999] border border-slate-700 transform -translate-y-3 left-[calc(50%-8rem)]">
                              {doc.FileName}
                              {/* Arrow */}
                              <span className="absolute top-full left-6 border-[6px] border-transparent border-t-slate-900"></span>
                            </div>
                          )}
                        </div>

                        {/* ---------- Description ---------- */}
                        <div className="relative group/desc">
                          <div
                            className="text-sm text-slate-600 font-medium truncate cursor-default"
                            title={
                              doc.Description && doc.Description.length <= 45
                                ? doc.Description
                                : undefined
                            }
                          >
                            {doc.Description || "No description"}
                          </div>

                          {/* Tooltip for long descriptions */}
                          {doc.Description && doc.Description.length > 45 && (
                            <div className="fixed px-3 py-2 bg-gradient-to-r from-indigo-900 to-indigo-800 text-white text-xs font-medium rounded-xl shadow-xl max-w-xs whitespace-normal break-words opacity-0 invisible group-hover/desc:opacity-100 group-hover/desc:visible transition-all duration-300 ease-out pointer-events-none z-[9999] border border-indigo-700 transform -translate-y-3 left-[calc(50%-8rem)]">
                              {doc.Description}
                              {/* Arrow */}
                              <span className="absolute top-full left-6 border-[6px] border-transparent border-t-indigo-900"></span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ===================== Action Buttons ===================== */}
                    <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                      {/* View Button */}
                      <div className="relative group/view">
                        <a
                          href={doc.FileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 text-[#16305B] hover:bg-blue-100 rounded-xl transition-all duration-200 flex items-center justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DocumentArrowUpIcon className="w-5 h-5" />
                        </a>
                        {/* Tooltip */}
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gradient-to-r from-[#16305B] to-[#1e417a] text-white text-xs font-bold rounded-lg whitespace-nowrap opacity-0 invisible group-hover/view:opacity-100 group-hover/view:visible transition-all duration-200 pointer-events-none shadow-xl z-[100]">
                          View Document
                          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#16305B]"></span>
                        </span>
                      </div>

                      {/* Delete Button */}
                      <div className="relative group/delete">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDoc(doc);
                            setShowDeleteModal(true);
                          }}
                          className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 flex items-center justify-center"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                        {/* Tooltip */}
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-bold rounded-lg whitespace-nowrap opacity-0 invisible group-hover/delete:opacity-100 group-hover/delete:visible transition-all duration-200 pointer-events-none shadow-xl z-[100]">
                          Delete Document
                          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-600"></span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* ========== Empty State ========== */}
              {documentation.length === 0 && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-4">
                    <DocumentPlusIcon className="w-10 h-10 text-slate-400" />
                  </div>
                  <p className="text-slate-500 font-semibold text-lg mb-2">
                    No Documents Yet
                  </p>
                  <p className="text-slate-400 text-sm">
                    Upload case documents and evidence
                  </p>
                </div>
              )}
            </div>


              {/* Upload Form */}
              {showAddDocument && (
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-t-2 border-blue-200">
                  <div className="space-y-4">
                    {/* File Input */}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3">
                        Select Files to Upload
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const newFiles: FileToUpload[] = files.map(file => ({
                              file,
                              description: "",
                              progress: 0,
                              id: Math.random().toString(36).substring(7)
                            }));
                            setFilesToUpload(prev => [...prev, ...newFiles]);
                          }}
                          disabled={uploadingDocuments}
                          className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-[#16305B] focus:border-[#16305B] transition-all bg-white text-slate-900 font-medium file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#16305B] file:text-white hover:file:bg-[#1e417a] file:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Files to Upload List */}
                    {filesToUpload.length > 0 && (
                      <div className="space-y-3">
                        {filesToUpload.map((fileToUpload) => (
                          <div key={fileToUpload.id} className="p-4 bg-white rounded-xl border-2 border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              {/* File name with elegant tooltip */}
                              <div className="relative group/uploadfile flex-1 min-w-0 mr-3">
                                <span className="text-sm font-bold text-slate-900 truncate block">
                                  {fileToUpload.file.name}
                                </span>
                                {/* Tooltip for long file names during upload */}
                                {fileToUpload.file.name.length > 45 && (
                                  <span className="absolute left-0 bottom-full mb-2 px-3 py-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white text-xs font-semibold rounded-xl shadow-2xl max-w-sm whitespace-normal break-words opacity-0 invisible group-hover/uploadfile:opacity-100 group-hover/uploadfile:visible transition-all duration-300 pointer-events-none z-[100] border border-slate-700">
                                    {fileToUpload.file.name}
                                    <span className="absolute top-full left-6 border-[6px] border-transparent border-t-slate-900"></span>
                                  </span>
                                )}
                              </div>
                              <div className="relative group/remove">
                                <button
                                  onClick={() => {
                                    setFilesToUpload(prev => prev.filter(f => f.id !== fileToUpload.id));
                                  }}
                                  disabled={uploadingDocuments}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 transition-all duration-200"
                                >
                                  <XMarkIcon className="w-5 h-5" />
                                </button>
                                {/* Remove button tooltip */}
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-bold rounded-lg whitespace-nowrap opacity-0 invisible group-hover/remove:opacity-100 group-hover/remove:visible transition-all duration-200 pointer-events-none shadow-xl z-[100]">
                                  Remove File
                                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-600"></span>
                                </span>
                              </div>
                            </div>
                            <input
                              type="text"
                              placeholder="Document description (optional)"
                              value={fileToUpload.description}
                              onChange={(e) => {
                                setFilesToUpload(prev =>
                                  prev.map(f =>
                                    f.id === fileToUpload.id
                                      ? { ...f, description: e.target.value }
                                      : f
                                  )
                                );
                              }}
                              disabled={uploadingDocuments}
                              className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-[#16305B] focus:border-[#16305B] transition-all text-sm bg-white text-slate-900 placeholder-slate-400 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            {fileToUpload.progress > 0 && (
                              <div className="mt-3">
                                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-[#16305B] via-blue-600 to-[#16305B] h-3 rounded-full transition-all duration-300 shadow-sm relative overflow-hidden"
                                    style={{ width: `${fileToUpload.progress}%` }}
                                  >
                                    {/* Animated shine effect */}
                                    <div className="absolute inset-0 shimmer-animation"></div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                  <p className="text-xs text-slate-600 font-semibold">{fileToUpload.progress}% uploaded</p>
                                  <p className="text-xs text-slate-500 font-medium">{((fileToUpload.file.size / 1024 / 1024) * (fileToUpload.progress / 100)).toFixed(2)} MB / {(fileToUpload.file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-5">
                      <button
                        className="flex-1 bg-gradient-to-r from-[#16305B] to-[#1e417a] text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        onClick={uploadDocuments}
                        disabled={filesToUpload.length === 0 || uploadingDocuments}
                      >
                        {uploadingDocuments ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <ArrowUpTrayIcon className="w-5 h-5" />
                            <span>Upload {filesToUpload.length} Document{filesToUpload.length !== 1 ? 's' : ''}</span>
                          </>
                        )}
                      </button>
                      <button
                        className="px-6 py-3 bg-white text-[#16305B] rounded-xl font-bold hover:bg-slate-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-[#16305B]/20"
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
                </div>
              )}
            </div>

            {/* Jury Charge Section */}
            <JuryChargeSection caseId={caseId} />
          </div>
        </div>

        {/* ENHANCED Application Details Modal */}
        {showApplicationModal && selectedApplication && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
          >
            <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-200 p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              {/* Header */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#16305B] to-[#1e417a] rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {selectedApplication.JurorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-[#16305B]">Application Details</h2>
                    <p className="text-slate-600 font-medium">{selectedApplication.JurorName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-xl"
                >
                  <XMarkIcon className="w-7 h-7" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border-2 border-slate-200">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                      <EnvelopeIcon className="w-4 h-4" />
                      Email
                    </label>
                    <p className="text-slate-900 font-bold text-lg mt-2">{selectedApplication.JurorEmail}</p>
                  </div>

                  <div className="p-5 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border-2 border-slate-200">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                      <MapPinIcon className="w-4 h-4" />
                      County
                    </label>
                    <p className="text-slate-900 font-bold text-lg mt-2">{selectedApplication.County}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="p-5 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border-2 border-slate-200">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Status</label>
                  <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold mt-3 shadow-md ${
                    selectedApplication.Status === "approved" ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-2 border-green-300" :
                    selectedApplication.Status === "rejected" ? "bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-2 border-red-300" :
                    "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-2 border-yellow-300"
                  }`}>
                    {selectedApplication.Status === "approved" && <CheckCircleIcon className="w-5 h-5" />}
                    {selectedApplication.Status === "rejected" && <XMarkIcon className="w-5 h-5" />}
                    {selectedApplication.Status === "pending" && <ClockIcon className="w-5 h-5" />}
                    {selectedApplication.Status.charAt(0).toUpperCase() + selectedApplication.Status.slice(1)}
                  </div>
                </div>

                {/* Voir Dire Part 1 */}
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
                  <label className="text-sm font-bold text-[#16305B] uppercase tracking-wider mb-4 block flex items-center gap-2">
                    <DocumentTextIcon className="w-5 h-5" />
                    Voir Dire Part 1 Responses
                  </label>
                  <div className="space-y-4">
                    {(() => {
                      const responses = parseVoirDireResponses(selectedApplication.VoirDire1Responses);
                      if (!responses || responses.length === 0) {
                        return <p className="text-slate-600 italic">No responses provided</p>;
                      }
                      return responses.map((item: any, idx: number) => (
                        <div key={idx} className="p-4 bg-white rounded-xl border border-blue-200">
                          <p className="text-sm font-bold text-slate-700 mb-2">
                            Q{idx + 1}: {item.question || `Question ${idx + 1}`}
                          </p>
                          <p className="text-slate-900 font-medium leading-relaxed">
                            {item.answer || item}
                          </p>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Voir Dire Part 2 */}
                <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
                  <label className="text-sm font-bold text-purple-900 uppercase tracking-wider mb-4 block flex items-center gap-2">
                    <DocumentTextIcon className="w-5 h-5" />
                    Voir Dire Part 2 Responses
                  </label>
                  <div className="space-y-4">
                    {(() => {
                      const responses = parseVoirDireResponses(selectedApplication.VoirDire2Responses);
                      if (!responses || responses.length === 0) {
                        return <p className="text-slate-600 italic">No responses provided</p>;
                      }
                      return responses.map((item: any, idx: number) => (
                        <div key={idx} className="p-4 bg-white rounded-xl border border-purple-200">
                          <p className="text-sm font-bold text-slate-700 mb-2">
                            Q{idx + 1}: {item.question || `Question ${idx + 1}`}
                          </p>
                          <p className="text-slate-900 font-medium leading-relaxed">
                            {item.answer || item}
                          </p>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Application Date */}
                <div className="p-5 bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl border-2 border-slate-200">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    Applied At
                  </label>
                  <p className="text-slate-900 font-bold text-lg mt-2">{new Date(selectedApplication.AppliedAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedApplication.Status === "pending" && (
                <div className="flex gap-4 mt-8 pt-6 border-t-2 border-slate-200">
                  <button
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-4 rounded-2xl font-bold hover:from-emerald-700 hover:to-green-700 transition-all duration-200 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                    onClick={() => updateApplicationStatus(selectedApplication.ApplicationId, "approved")}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span>Approve Application</span>
                      </>
                    )}
                  </button>
                  <button
                    className="flex-1 bg-gradient-to-r from-rose-600 to-red-600 text-white px-6 py-4 rounded-2xl font-bold hover:from-rose-700 hover:to-red-700 transition-all duration-200 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                    onClick={() => updateApplicationStatus(selectedApplication.ApplicationId, "rejected")}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <XMarkIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span>Reject Application</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Document Modal */}
        {showDeleteModal && deleteDoc && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
          >
            <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-200 p-8 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#16305B]">Delete Document</h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deletingDocument}
                  className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <p className="text-slate-700 mb-8 text-lg leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-900 font-bold">{deleteDoc.FileName}</strong>? This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl font-bold hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                  {deletingDocument ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Deleting...</span>
                    </div>
                  ) : (
                    "Delete"
                  )}
                </button>
                <button
                  className="px-6 py-3 bg-slate-200 text-[#16305B] rounded-xl font-bold hover:bg-slate-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        )}

        {/* Tier Upgrade Modal - IMPROVED VERSION */}
        {showTierModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
          >
            <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-200 p-8 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-[#16305B]">Upgrade Case Tier</h2>
                  <p className="text-slate-600 font-medium mt-1">Get more time for your case</p>
                </div>
                <button
                  onClick={() => {
                    setShowTierModal(false);
                    setSelectedTier(null);
                  }}
                  disabled={upgradingTier}
                  className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 p-2 hover:bg-slate-100 rounded-xl"
                >
                  <XMarkIcon className="w-7 h-7" />
                </button>
              </div>

              <div className="space-y-6 mb-8">
                {/* Current Tier Display */}
                <div className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border-2 border-blue-300 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-2">Current Tier</p>
                      <p className="text-3xl font-black text-[#16305B]">
                        Tier {caseData?.CaseTier?.replace('tier_', '')}
                        {caseData?.CaseTier === 'tier_1' && ' - Premium'}
                        {caseData?.CaseTier === 'tier_2' && ' - Standard'}
                        {caseData?.CaseTier === 'tier_3' && ' - Basic'}
                      </p>
                      <p className="text-lg text-slate-700 mt-2 font-semibold">
                        {caseData?.CaseTier === 'tier_1' && '$2,500 • 2.5 hours'}
                        {caseData?.CaseTier === 'tier_2' && '$3,000 • 3.0 hours'}
                        {caseData?.CaseTier === 'tier_3' && '$4,000 • 4.0 hours'}
                      </p>
                    </div>
                    <div className="w-20 h-20 bg-gradient-to-br from-[#16305B] to-[#1e417a] rounded-full flex items-center justify-center text-white font-black text-2xl shadow-xl">
                      {caseData?.CaseTier?.replace('tier_', '')}
                    </div>
                  </div>
                </div>

                {/* Check if already at highest tier */}
                {caseData?.CaseTier === 'tier_1' ? (
                  <div className="p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border-2 border-emerald-300 shadow-md text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                      <CheckCircleIcon className="w-10 h-10 text-emerald-600" />
                    </div>
                    <p className="text-xl font-bold text-emerald-900 mb-2">You're at the Highest Tier!</p>
                    <p className="text-emerald-700 font-medium">
                      You're already on Tier 1 (Premium) - the best tier available. No further upgrades possible.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Upgrade Instructions */}
                    <div className="p-5 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border-2 border-amber-300">
                      <p className="text-amber-900 font-semibold flex items-center gap-2">
                        <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0" />
                        Choose a higher tier below to upgrade your case
                      </p>
                    </div>

                    {/* Available Upgrade Options */}
                    <div className="space-y-4">
                      <p className="text-sm font-bold text-slate-600 uppercase tracking-wider">Available Upgrades</p>
                      
                      {/* Show Tier 2 option if currently on Tier 3 */}
                      {caseData?.CaseTier === 'tier_3' && (
                        <button
                          className={`w-full p-6 rounded-2xl border-3 transition-all duration-300 text-left ${
                            selectedTier === 'tier_2'
                              ? 'border-[#16305B] bg-gradient-to-br from-[#16305B] to-[#1e417a] text-white shadow-2xl scale-[1.02]'
                              : 'border-slate-300 hover:border-[#16305B] text-slate-700 bg-gradient-to-br from-white to-slate-50 hover:shadow-xl hover:scale-[1.01]'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          onClick={() => setSelectedTier('tier_2')}
                          disabled={upgradingTier}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl shadow-lg ${
                                  selectedTier === 'tier_2' 
                                    ? 'bg-white/20 text-white' 
                                    : 'bg-gradient-to-br from-[#16305B] to-[#1e417a] text-white'
                                }`}>
                                  2
                                </div>
                                <div>
                                  <div className={`font-black text-2xl ${selectedTier === 'tier_2' ? 'text-white' : 'text-[#16305B]'}`}>
                                    Tier 2 - Standard
                                  </div>
                                  <div className={`text-lg font-bold mt-1 ${selectedTier === 'tier_2' ? 'text-blue-100' : 'text-slate-600'}`}>
                                    $3,000 • 3.0 hours duration
                                  </div>
                                </div>
                              </div>
                              <div className={`text-sm font-semibold mt-3 ${selectedTier === 'tier_2' ? 'text-blue-100' : 'text-slate-600'}`}>
                                ✓ Save $1,000 compared to current tier
                              </div>
                            </div>
                            {selectedTier === 'tier_2' && (
                              <CheckCircleIcon className="w-8 h-8 text-white flex-shrink-0 ml-4" />
                            )}
                          </div>
                        </button>
                      )}

                      {/* Show Tier 1 option if on Tier 2 or Tier 3 */}
                      {(caseData?.CaseTier === 'tier_2' || caseData?.CaseTier === 'tier_3') && (
                        <button
                          className={`w-full p-6 rounded-2xl border-3 transition-all duration-300 text-left ${
                            selectedTier === 'tier_1'
                              ? 'border-[#16305B] bg-gradient-to-br from-[#16305B] to-[#1e417a] text-white shadow-2xl scale-[1.02]'
                              : 'border-slate-300 hover:border-[#16305B] text-slate-700 bg-gradient-to-br from-white to-slate-50 hover:shadow-xl hover:scale-[1.01]'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          onClick={() => setSelectedTier('tier_1')}
                          disabled={upgradingTier}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl shadow-lg ${
                                  selectedTier === 'tier_1' 
                                    ? 'bg-white/20 text-white' 
                                    : 'bg-gradient-to-br from-[#16305B] to-[#1e417a] text-white'
                                }`}>
                                  1
                                </div>
                                <div>
                                  <div className={`font-black text-2xl ${selectedTier === 'tier_1' ? 'text-white' : 'text-[#16305B]'}`}>
                                    Tier 1 - Premium ⭐
                                  </div>
                                  <div className={`text-lg font-bold mt-1 ${selectedTier === 'tier_1' ? 'text-blue-100' : 'text-slate-600'}`}>
                                    $2,500 • 2.5 hours duration
                                  </div>
                                </div>
                              </div>
                              <div className={`text-sm font-semibold mt-3 ${selectedTier === 'tier_1' ? 'text-blue-100' : 'text-slate-600'}`}>
                                ✓ Save {caseData?.CaseTier === 'tier_3' ? '$1,500' : '$500'} compared to current tier
                              </div>
                            </div>
                            {selectedTier === 'tier_1' && (
                              <CheckCircleIcon className="w-8 h-8 text-white flex-shrink-0 ml-4" />
                            )}
                          </div>
                        </button>
                      )}
                    </div>

                    {/* Savings Info */}
                    {selectedTier && (
                      <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-300 shadow-md">
                        <p className="text-green-900 font-bold text-lg flex items-center gap-2">
                          <CheckCircleIcon className="w-6 h-6 flex-shrink-0" />
                          You'll save money by upgrading to a higher tier!
                        </p>
                        <p className="text-green-700 text-sm mt-2 font-semibold">
                          {selectedTier === 'tier_1' && caseData?.CaseTier === 'tier_3' && 'Save $1,500 and get 2.5 hours'}
                          {selectedTier === 'tier_1' && caseData?.CaseTier === 'tier_2' && 'Save $500 and get 2.5 hours'}
                          {selectedTier === 'tier_2' && caseData?.CaseTier === 'tier_3' && 'Save $1,000 and get 3.0 hours'}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Action Buttons - Only show if not at tier 1 */}
              {caseData?.CaseTier !== 'tier_1' && (
                <div className="flex gap-4 pt-6 border-t-2 border-slate-200">
                  <button
                    className="flex-1 bg-gradient-to-r from-[#16305B] to-[#1e417a] text-white px-8 py-4 rounded-2xl font-bold hover:shadow-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                    disabled={!selectedTier || upgradingTier}
                    onClick={async () => {
                      if (!selectedTier) return;
                      
                      setUpgradingTier(true);
                      try {
                        const token = getCookie("token");
                        const res = await fetch(`${API_BASE}/api/cases/${caseId}/upgrade-tier`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({ 
                            newTier: selectedTier,
                          })
                        });

                        const data = await res.json();
                        
                        if (!res.ok) {
                          throw new Error(data.error || 'Failed to upgrade tier');
                        }

                        if (data.success) {
                          // Update local state
                          setCaseData(prev => prev ? { ...prev, CaseTier: selectedTier } : null);
                          
                          // Show success message
                          alert(`✅ Successfully upgraded to Tier ${selectedTier.replace('tier_', '')}!\n\nYou saved $${Math.abs(data.refundAmount / 100).toFixed(2)}!`);
                          
                          // Close modal
                          setShowTierModal(false);
                          setSelectedTier(null);
                        }
                      } catch (err: unknown) {
                        console.error('Error upgrading tier:', err);
                        const message = err instanceof Error ? err.message : String(err);
                        alert('❌ Failed to upgrade tier: ' + message);
                      } finally {
                        setUpgradingTier(false);
                      }
                    }}
                  >
                    {upgradingTier ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <span className="text-lg">Processing Upgrade...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span className="text-lg">Confirm Upgrade</span>
                      </>
                    )}
                  </button>
                  <button
                    className="px-8 py-4 bg-slate-200 text-[#16305B] rounded-2xl font-bold hover:bg-slate-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                    onClick={() => {
                      setShowTierModal(false);
                      setSelectedTier(null);
                    }}
                    disabled={upgradingTier}
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Close button for tier 1 */}
              {caseData?.CaseTier === 'tier_1' && (
                <div className="pt-6 border-t-2 border-slate-200">
                  <button
                    className="w-full px-8 py-4 bg-gradient-to-r from-[#16305B] to-[#1e417a] text-white rounded-2xl font-bold hover:shadow-lg transition-all duration-200 text-lg"
                    onClick={() => setShowTierModal(false)}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #16305B, #1e417a);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #0f2347, #16305B);
        }
      `}</style>
    </div>
  );
}