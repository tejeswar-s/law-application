// ===== CASE TYPE PAGE (FIRST PAGE) =====
// app/attorney/case-type/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function CaseTypePage() {
  const router = useRouter();
  const [selected, setSelected] = useState("");

  // Clear all previous case data when this page loads
  useEffect(() => {
    const keysToRemove = [
      "caseTypeSelection",
      "state",
      "county",
      "caseType",
      "caseTier",
      "caseDescription",
      "plaintiffGroups",
      "defendantGroups",
      "voirDire2Questions",
      "paymentMethod",
      "paymentAmount",
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log("✅ Previous case data cleared");
  }, []);

  const handleSelect = (type: string) => {
    setSelected(type);
    localStorage.setItem("caseTypeSelection", type);
    setTimeout(() => {
      router.push("/attorney/state/case-details");
    }, 300);
  };

  const handleBack = () => {
    router.push("/attorney");
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
      <section className="flex-1 flex flex-col min-h-screen px-0 md:px-0 mb-20">
        {/* Back Button */}
        <div className="w-full max-w-6xl mx-auto px-20 pt-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="font-medium">Back</span>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center mt-20">
          <h1 className="text-3xl font-bold text-[#16305B] mb-4">Case Type</h1>
          <p className="mb-8 text-gray-700">Please select which type of case you are filing for.</p>
          <div className="flex gap-12">
            <button
              className={`bg-[#f5ecd7] ml-10 px-10 py-8 rounded shadow text-2xl font-bold text-[#16305B] border-2 ${selected === "state" ? "border-[#16305B]" : "border-transparent"}`}
              onClick={() => handleSelect("state")}
            >
              State
              <div className="mt-2 text-base font-normal text-[#16305B]">
                Cases involving state laws such as family disputes, contracts, property, and most crimes.
              </div>
            </button>
            <button
              className={`bg-[#f5ecd7] mr-10 px-10 py-8 rounded shadow text-2xl font-bold text-[#16305B] border-2 ${selected === "federal" ? "border-[#16305B]" : "border-transparent"}`}
              onClick={() => handleSelect("federal")}
            >
              Federal
              <div className="mt-2 text-base font-normal text-[#16305B]">
                Cases involving federal laws, constitutional issues, or disputes between citizens of different states with high dollar amounts.
              </div>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}