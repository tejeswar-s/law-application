"use client";
import AttorneySidebar from "@/app/attorney/components/AttorneySidebar";
import { useEffect, useState } from "react";
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

  // Voir Dire
  const [voirDire, setVoirDire] = useState<VoirDire[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newResponse, setNewResponse] = useState("");
  const [addedBy, setAddedBy] = useState("");

  // Notes
  const [notes, setNotes] = useState<string>("");

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
      name: row.name ?? row.name,
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
    console.log(file.name);

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
      <div className="flex-1 relative">
        <div
          id="war-room-content"
          className={showAddDocument || showAddTeam ? "px-10 py-8 filter blur-sm pointer-events-none" : "px-10 py-8"}
        >
          {/* TEAM SECTION */}
          <section className="mb-8 bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="font-bold text-lg text-[#363636]">Team</h2>
                <p className="text-sm text-[#6B7280]">Manage your legal team</p>
              </div>
              <button
                className="bg-[#16305B] text-white px-4 py-2 rounded-lg text-sm shadow hover:bg-[#1e417a]"
                onClick={() => setShowAddTeam(true)}
              >
                + Add Team Member
              </button>
            </div>
            <div className="divide-y">
              {teamMembers.length === 0 ? (
                <p className="text-[#6B7280] text-sm">Add/Invite legal team members to this court case.</p>
              ) : (
                teamMembers.map((member, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2">
                    <span className="text-[#16305B] underline">{member.name}</span>
                    <span className="text-[#6B7280] text-sm">{member.role}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* DOCUMENTS SECTION */}
          <section className="mb-8 bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="font-bold text-lg text-[#363636]">Documentation</h2>
                <p className="text-sm text-[#6B7280]">Upload case documents, images, videos</p>
              </div>
              <button
                className="bg-[#16305B] text-white px-4 py-2 rounded-lg text-sm shadow hover:bg-[#1e417a]"
                onClick={() => setShowAddDocument(true)}
              >
                + Add Document
              </button>
            </div>
            <div className="divide-y">
              {documentation.length === 0 ? (
                <p className="text-[#6B7280] text-sm">No documents uploaded yet.</p>
              ) : (
                documentation.map((doc, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2">
                    <div>
                      <span className="font-medium">{doc.name}</span>
                      <span className="text-[#6B7280] text-sm"> — {doc.description}</span>
                    </div>
                    <button
                      className="text-red-600 text-sm"
                      onClick={async () => {
                        if (doc.id) {
                          await deleteDocument(caseId, doc.id);
                          setDocumentation(await fetchDocuments(caseId));
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* VOIR DIRE SECTION */}
          <section className="mb-8 bg-white rounded-xl shadow p-6">
            <h2 className="font-bold text-lg text-[#363636] mb-4">Voir Dire</h2>
            <div className="space-y-3">
              {voirDire.map((item, idx) => (
                <div key={idx} className="border rounded-lg p-3">
                  <div className="font-semibold text-sm">Q: {item.question}</div>
                  <div className="text-sm mt-1">A: {item.response}</div>
                  <div className="text-xs text-gray-500 mt-1">Added by: {item.addedBy}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-2">
              <input
                className="border rounded px-2 py-1 w-full"
                placeholder="Question"
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
              />
              <input
                className="border rounded px-2 py-1 w-full"
                placeholder="Response"
                value={newResponse}
                onChange={e => setNewResponse(e.target.value)}
              />
              <input
                className="border rounded px-2 py-1 w-full"
                placeholder="Added By"
                value={addedBy}
                onChange={e => setAddedBy(e.target.value)}
              />
              <button
                className="px-4 py-2 bg-[#16305B] text-white rounded-lg shadow"
                onClick={async () => {
                  await addVoirDire(caseId, newQuestion, newResponse, addedBy);
                  setVoirDire(await fetchVoirDire(caseId));
                  setNewQuestion(""); setNewResponse(""); setAddedBy("");
                }}
              >
                Add Voir Dire
              </button>
            </div>
          </section>

          {/* NOTES SECTION */}
          <section className="mb-8 bg-white rounded-xl shadow p-6">
            <h2 className="font-bold text-lg text-[#363636] mb-2">Notes</h2>
            <textarea
              className="border rounded w-full p-3"
              rows={5}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
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
              <div className="mb-4 font-semibold text-[#363636] text-sm">
                Current Team Members: {teamMembers.length === 0 ? "None" : teamMembers.map(m => m.name).join(", ")}
              </div>
              {newMembers.map((member, idx) => (
                <div key={idx} className="mb-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="border rounded px-2 py-1 w-full mb-2"
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
                    className="border rounded px-2 py-1 w-full mb-2"
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
                    className="border rounded px-2 py-1 w-full mb-2"
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
              <input
                type="file"
                className="mb-4"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
              <textarea
                className="border rounded w-full p-2 mb-4"
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
                      await uploadDocument(caseId, file, description);
                      setDocumentation(await fetchDocuments(caseId));
                      setShowAddDocument(false);
                      setFile(null); setDescription("");
                    }
                  }}
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
