"use client";
import AttorneySidebar from "@/app/attorney/components/AttorneySidebar";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

type TeamMember = { name: string; role: string; email: string };
type Document = { id?: number; name: string; description: string; fileUrl?: string; type?: string };
type VoirDire = { id?: number; question: string; response: string; addedBy: string };

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

  // Fetch war room data
  useEffect(() => {
    if (caseId) {
      fetchTeamMembers(caseId).then(setTeamMembers);
      fetchDocuments(caseId).then(setDocumentation);
      fetchVoirDire(caseId).then(setVoirDire);
    }
  }, [caseId, showAddTeam, showAddDocument]);

  if (!caseData) return <div className="p-8">Loading...</div>;

  const plaintiff = getFirstName(caseData.PlaintiffGroups, "plaintiffs");
  const defendant = getFirstName(caseData.DefendantGroups, "defendants");

  // --- API functions ---
  async function fetchTeamMembers(caseId: string): Promise<TeamMember[]> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/team`);
    const data = await res.json();
    const rows = data.recordset ?? data;
    return rows.map((row: any) => ({
      name: row.Name ?? row.name ?? "",
      role: row.Role ?? row.role ?? "",
      email: row.Email ?? row.email ?? "",
    }));
  }

  async function addTeamMembers(caseId: string, members: TeamMember[]) {
    for (const member of members) {
      await fetch(`${API_BASE}/cases/${caseId}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member),
      });
    }
  }

  async function fetchDocuments(caseId: string): Promise<Document[]> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/documents`);
    const data = await res.json();
    const rows = data.recordset ?? data;
    return rows.map((row: any) => ({
      id: row.Id ?? row.id,
      name: row.Name ?? row.name,
      description: row.Description ?? row.description,
      fileUrl: row.FileUrl ?? row.fileUrl,
      type: row.Type ?? row.type,
    }));
  }

  async function uploadDocument(caseId: string, file: File, description: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", file.type.startsWith("image") ? "image" : file.type.startsWith("video") ? "video" : "document");
    formData.append("description", description);
    formData.append("name", file.name);

    await fetch(`${API_BASE}/cases/${caseId}/documents`, {
      method: "POST",
      body: formData,
    });
  }

  async function deleteDocument(caseId: string, docId: number) {
    await fetch(`${API_BASE}/cases/${caseId}/documents/${docId}`, {
      method: "DELETE",
    });
  }

  async function fetchVoirDire(caseId: string): Promise<VoirDire[]> {
    const res = await fetch(`${API_BASE}/cases/${caseId}/voir-dire`);
    const data = await res.json();
    const rows = data.recordset ?? data;
    return rows.map((row: any) => ({
      id: row.Id ?? row.id,
      question: row.Question ?? row.question,
      response: row.Response ?? row.response,
      addedBy: row.AddedBy ?? row.addedBy,
    }));
  }

  async function addVoirDire(caseId: string, question: string, response: string, addedBy: string) {
    await fetch(`${API_BASE}/cases/${caseId}/voir-dire`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, response, addedBy }),
    });
  }

  // --- UI ---
  return (
    <div className="flex min-h-screen bg-[#F7F6F3]">
      <AttorneySidebar />
      <div className="flex-1 px-0 py-0">
        <div className="max-w-4xl mx-auto pt-8 pb-16 px-2">
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
            {plaintiff} v. {defendant} War Room
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
                )}
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
        </div>

        {/* Overlay Popup: Add Team Member */}
        {showAddTeam && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
            <div className="bg-white rounded-xl shadow-lg p-8 w-[400px] relative">
              <h2 className="font-bold text-lg mb-2">Add Team Member</h2>
              <div className="mb-2 text-[#363636]">
                Would you like to add team members to the <span className="font-bold">{plaintiff} v. {defendant}</span> case?
              </div>
              
              {newMembers.map((member, idx) => (
                <div key={idx} className="mb-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="border rounded px-2 py-1 w-full mb-2 text-black"
                    value={member.name}
                    onChange={e => {
                      const arr = [...newMembers];
                      arr[idx].name = e.target.value;
                      setNewMembers(arr);
                    }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Job Title"
                    className="border rounded px-2 py-1 w-full mb-2 text-black"
                    value={member.role}
                    onChange={e => {
                      const arr = [...newMembers];
                      arr[idx].role = e.target.value;
                      setNewMembers(arr);
                    }}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="border rounded px-2 py-1 w-full mb-2 text-black"
                    value={member.email}
                    onChange={e => {
                      const arr = [...newMembers];
                      arr[idx].email = e.target.value;
                      setNewMembers(arr);
                    }}
                    required
                  />
                </div>
              ))}
              <button
                className="text-[#16305B] flex items-center gap-2 mb-4"
                onClick={() => setNewMembers([...newMembers, { name: "", role: "", email: "" }])}
              >
                + Add More Team Members
              </button>
              <div className="flex justify-between">
                <button
                  className="px-4 py-2 rounded bg-gray-200"
                  onClick={() => {
                    setShowAddTeam(false);
                    setNewMembers([{ name: "", role: "", email: "" }]);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-[#16305B] text-white font-semibold"
                  onClick={async () => {
                    await addTeamMembers(caseId, newMembers);
                    setTeamMembers(await fetchTeamMembers(caseId));
                    setShowAddTeam(false);
                    setNewMembers([{ name: "", role: "", email: "" }]);
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Overlay Popup: Add Document */}
        {showAddDocument && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
            <div className="bg-white rounded-xl shadow-lg p-8 w-[400px] relative">
              <h2 className="font-bold text-lg mb-4">Upload Document</h2>
              {uploadingDocument ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#16305B] mb-2"></div>
                  <span className="text-[#16305B] font-semibold">Uploading...</span>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    className="mb-4 text-black"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                  />
                  <textarea
                    className="border rounded w-full p-2 mb-4 text-black"
                    rows={3}
                    placeholder="Description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                  <div className="flex justify-between">
                    <button
                      className="px-4 py-2 rounded bg-gray-200"
                      onClick={() => {
                        setShowAddDocument(false);
                        setFile(null); setDescription("");
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 rounded bg-[#16305B] text-white font-semibold"
                      onClick={async () => {
                        if (file) {
                          setUploadingDocument(true);
                          await uploadDocument(caseId, file, description);
                          setDocumentation(await fetchDocuments(caseId));
                          setUploadingDocument(false);
                          setShowAddDocument(false);
                          setFile(null); setDescription("");
                        }
                      }}
                    >
                      Upload
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deleteDoc && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
            <div className="bg-white rounded-xl shadow-lg p-8 w-[400px] relative">
              <button
                className="absolute top-2 right-2 text-[#363636] text-xl"
                onClick={() => setShowDeleteModal(false)}
                aria-label="Close"
                disabled={deletingDocument}
              >
                &times;
              </button>
              <div className="flex items-center mb-4">
                <span className="material-icons text-[#B10000] mr-2">delete</span>
                <span className="font-bold text-lg">Delete File?</span>
              </div>
              <div className="mb-4 text-[#363636]">
                Are you sure you want to delete the following file?
              </div>
              <div className="mb-6">
                <a
                  href={deleteDoc.fileUrl || "#"}
                  className="underline text-[#16305B] font-semibold"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {deleteDoc.name}
                </a>
              </div>
              {deletingDocument ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#16305B] mb-2"></div>
                  <span className="text-[#16305B] font-semibold">Deleting...</span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <button
                    className="px-4 py-2 rounded bg-gray-200"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded bg-[#16305B] text-white font-semibold"
                    onClick={async () => {
                      if (deleteDoc?.id) {
                        setDeletingDocument(true);
                        await deleteDocument(caseId, deleteDoc.id);
                        setDocumentation(await fetchDocuments(caseId));
                        setDeletingDocument(false);
                        setShowDeleteModal(false);
                        setDeleteDoc(null);
                      }
                    }}
                  >
                    Yes, continue to delete
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
