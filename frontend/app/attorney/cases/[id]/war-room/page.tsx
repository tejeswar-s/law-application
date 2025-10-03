"use client";
import AttorneySidebar from "@/app/attorney/components/AttorneySidebar";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

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
};

function getFirstName(groups: string, key: "plaintiffs" | "defendants") {
  try {
    const arr = JSON.parse(groups);
    return arr[0]?.[key]?.[0]?.Name || "";
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
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [documentation, setDocumentation] = useState<Document[]>([]);
  const [uploadingDocument, setUploadingDocument] = useState(false);
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

  async function uploadDocument(caseId: string, file: File, description: string) {
    const token = getCookie("token");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("description", description);

    await fetch(`${API_BASE}/api/cases/${caseId}/documents`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData,
    });
    
    const res = await fetch(`${API_BASE}/api/cases/${caseId}/documents`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    setDocumentation(data || []);
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
  const canSubmit = approvedCount >= 7 && caseData?.AttorneyStatus === "war_room";

  return (
    <div className="flex min-h-screen bg-[#F7F6F3]">
      <AttorneySidebar selectedSection={"home"} onSectionChange={() => {}} />
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
                  className="text-[#16305B] underline text-sm font-medium"
                  onClick={() => router.push("/attorney")}
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
                  {!canSubmit && approvedCount < 7 && (
                    <p className="text-xs text-red-600 mt-1">Need 7 approved jurors ({approvedCount}/7)</p>
                  )}
                </div>
              </div>

              <h1 className="text-2xl font-bold mt-2 mb-1 text-[#363636]">
                {getFirstName(caseData.PlaintiffGroups, "plaintiffs")} v. {getFirstName(caseData.DefendantGroups, "defendants")} War Room
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
                  Manage the Voir Dire questions and review potential Juror Responses ({approvedCount}/7 selected, {pendingCount} pending)
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
            </>
          )}
        </div>

        {/* Modals - keeping existing modals code... */}
        {(showAddTeam || showAddDocument || showDeleteModal || showApplicationModal) && (
          <div className="absolute inset-0 backdrop-blur-[2px] flex items-center justify-center z-50">
            {/* Application Modal */}
            {showApplicationModal && selectedApplication && (
              <div className="bg-white rounded shadow-lg border border-gray-200 p-6 w-[600px] max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4 text-[#16305B]">Application Details</h2>
                
                <div className="mb-4 p-4 bg-gray-50 rounded">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-semibold">Name:</span> {selectedApplication.JurorName}</div>
                    <div><span className="font-semibold">Email:</span> {selectedApplication.JurorEmail}</div>
                    <div><span className="font-semibold">County:</span> {selectedApplication.County}</div>
                    <div><span className="font-semibold">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                        selectedApplication.Status === "approved" ? "bg-green-100 text-green-700" :
                        selectedApplication.Status === "rejected" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {selectedApplication.Status.charAt(0).toUpperCase() + selectedApplication.Status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-bold text-[#16305B] mb-2">Part 1: Standard Questions</h3>
                  <div className="space-y-3">
                    {JSON.parse(selectedApplication.VoirDire1Responses).map((item: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded">
                        <div className="text-sm font-semibold text-gray-700 mb-1">{idx + 1}. {item.question}</div>
                        <div className="text-sm text-gray-600">Answer: <span className="font-semibold">{item.answer}</span></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-bold text-[#16305B] mb-2">Part 2: Case-Specific Questions</h3>
                  <div className="space-y-3">
                    {JSON.parse(selectedApplication.VoirDire2Responses).map((item: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded">
                        <div className="text-sm font-semibold text-gray-700 mb-1">{idx + 1}. {item.question}</div>
                        <div className="text-sm text-gray-600">Answer: <span className="font-semibold">{item.answer}</span></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  {selectedApplication.Status === "pending" && (
                    <>
                      <button
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded font-semibold hover:bg-green-700 disabled:opacity-50"
                        onClick={() => updateApplicationStatus(selectedApplication.ApplicationId, "approved")}
                        disabled={updatingStatus}
                      >
                        {updatingStatus ? "Updating..." : "Approve"}
                      </button>
                      <button
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 disabled:opacity-50"
                        onClick={() => updateApplicationStatus(selectedApplication.ApplicationId, "rejected")}
                        disabled={updatingStatus}
                      >
                        {updatingStatus ? "Updating..." : "Reject"}
                      </button>
                    </>
                  )}
                  <button
                    className="px-4 py-2 bg-gray-300 text-[#16305B] rounded font-semibold"
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

            {/* Team Modal */}
            {showAddTeam && (
              <div className="bg-white rounded shadow-lg border border-gray-200 p-6 w-[350px]">
                <h2 className="text-lg font-bold mb-4 text-[#16305B]">Add Team Member</h2>
                {newMembers.map((member, idx) => (
                  <div key={idx} className="mb-2">
                    <input
                      type="text"
                      placeholder="Name"
                      className="border px-2 py-1 rounded w-full mb-2 text-[#16305B] bg-white"
                      value={member.Name}
                      onChange={e => {
                        const arr = [...newMembers];
                        arr[idx].Name = e.target.value;
                        setNewMembers(arr);
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Role"
                      className="border px-2 py-1 rounded w-full mb-2 text-[#16305B] bg-white"
                      value={member.Role}
                      onChange={e => {
                        const arr = [...newMembers];
                        arr[idx].Role = e.target.value;
                        setNewMembers(arr);
                      }}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      className="border px-2 py-1 rounded w-full text-[#16305B] bg-white"
                      value={member.Email}
                      onChange={e => {
                        const arr = [...newMembers];
                        arr[idx].Email = e.target.value;
                        setNewMembers(arr);
                      }}
                    />
                  </div>
                ))}
                <div className="flex gap-2 mt-4">
                  <button
                    className="bg-[#16305B] text-white px-4 py-2 rounded font-semibold"
                    onClick={async () => {
                      await addTeamMembers(caseId, newMembers);
                      setShowAddTeam(false);
                      setNewMembers([{ Name: "", Role: "", Email: "" }]);
                    }}
                  >
                    Add
                  </button>
                  <button
                    className="bg-gray-300 text-[#16305B] px-4 py-2 rounded font-semibold"
                    onClick={() => setShowAddTeam(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Document Modal */}
            {showAddDocument && (
              <div className="bg-white rounded shadow-lg border border-gray-200 p-6 w-[350px]">
                <h2 className="text-lg font-bold mb-4 text-[#16305B]">Add Document</h2>
                <input
                  type="file"
                  className="mb-2 text-[#16305B] bg-white font-medium"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
                <input
                  type="text"
                  placeholder="Description"
                  className="border px-2 py-1 rounded w-full mb-2 text-[#16305B] bg-white"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
                <div className="flex gap-2 mt-4">
                  <button
                    className="bg-[#16305B] text-white px-4 py-2 rounded font-semibold"
                    onClick={async () => {
                      if (file) {
                        setUploadingDocument(true);
                        await uploadDocument(caseId, file, description);
                        setUploadingDocument(false);
                        setShowAddDocument(false);
                        setFile(null);
                        setDescription("");
                      }
                    }}
                  >
                    {uploadingDocument ? "Uploading..." : "Add"}
                  </button>
                  <button
                    className="bg-gray-300 text-[#16305B] px-4 py-2 rounded font-semibold"
                    onClick={() => setShowAddDocument(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
              <div className="bg-white rounded shadow-lg border border-gray-200 p-6 w-[350px]">
                <h2 className="text-lg font-bold mb-4 text-black">Delete Document</h2>
                <p className="text-black">Are you sure you want to delete <strong>{deleteDoc?.FileName}</strong>?</p>
                <div className="flex gap-2 mt-4">
                  <button
                    className="bg-[#B10000] text-white px-4 py-2 rounded"
                    onClick={async () => {
                      if (!deleteDoc) return;
                      try {
                        setDeletingDocument(true);
                        await deleteDocument(caseId, deleteDoc.Id);
                        setDocumentation(prev => prev.filter(doc => doc.Id !== deleteDoc.Id));
                      } catch (err) {
                        console.error("Delete failed:", err);
                      } finally {
                        setDeletingDocument(false);
                        setShowDeleteModal(false);
                        setDeleteDoc(null);
                      }
                    }}
                  >
                    {deletingDocument ? "Deleting..." : "Delete"}
                  </button>
                  <button
                    className="bg-gray-300 px-4 py-2 rounded"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}