"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
export default function CaseTypePage() {
  const router = useRouter();
  const steps = [
    "Case Details",
    "Plaintiff Details",
    "Defendant Details",
    "Voir Dire Part 1 & 2",
    "Payment Details",
    "Review & Submit",
  ];
  const [selected, setSelected] = useState("");

  const handleSelect = (type: string) => {
    setSelected(type);
    localStorage.setItem("caseTypeSelection", type);
    setTimeout(() => {
      router.push("/attorney/state/case-details");
    }, 300);
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
        <div className="w-full max-w-6xl mx-auto px-20">
          {/* Stepper */}
          <div className="flex items-center justify-between px-8 pb-8 pt-8">
            {steps.map((label, idx) => {
              const isActive = idx === 0;
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
        <div className="flex flex-col items-center justify-center mt-20">
          <h1 className="text-3xl font-bold text-[#16305B] mb-4">Case Type</h1>
          <p className="mb-8 text-gray-700">Please select which type of case you are filing for.</p>
          <div className="flex gap-12">
            <button
              className={`bg-[#f5ecd7] px-10 py-8 rounded shadow text-2xl font-bold text-[#16305B] border-2 ${selected === "state" ? "border-[#16305B]" : "border-transparent"}`}
              onClick={() => handleSelect("state")}
            >
              State
              <div className="mt-2 text-base font-normal text-[#16305B]">
                Cases involving state laws such as family disputes, contracts, property, and most crimes.
              </div>
            </button>
            <button
              className={`bg-[#f5ecd7] px-10 py-8 rounded shadow text-2xl font-bold text-[#16305B] border-2 ${selected === "federal" ? "border-[#16305B]" : "border-transparent"}`}
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