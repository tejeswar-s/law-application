// ===== VOIR DIRE PART 1 PAGE =====
// app/attorney/state/voir-dire-1/page.tsx
"use client";
import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Stepper from "../../components/Stepper";

export default function VoirDirePart1() {
  const router = useRouter();

  const handleNext = () => {
    router.push("/attorney/state/voir-dire-2");
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
              <p>These are the default Disqualifying Questions Quick Verdicts will be asking potential juror candidates.</p>
              <p>This portion of Voir Dire cannot be changed.</p>
            </div>
          </div>
        </div>
      </aside>
      <section className="flex-1 flex flex-col min-h-screen bg-[#faf8f3] px-0 md:px-0 mb-20">
        <div className="w-full max-w-6xl mx-auto px-20">
          <Stepper currentStep={3} />
        </div>
        <div className="flex-1 flex flex-col pl-28">
          <div className="w-full max-w-2xl">
            <h1 className="text-3xl font-bold text-[#16305B] mb-8 mt-2">Voir Dire - Part 1</h1>
            <div className="bg-white rounded shadow p-8 mb-6">
              <p className="mb-4 text-[#16305B] font-medium">
                Please note: This portion of Voir Dire cannot be changed.
              </p>
              <ul className="list-disc pl-6 text-[#16305B] space-y-2">
                <li>Do you know or recognize any of the parties involved in this case?</li>
                <li>Have you or a close family member ever had a dispute similar to the one in this case?</li>
                <li>Do you have any personal or financial interest in the outcome of this case?</li>
                <li>Do you have any bias, either for or against one of the parties, that could affect your ability to decide this case fairly?</li>
                <li>Is there any reason—personal, emotional, or otherwise—that would prevent you from being fair and impartial in this case?</li>
                <li>Do you have any health, time, or other personal issues that would prevent you from fully attending and completing your role as a juror in this case?</li>
                <li>Do you believe you can listen to all the evidence presented and base your decision solely on the facts and the law, regardless of personal feelings?</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="w-full bg-[#16305B] text-white font-semibold px-8 py-2 rounded-md hover:bg-[#0A2342] transition"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

