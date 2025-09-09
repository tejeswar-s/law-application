"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Briefcase, Calendar, Bell, User, LogOut, Info, PlusCircle } from "lucide-react";
import { useState } from "react";

export default function PlaintiffDetails() {
  const router = useRouter();
  const [form, setForm] = useState({
    mockLegalRep: "",
    mockLegalRepEmail: "",
    plaintiffName: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full border-2 border-[#16305B] flex items-center justify-center bg-white text-[#16305B] font-bold">2</span>
            <span className="font-semibold text-[#16305B]">Plaintiff Details</span>
          </div>
          <span className="h-1 w-8 bg-[#e0e6f1] rounded"></span>
          <span className="text-[#6B7280]">Defendant Details</span>
          <span className="h-1 w-8 bg-[#e0e6f1] rounded"></span>
          <span className="text-[#6B7280]">Voir Dire Part 1 & 2</span>
          <span className="h-1 w-8 bg-[#e0e6f1] rounded"></span>
          <span className="text-[#6B7280]">Payment</span>
          <span className="h-1 w-8 bg-[#e0e6f1] rounded"></span>
          <span className="text-[#6B7280]">Review</span>
          <span className="h-1 w-8 bg-[#e0e6f1] rounded"></span>
          <span className="text-[#6B7280]">Schedule</span>
        </div>

        <h1 className="text-2xl font-bold text-[#16305B] mb-2">Plaintiff Details</h1>
        <p className="mb-8 text-[#6B7280] text-base">Fill in Plaintiff details for this case.</p>

        <div className="max-w-2xl">
          <div className="bg-white rounded shadow p-8 mb-6">
            <h2 className="text-lg font-bold text-[#16305B] mb-4">Plaintiff Group #1</h2>
            {/* Mock Legal Representation */}
            <div className="mb-4">
              <label className="block font-medium text-[#16305B] mb-1 flex items-center gap-1">
                Mock Legal Representation <span className="text-red-500">*</span>
                <Info size={16} className="text-[#bfc6d1]" title="Info" />
              </label>
              <input
                type="text"
                name="mockLegalRep"
                value={form.mockLegalRep}
                onChange={handleChange}
                className="w-full border border-[#bfc6d1] rounded px-4 py-2 bg-white text-[#16305B] focus:outline-[#16305B]"
                placeholder="Mock Legal Representation"
                required
              />
            </div>
            {/* Mock Legal Representation Email */}
            <div className="mb-4">
              <label className="block font-medium text-[#16305B] mb-1">
                Mock Legal Representation Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="mockLegalRepEmail"
                value={form.mockLegalRepEmail}
                onChange={handleChange}
                className="w-full border border-[#bfc6d1] rounded px-4 py-2 bg-white text-[#16305B] focus:outline-[#16305B]"
                placeholder="Mock Legal Representation Email"
                required
              />
            </div>
            <button
              type="button"
              className="flex items-center gap-2 text-[#16305B] font-medium mb-6"
              // onClick={...}
            >
              <PlusCircle size={18} /> Add Mock Legal Representation
            </button>
            {/* Plaintiff Name #1 */}
            <div className="mb-4">
              <label className="block font-medium text-[#16305B] mb-1">
                Plaintiff Name #1 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="plaintiffName"
                value={form.plaintiffName}
                onChange={handleChange}
                className="w-full border border-[#bfc6d1] rounded px-4 py-2 bg-white text-[#16305B] focus:outline-[#16305B]"
                placeholder="Plaintiff Name #1 (First Name, Middle Name, Last Name)"
                required
              />
            </div>
            <button
              type="button"
              className="flex items-center gap-2 text-[#16305B] font-medium"
              // onClick={...}
            >
              <PlusCircle size={18} /> Add Plaintiff
            </button>
          </div>
          <button
            type="button"
            className="w-full border border-[#bfc6d1] rounded py-3 mb-8 flex items-center justify-center gap-2 bg-white text-[#16305B] font-medium"
            // onClick={...}
          >
            <PlusCircle size={18} /> Add Another Plaintiff Group
          </button>
          <button
            type="submit"
            className="w-full bg-[#16305B] text-white font-semibold px-8 py-2 rounded-md hover:bg-[#0A2342] transition"
          >
            Next
          </button>
        </div>
      </main>
    </div>
  );
}