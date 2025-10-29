"use client";

import { useState, useEffect } from "react";
import { PlusIcon, TrashIcon, UserIcon } from "@heroicons/react/24/outline";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")
  : "http://localhost:4000";

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
}

type Witness = {
  WitnessId?: number;
  name: string;
  side: "Plaintiff" | "Defendant";
  description: string;
};

export default function WitnessSection({ caseId }: { caseId: string }) {
  const [witnesses, setWitnesses] = useState<Witness[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWitnesses();
  }, [caseId]);

  const fetchWitnesses = async () => {
    try {
      const token = getCookie("token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE}/api/cases/${caseId}/witnesses`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.witnesses.length > 0) {
          setWitnesses(
            data.witnesses.map((w: any) => ({
              WitnessId: w.WitnessId,
              name: w.WitnessName,
              side: w.Side,
              description: w.Description || "",
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error fetching witnesses:", error);
    }
  };

  const addWitness = () => {
    setWitnesses([
      ...witnesses,
      { name: "", side: "Plaintiff", description: "" },
    ]);
  };

  const removeWitness = (index: number) => {
    setWitnesses(witnesses.filter((_, i) => i !== index));
  };

  const updateWitness = (index: number, field: keyof Witness, value: string) => {
    const updated = [...witnesses];
    updated[index] = { ...updated[index], [field]: value };
    setWitnesses(updated);
  };

  const saveWitnesses = async () => {
    // Validate
    const hasEmpty = witnesses.some((w) => !w.name.trim());
    if (hasEmpty) {
      setError("Please fill in all witness names before saving");
      return;
    }

    setLoading(true);
    setSaved(false);
    setError("");

    try {
      const token = getCookie("token");
      const response = await fetch(`${API_BASE}/api/cases/${caseId}/witnesses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ witnesses }),
      });

      if (response.ok) {
        setSaved(true);
        fetchWitnesses();
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to save witnesses");
      }
    } catch (error) {
      console.error("Error saving witnesses:", error);
      setError("Failed to save witnesses");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <UserIcon className="h-6 w-6 text-[#0C2D57] mr-3" />
          <div>
            <h2 className="text-xl font-semibold text-[#0C2D57]">Witnesses for Credibility Evaluation</h2>
            <p className="text-sm text-gray-600 mt-1">
              Add witnesses that jurors should evaluate for credibility during trial
            </p>
          </div>
        </div>
        <button
          onClick={addWitness}
          className="flex items-center px-4 py-2 bg-[#0C2D57] text-white rounded-lg hover:bg-[#0a2347] transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Witness
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {witnesses.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-lg font-medium">No witnesses added yet</p>
          <p className="text-sm mt-1">
            Click "Add Witness" to add witnesses for credibility evaluation
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {witnesses.map((witness, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Witness Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={witness.name}
                    onChange={(e) => updateWitness(index, "name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2D57] text-gray-900"
                    placeholder="e.g., Dr. Marcus Delaney"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Side <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={witness.side}
                    onChange={(e) =>
                      updateWitness(index, "side", e.target.value as "Plaintiff" | "Defendant")
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2D57] text-gray-900"
                  >
                    <option value="Plaintiff">Plaintiff Witness</option>
                    <option value="Defendant">Defendant Witness</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description / Role
                  </label>
                  <textarea
                    value={witness.description}
                    onChange={(e) => updateWitness(index, "description", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2D57] text-gray-900"
                    placeholder="Brief description of witness testimony or role"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => removeWitness(index)}
                  className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
        {saved && (
          <span className="text-green-600 text-sm font-medium flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Witnesses saved successfully
          </span>
        )}
        <div className="ml-auto">
          <button
            onClick={saveWitnesses}
            disabled={loading || witnesses.length === 0}
            className="px-6 py-2 bg-[#0C2D57] text-white rounded-lg hover:bg-[#0a2347] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Saving..." : "Save Witnesses"}
          </button>
        </div>
      </div>
    </div>
  );
}