"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Defendant = {
  name: string;
  email: string;
};

type DefendantGroup = {
  reps: Defendant[];
  defendants: Defendant[];
};

export default function DefendantDetailsPage() {
  const [groups, setGroups] = useState<DefendantGroup[]>([
    { reps: [{ name: "", email: "" }], defendants: [{ name: "", email: "" }] },
  ]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const steps = [
  "Case Details",
  "Plaintiff Details",
  "Defendant Details",
  "Voir Dire Part 1 & 2",
  "Payment Details",
  "Review & Submit",
];
  const validate = () => {
    const errors: Record<string, string> = {};
    groups.forEach((group, gIdx) => {
      group.reps.forEach((rep, rIdx) => {
        if (!rep.name.trim()) errors[`repName-${gIdx}-${rIdx}`] = "Rep name is required";
        if (!rep.email.trim()) errors[`repEmail-${gIdx}-${rIdx}`] = "Rep email is required";
      });
      group.defendants.forEach((d, dIdx) => {
        if (!d.name.trim()) errors[`defendantName-${gIdx}-${dIdx}`] = "Defendant name is required";
      });
    });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    localStorage.setItem("defendantGroups", JSON.stringify(groups));
    router.push("/attorney/state/voir-dire-1");
  };

  const updateField = (
    gIdx: number,
    type: "reps" | "defendants",
    idx: number,
    field: "name" | "email",
    value: string
  ) => {
    const newGroups = [...groups];
    (newGroups[gIdx][type] as Defendant[])[idx][field] = value;
    setGroups(newGroups);
  };

  const addRep = (gIdx: number) => {
    const newGroups = [...groups];
    newGroups[gIdx].reps.push({ name: "", email: "" });
    setGroups(newGroups);
  };

  const addDefendant = (gIdx: number) => {
    const newGroups = [...groups];
    newGroups[gIdx].defendants.push({ name: "", email: "" });
    setGroups(newGroups);
  };

  const addGroup = () => {
    setGroups([...groups, { reps: [{ name: "", email: "" }], defendants: [{ name: "", email: "" }] }]);
  };

  const removeDefendant = (gIdx: number, dIdx: number) => {
    const newGroups = [...groups];
    newGroups[gIdx].defendants.splice(dIdx, 1);
    setGroups(newGroups);
  };

  const removeGroup = (gIdx: number) => {
    if (groups.length === 1) return; // Prevent removing the last group
    const newGroups = [...groups];
    newGroups.splice(gIdx, 1);
    setGroups(newGroups);
  };

  return (
    <div className="min-h-screen flex bg-[#faf8f3] font-sans">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-[265px]">
        <div className="flex-1 text-white bg-[#16305B] relative">
          <div className="absolute top-15 left-0 w-full">
            <Image
              src="/logo_sidebar_signup.png"
              alt="Quick Verdicts Logo"
              width={300}
              height={120}
              className="w-full object-cover"
              priority
            />
          </div>
          <div className="px-8 py-8 mt-30">
            <h2 className="text-3xl font-medium mb-4">New Case</h2>
            <div className="text-sm leading-relaxed text-blue-100 space-y-3">
              <p>Please fill out the following fields with the necessary information.</p>
              <p>Any with * is required.</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <section className="flex-1 flex flex-col min-h-screen bg-[#faf8f3] px-0 md:px-0 mb-20">
        <div className="w-full max-w-6xl mx-auto px-20">
          {/* Stepper */}
          <div className="flex items-center justify-between px-8 pb-8 pt-8">
            {steps.map((label, idx) => {
              const isActive = idx === 2;
              return (
                <div key={label} className="flex items-center flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                        ${isActive ? "border-[#16305B]" : "border-[#bfc6d1] bg-transparent"}
                      `}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-[#16305B]" : "bg-transparent"}`}></span>
                    </div>
                    <span className={`text-xs leading-tight max-w-[90px] ${isActive ? "text-[#16305B] font-semibold" : "text-[#bfc6d1]"}`}>
                      {label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="flex-1 h-[1px] bg-[#bfc6d1] ml-4 mr-4"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Defendant Details Form */}
        <div className="flex-1 flex flex-col pl-28">
          <div className="w-full max-w-2xl">
            <h1 className="text-3xl font-bold text-[#16305B] mb-8 mt-2">
              Defendant Details
            </h1>
            <form className="space-y-6" onSubmit={handleNext}>
              {groups.map((group, gIdx) => (
                <div key={gIdx} className="p-4 border rounded-md bg-white space-y-4 relative">
                  <h2 className="text-lg font-semibold text-[#16305B]">
                    Defendant Group #{gIdx + 1}
                  </h2>
                  {groups.length > 1 && (
                    <button
                      type="button"
                      className="absolute top-2 right-2 text-red-500 px-2 py-1"
                      onClick={() => removeGroup(gIdx)}
                      title="Remove Group"
                    >
                      ✕
                    </button>
                  )}

                  {/* Mock Legal Representatives */}
                  {group.reps.map((rep, rIdx) => (
                    <div key={rIdx} className="space-y-2">
                      <input
                        type="text"
                        placeholder="Mock Legal Representation"
                        value={rep.name}
                        onChange={e => updateField(gIdx, "reps", rIdx, "name", e.target.value)}
                        className="w-full px-4 py-2 border border-[#bfc6d1] text-[#16305B] rounded-md"
                      />
                      {validationErrors[`repName-${gIdx}-${rIdx}`] && (
                        <p className="text-red-500 text-sm">
                          {validationErrors[`repName-${gIdx}-${rIdx}`]}
                        </p>
                      )}
                      <input
                        type="email"
                        placeholder="Mock Legal Representation Email"
                        value={rep.email}
                        onChange={e => updateField(gIdx, "reps", rIdx, "email", e.target.value)}
                        className="w-full px-4 py-2 border border-[#bfc6d1] text-[#16305B] rounded-md"
                      />
                      {validationErrors[`repEmail-${gIdx}-${rIdx}`] && (
                        <p className="text-red-500 text-sm">
                          {validationErrors[`repEmail-${gIdx}-${rIdx}`]}
                        </p>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addRep(gIdx)}
                    className="text-[#16305B] text-sm font-medium"
                  >
                    + Add Mock Legal Representation
                  </button>

                  {/* Defendants */}
                  {group.defendants.map((d, dIdx) => (
                    <div key={dIdx} className="space-y-2 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={`Defendant Name #${dIdx + 1}`}
                        value={d.name}
                        onChange={e => updateField(gIdx, "defendants", dIdx, "name", e.target.value)}
                        className="w-full px-4 py-2 border border-[#bfc6d1] text-[#16305B] rounded-md"
                      />
                      {group.defendants.length > 1 && (
                        <button
                          type="button"
                          className="text-red-500 px-2 py-1"
                          onClick={() => removeDefendant(gIdx, dIdx)}
                          title="Remove"
                        >
                          ✕
                        </button>
                      )}
                      {validationErrors[`defendantName-${gIdx}-${dIdx}`] && (
                        <p className="text-red-500 text-sm">
                          {validationErrors[`defendantName-${gIdx}-${dIdx}`]}
                        </p>
                      )}
                      <input
                        type="email"
                        placeholder={`Defendant Email #${dIdx + 1}`}
                        value={d.email}
                        onChange={e => updateField(gIdx, "defendants", dIdx, "email", e.target.value)}
                        className="w-full px-4 py-2 border border-[#bfc6d1]  text-[#16305B] rounded-md"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addDefendant(gIdx)}
                    className="text-[#16305B] text-sm font-medium"
                  >
                    + Add Defendant
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addGroup}
                className="w-full border border-[#16305B] text-[#16305B] py-2 rounded-md font-medium"
              >
                + Add Another Defendant Group
              </button>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#16305B] text-white font-semibold px-8 py-2 rounded-md hover:bg-[#0A2342] transition"
                >
                  Next
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
