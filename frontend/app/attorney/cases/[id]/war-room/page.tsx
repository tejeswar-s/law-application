"use client";
import AttorneySidebar from "@/app/attorney/components/AttorneySidebar";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type TeamMember = { name: string; role: string; email: string };
type Document = {
  id: number; name: string; description: string; fileUrl?: string 
};
type VoirDire = { question: string; response: string; addedBy: string };

type CaseData = {
  Id: number;
  PlaintiffGroups: string;
  DefendantGroups: string;
  CaseTier?: string;
};

function getFirstName(groups: string, key: "plaintiffs" | "defendants") {
  try {
    const arr = JSON.parse(groups);
    return arr[0]?.[key]?.[0]?.name || "";
  } catch {
    return "";
  }
}

const API_BASE = "http://localhost:4000/api";

export default function WarRoomPage() {
  const { id } = useParams();
  const router = useRouter();
  const caseId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";

  const [caseData, setCaseData] = useState<CaseData | null>(null);

  // Team Members
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMembers, setNewMembers] = useState<TeamMember[]>([{ name: "", role: "", email: "" }]);

  // Documents
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [documentation, setDocumentation] = useState<Document[]>([]);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  // Voir Dire
  const [voirDire, setVoirDire] = useState<VoirDire[]>([]);

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [deletingDocument, setDeletingDocument] = useState(false);

  // Fetch case data
  useEffect(() => {
    if (caseId) {
      fetch(`${API_BASE}/cases/${caseId}`)
        .then(res => res.json())
        .then(data => setCaseData(data));
    }
  }, [caseId]);

  // Fetch war room info (all types)
  useEffect(() => {
    if (caseId) {
      fetchWarRoomInfo(caseId).then(data => {
        setTeamMembers(data.TeamMembers || []);
        setDocumentation(data.Documents || []);
        setVoirDire(data.VoirDire || []);
      });
    }
  }, [caseId, showAddTeam, showAddDocument]);

  // --- API functions ---
  async function fetchWarRoomInfo(caseId: string) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/warroom-info`);
    return await res.json();
  }

  async function addTeamMembers(caseId: string, members: TeamMember[]) {
    for (const member of members) {
      await fetch(`${API_BASE}/cases/${caseId}/warroom-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamMember: member }),
      });
    }
  }

  async function uploadDocument(caseId: string, file: File, description: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("description", description);

    await fetch(`${API_BASE}/cases/${caseId}/warroom-info`, {
      method: "POST",
      body: formData,
    });
  }

  async function deleteDocument(caseId: string, docName: string) {
  const res = await fetch(
    `${API_BASE}/cases/${caseId}/warroom-info/documents/${encodeURIComponent(docName)}`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to delete document");
  }

  return await res.json();
}


  async function addVoirDire(caseId: string, question: string, response: string, addedBy: string) {
    await fetch(`${API_BASE}/cases/${caseId}/warroom-info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voirDire: { question, response, addedBy } }),
    });
  }

  // --- UI ---
  return (
    <div className="flex min-h-screen bg-[#F7F6F3]">
      <AttorneySidebar selectedSection={"home"} onSectionChange={function (section: "home" | "cases" | "calendar" | "profile" | "notifications"): void {
        throw new Error("Function not implemented.");
      } } />
      <div className="flex-1 relative">
        {/* Main Content */}
        <div className="max-w-4xl mx-auto pt-8 pb-16 px-2">
          {!caseData ? (
            <div className="flex justify-center items-center h-[400px]">
              {/* Buffer animation */}
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#16305B]"></div>
              <span className="ml-4 text-lg text-[#16305B]">Loading...</span>
            </div>
          ) : (
            <>
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
                  <button className="mt-2 bg-[#16305B] text-white px-4 py-2 rounded font-semibold shadow hover:bg-[#1e417a]">
                    Submit War Room
                  </button>
                </div>
              </div>
              <h1 className="text-2xl font-bold mt-2 mb-1 text-[#363636]">
                {getFirstName(caseData.PlaintiffGroups, "plaintiffs")} v. {getFirstName(caseData.DefendantGroups, "defendants")} War Room
              </h1>
              <div className="text-[#363636] font-semibold mb-2">Case # {caseData.Id}</div>
              <div className="mb-4 flex items-center gap-2">
                <span className="text-[#363636] text-sm font-medium">
                  Level 2 Trial Case (5 hours)
                </span>
                <button className="ml-2 px-2 py-1 bg-white border border-[#16305B] text-[#16305B] rounded text-xs font-semibold shadow">
                  Upgrade Trial Level
                </button>
              </div>

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
                        <a href="#" className="text-[#16305B] underline font-medium">{member.name}</a>
                        <span className="text-[#6B7280] text-sm">{member.role}</span>
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
                      documentation.map((doc, idx) => (
                        <tr key={doc.id ?? idx} className="border-t">
                          <td className="py-2 px-3">
                            <a href={doc.fileUrl || "#"} className="underline text-[#16305B]" target="_blank" rel="noopener noreferrer">{doc.name}</a>
                          </td>
                          <td className="py-2 px-3 italic text-[#363636]">{doc.description}</td>
                          <td className="py-2 px-3">
                            <button
                              title="Delete"
                              className="text-[#363636] hover:text-[#B10000]"
                              onClick={() => {
                                setDeleteDoc(doc);
                                setShowDeleteModal(true);
                              }}
                            >
                              <span className="material-icons">delete</span>
                            </button>
                            <button title="More" className="ml-2 text-[#363636] hover:text-[#6B7280]">
                              <span className="material-icons">more_horiz</span>
                            </button>
                          </td>
                        </tr>
                      ))
                   ) }
                  </tbody>
                </table>
                <div className="text-xs text-[#6B7280] mt-2">
                  All document files will be deleted automatically in 7 days after trial is completed.
                </div>
              </section>

              {/* Voir Dire Section */}
              <section className="mb-6">
                <div className="font-bold text-base mb-2 text-[#363636]">Voir Dire</div>
                <div className="text-sm text-[#6B7280] mb-2">
                  Manage the Voir Dire questions and review potential Juror Responses
                </div>
                <div className="bg-[#F3F4F6] px-4 py-2 rounded font-semibold flex items-center justify-between text-[#363636] border">
                  <span>Voir Dire (Disqualifier) - Juror Responses</span>
                  <span className="text-[#6B7280]">⋯</span>
                </div>
              </section>
            </>
          )}
        </div>

        {/* Modals with blur only for main section */}
        {(showAddTeam || showAddDocument || showDeleteModal) && (
          <div className="absolute inset-0 backdrop-blur-[2px] flex items-center justify-center z-50">
            {showAddTeam && (
              <div className="bg-white rounded shadow-lg border border-gray-200 p-6 w-[350px]">
                <h2 className="text-lg font-bold mb-4 text-[#16305B]">Add Team Member</h2>
                {newMembers.map((member, idx) => (
                  <div key={idx} className="mb-2">
                    <input
                      type="text"
                      placeholder="Name"
                      className="border px-2 py-1 rounded w-full mb-2 text-[#16305B] bg-white placeholder:text-[#6B7280] font-medium"
                      value={member.name}
                      onChange={e => {
                        const arr = [...newMembers];
                        arr[idx].name = e.target.value;
                        setNewMembers(arr);
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Role"
                      className="border px-2 py-1 rounded w-full mb-2 text-[#16305B] bg-white placeholder:text-[#6B7280] font-medium"
                      value={member.role}
                      onChange={e => {
                        const arr = [...newMembers];
                        arr[idx].role = e.target.value;
                        setNewMembers(arr);
                      }}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      className="border px-2 py-1 rounded w-full text-[#16305B] bg-white placeholder:text-[#6B7280] font-medium"
                      value={member.email}
                      onChange={e => {
                        const arr = [...newMembers];
                        arr[idx].email = e.target.value;
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
                      setNewMembers([{ name: "", role: "", email: "" }]);
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
                className="border px-2 py-1 rounded w-full mb-2 text-[#16305B] bg-white placeholder:text-[#6B7280] font-medium"
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

            {showDeleteModal && (
              <div className="bg-white rounded shadow-lg border border-gray-200 p-6 w-[350px]">
                <h2 className="text-lg font-bold mb-4 text-black">Delete Document</h2>
                <p className="text-black">Are you sure you want to delete <strong>{deleteDoc?.name}</strong>?</p>
                <div className="flex gap-2 mt-4">
                  <button
                    className="bg-[#B10000] text-white px-4 py-2 rounded"
                    onClick={async () => {
                        if (!deleteDoc) return;
                        try {
                          setDeletingDocument(true);
                          await deleteDocument(caseId, deleteDoc.name); // <-- actual API call
                          setDocumentation(prev => prev.filter(doc => doc.name !== deleteDoc.name)); // update UI
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
