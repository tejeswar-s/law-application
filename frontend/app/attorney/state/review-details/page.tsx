"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const steps = [
    "Case Details",
    "Plaintiff Details",
    "Defendant Details",
    "Voir Dire Part 1 & 2",
    "Payment Details",
    "Review & Submit",
  ];

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
    // setSubmitted(true);
    router.push("/attorney/state/schedule-trail");
  };

  const handleBack = () => {
    router.push("/attorney/state/payment-details");
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
              <p>Review all entered details before submitting your case.</p>
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
              const isActive = idx === 5;
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
        {/* Review Details */}
        <div className="flex-1 flex flex-col pl-28">
          <div className="w-full max-w-2xl">
            <h1 className="text-3xl font-bold text-black mb-8 mt-2">
              Case Information Review
            </h1>
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
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleBack}
                className="w-1/2 bg-[#e0e6f1] text-black font-semibold px-8 py-2 rounded-md hover:bg-[#bfc6d1] transition"
                disabled={submitted}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="w-1/2 bg-[#16305B] text-white font-semibold px-8 py-2 rounded-md hover:bg-[#0A2342] transition"
                disabled={submitted}
              >
                {submitted ? "Submitted!" : "Pay & Schedule Trial"}
              </button>
            </div>
            {submitted && (
              <div className="mt-6 text-green-600 font-bold text-center text-xl">
                🎉 Case details submitted successfully!
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}