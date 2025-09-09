"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Briefcase, Calendar, Bell, User, LogOut, PlusCircle } from "lucide-react";
import { useState } from "react";

export default function VoirDirePart2() {
  const router = useRouter();
  const [questions, setQuestions] = useState(() => {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("case_voir_dire");
      if (saved) return JSON.parse(saved);
    }
    return [""];
  });

  const handleChange = (idx: number, value: string) => {
    setQuestions(qs => {
      const updated = qs.map((q, i) => (i === idx ? value : q));
      if (typeof window !== "undefined") {
        localStorage.setItem("case_voir_dire", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const addQuestion = () => {
    setQuestions(qs => {
      const updated = [...qs, ""];
      if (typeof window !== "undefined") {
        localStorage.setItem("case_voir_dire", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("case_voir_dire", JSON.stringify(questions));
    }
    router.push("/cases/new/payment");
  };

  return (
    <div className="min-h-screen flex bg-[#F7F6F3] font-sans">
      {/* Sidebar */}
      <aside className="w-[260px] bg-[#16305B] text-white flex flex-col justify-between py-6 px-4">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <img src="/logo.png" alt="Quick Verdicts" className="h-8 w-8" />
            <span className="font-bold text-lg tracking-wide">QUICK VERDICTS</span>
          </div>
          <nav className="flex flex-col gap-2">
            <Link href="/profile" className="flex items-center gap-2 py-2 px-3 rounded hover:bg-[#1e417a]">
              <User size={18} /> Profile
            </Link>
            <Link href="/notifications" className="flex items-center gap-2 py-2 px-3 rounded hover:bg-[#1e417a]">
              <Bell size={18} /> Notifications
            </Link>
            <div className="mt-6 mb-2 text-xs text-[#e0e6f1] uppercase tracking-wide">Main</div>
            <Link href="/attorney" className="flex items-center gap-2 py-2 px-3 rounded hover:bg-[#1e417a]">
              <Home size={18} /> Home
            </Link>
            <Link href="/cases" className="flex items-center gap-2 py-2 px-3 rounded bg-[#F7F6F3] text-[#16305B] font-semibold">
              <Briefcase size={18} /> Cases
            </Link>
            <Link href="/calendar" className="flex items-center gap-2 py-2 px-3 rounded hover:bg-[#1e417a]">
              <Calendar size={18} /> Calendar
            </Link>
          </nav>
        </div>
        <div>
          <Link href="/logout" className="flex items-center gap-2 py-2 px-3 rounded hover:bg-[#1e417a]">
            <LogOut size={18} /> <span>Sign Out</span>
          </Link>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 px-10 py-8">
        {/* Top bar */}
        <div className="flex items-center mb-6">
          <button
            className="text-[#16305B] font-medium hover:underline mr-4"
            onClick={() => router.back()}
          >
            &larr; Back
          </button>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[#16305B] font-medium">Help</span>
          </div>
        </div>
        {/* Stepper */}
        <div className="flex items-center gap-6 mb-8">
          <span className="text-[#6B7280]">Case Details</span>
          <span className="h-1 w-8 bg-[#e0e6f1] rounded"></span>
          <span className="text-[#6B7280]">Plaintiff Details</span>
          <span className="h-1 w-8 bg-[#e0e6f1] rounded"></span>
          <span className="text-[#6B7280]">Defendant Details</span>
          <span className="h-1 w-8 bg-[#e0e6f1] rounded"></span>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full border-2 border-[#16305B] flex items-center justify-center bg-white text-[#16305B] font-bold">4</span>
            <span className="font-semibold text-[#16305B]">Voir Dire Part 1 & 2</span>
          </div>
          <span className="h-1 w-8 bg-[#e0e6f1] rounded"></span>
          <span className="text-[#6B7280]">Payment</span>
          <span className="h-1 w-8 bg-[#e0e6f1] rounded"></span>
          <span className="text-[#6B7280]">Review</span>
          <span className="h-1 w-8 bg-[#e0e6f1] rounded"></span>
          <span className="text-[#6B7280]">Schedule</span>
        </div>
        <h1 className="text-2xl font-bold text-[#16305B] mb-2">Voir Dire - Part 2</h1>
        <p className="mb-2 text-[#16305B] font-semibold">
          Fill in Voir Dire disqualifier questions.
        </p>
        <p className="mb-8 text-[#6B7280] font-semibold">
          Please note: Voir Dire must be written out as a "Yes / No answer" question.
        </p>
        <form className="max-w-2xl" onSubmit={handleNext}>
          {questions.map((q, idx) => (
            <div key={idx} className="mb-4">
              <label className="block font-medium text-[#16305B] mb-1">
                Voir Dire #{idx + 1} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={q}
                onChange={e => handleChange(idx, e.target.value)}
                className="w-full border border-[#bfc6d1] rounded px-4 py-2 bg-white text-[#16305B] focus:outline-[#16305B]"
                placeholder='Write out Voir Dire as a "Yes / No answer" question.'
                required
              />
            </div>
          ))}
          <button
            type="button"
            className="w-full border border-[#bfc6d1] rounded py-3 mb-8 flex items-center justify-center gap-2 bg-white text-[#16305B] font-medium"
            onClick={addQuestion}
          >
            <PlusCircle size={18} /> Add Another Voir Dire Question
          </button>
          <button
            type="submit"
            className="w-full bg-[#16305B] text-white font-semibold px-8 py-2 rounded-md hover:bg-[#0A2342] transition"
          >
            Next
          </button>
        </form>
      </main>
    </div>
  );
}