"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function VoirDirePart2() {
  const [questions, setQuestions] = useState<string[]>([""]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const router = useRouter();

  const steps = [
    "Case Details",
    "Plaintiff Details",
    "Defendant Details",
    "Voir Dire Part 1 & 2",
    "Payment Details",
    "Review & Submit",
  ];

  const handleChange = (idx: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[idx] = value;
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, ""]);
  };

  const validate = () => {
    const errors = questions.map(q => q.trim() ? "" : "Required");
    setValidationErrors(errors);
    return errors.every(e => !e);
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    localStorage.setItem("voirDireQuestions", JSON.stringify(questions));
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
              <p>Fill in Voir Dire disqualifier questions.</p>
              <p>Voir Dire must be written out as a "Yes / No answer" question.</p>
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
              const isActive = idx === 3;
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
        <div className="flex-1 flex flex-col pl-28">
          <div className="w-full max-w-2xl">
            <h1 className="text-3xl font-bold text-[#16305B] mb-8 mt-2">
              Voir Dire - Part 2
            </h1>
            <form className="space-y-6" onSubmit={handleNext}>
              {questions.map((q, idx) => (
                <div key={idx} className="mb-4">
                  <label className="block mb-1 text-[#16305B] font-medium">
                    Voir Dire #{idx + 1} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={q}
                    onChange={e => handleChange(idx, e.target.value)}
                    placeholder='Write out Voir Dire as a "Yes / No answer" question.'
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  />
                  {validationErrors[idx] && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors[idx]}</p>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addQuestion}
                className="text-[#16305B] text-sm font-medium mb-4"
              >
                + Add Another Voir Dire Question
              </button>
              <button
                type="submit"
                className="w-full bg-[#16305B] text-white font-semibold px-8 py-2 rounded-md hover:bg-[#0A2342] transition"
              >
                Next
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}