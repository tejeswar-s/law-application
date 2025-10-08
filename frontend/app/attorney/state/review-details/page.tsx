
// ===== REVIEW PAGE =====
// app/attorney/state/review-details/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Stepper from "../../components/Stepper";

export default function ReviewPage() {
  const [form, setForm] = useState({
    county: "",
    caseType: "",
    caseTier: "",
    caseDescription: "",
    paymentMethod: "",
    paymentAmount: "",
  });
  const [plaintiffGroups, setPlaintiffGroups] = useState<any[]>([]);
  const [defendantGroups, setDefendantGroups] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    setForm({
      county: localStorage.getItem("county") || "",
      caseType: localStorage.getItem("caseType") || "",
      caseTier: localStorage.getItem("caseTier") || "",
      caseDescription: localStorage.getItem("caseDescription") || "",
      paymentMethod: localStorage.getItem("paymentMethod") || "",
      paymentAmount: localStorage.getItem("paymentAmount") || "",
    });
    setPlaintiffGroups(JSON.parse(localStorage.getItem("plaintiffGroups") || "[]"));
    setDefendantGroups(JSON.parse(localStorage.getItem("defendantGroups") || "[]"));
  }, []);

  const handleSubmit = () => {
    router.push("/attorney/state/schedule-trail");
  };

  return (
    <div className="min-h-screen flex bg-[#faf8f3] font-sans">
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
              <p>Review all entered details before submitting your case.</p>
            </div>
          </div>
        </div>
      </aside>
      <section className="flex-1 flex flex-col min-h-screen bg-[#faf8f3] px-0 md:px-0 mb-20">
        <div className="w-full max-w-6xl mx-auto px-20">
          <Stepper currentStep={5} />
        </div>
        <div className="flex-1 flex flex-col pl-28">
          <div className="w-full max-w-2xl">
            <h1 className="text-3xl font-bold text-black mb-8 mt-2">Case Information Review</h1>
            <div className="bg-white border border-[#bfc6d1] rounded-lg p-8 mb-8 shadow text-black">
              <p className="mb-2 font-semibold">Please review the information before submitting.</p>
              <div className="mb-4">
                <strong>County:</strong> {form.county}
              </div>
              <div className="mb-4">
                <strong>Type of Case:</strong> {form.caseType}
              </div>
              <div className="mb-4">
                <strong>Tier Level:</strong> {form.caseTier}
              </div>
              <div className="mb-4">
                <strong>Case Description:</strong>
                <div className="mt-1">{form.caseDescription}</div>
              </div>
              <div className="mb-4">
                <strong>Plaintiff Details:</strong>
                <ul className="list-disc pl-6 mt-1">
                  {plaintiffGroups.map((group, gIdx) =>
                    group.plaintiffs.map((p: any, pIdx: number) => (
                      <li key={`p-${gIdx}-${pIdx}`}>
                        Plaintiff #{pIdx + 1}: {p.name || "None"} {p.email && `(${p.email})`}
                      </li>
                    ))
                  )}
                  {plaintiffGroups.map((group, gIdx) =>
                    group.reps?.map((rep: any, rIdx: number) => (
                      <li key={`pr-${gIdx}-${rIdx}`}>
                        Mock Legal Representation: {rep.name} {rep.email && `(${rep.email})`}
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div className="mb-4">
                <strong>Defendant Details:</strong>
                <ul className="list-disc pl-6 mt-1">
                  {defendantGroups.map((group, gIdx) =>
                    group.defendants.map((d: any, dIdx: number) => (
                      <li key={`d-${gIdx}-${dIdx}`}>
                        Defendant #{dIdx + 1}: {d.name || "None"} {d.email && `(${d.email})`}
                      </li>
                    ))
                  )}
                  {defendantGroups.map((group, gIdx) =>
                    group.reps?.map((rep: any, rIdx: number) => (
                      <li key={`dr-${gIdx}-${rIdx}`}>
                        Mock Legal Representation: {rep.name} {rep.email && `(${rep.email})`}
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div className="mb-4">
                <strong>Payment Method:</strong> {form.paymentMethod}
              </div>
              <div className="mb-4">
                <strong>Payment Amount:</strong> {form.paymentAmount}
              </div>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full bg-[#16305B] text-white font-semibold px-8 py-2 rounded-md hover:bg-[#0A2342] transition"
            >
              Pay & Schedule Trial
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}