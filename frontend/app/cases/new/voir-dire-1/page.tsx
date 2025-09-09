"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Briefcase, Calendar, Bell, User, LogOut } from "lucide-react";

export default function VoirDirePart1() {
  const router = useRouter();

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
        <h1 className="text-2xl font-bold text-[#16305B] mb-2">Voir Dire - Part 1</h1>
        <p className="mb-2 text-[#16305B] font-semibold">
          These are the default Disqualifying Questions Quick Verdicts will be asking potential juror candidates.
        </p>
        <p className="mb-8 text-[#6B7280] font-semibold">
          Please note: This portion of Voir Dire cannot be changed.
        </p>
        <div className="max-w-2xl mb-8">
          <ul className="list-none space-y-4 text-[#16305B]">
            <li>Do you know or recognize any of the parties involved in this case (Johnson, Kevin Jr , Woods, Elle)?</li>
            <li>Have you or a close family member ever had a dispute similar to the one in this case?</li>
            <li>Do you have any personal or financial interest in the outcome of this case?</li>
            <li>Do you have any bias, either for or against one of the parties, that could affect your ability to decide this case fairly?</li>
            <li>Is there any reason—personal, emotional, or otherwise—that would prevent you from being fair and impartial in this case?</li>
            <li>Do you have any health, time, or other personal issues that would prevent you from paying full attention and completing your role as a juror in this case?</li>
            <li>Do you believe you can listen to all the evidence presented and base your decision solely on the facts and the law, regardless of personal feelings?</li>
          </ul>
        </div>
        <button
          className="w-full max-w-xl bg-[#16305B] text-white font-semibold px-8 py-2 rounded-md hover:bg-[#0A2342] transition"
          onClick={() => router.push("/cases/new/voir-dire-2")}
        >
          Next
        </button>
      </main>
    </div>
  );
}