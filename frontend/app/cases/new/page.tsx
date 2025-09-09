"use client";

import { useRouter } from "next/navigation";

export default function CaseTypeSelection() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex bg-[#F7F6F3] font-sans">
      {/* Sidebar (reuse your sidebar component here) */}
      <aside className="w-[260px] bg-[#16305B] text-white flex flex-col justify-between py-6 px-4">
        {/* ...sidebar code... */}
      </aside>
      <main className="flex-1 px-10 py-8">
        <button
          className="mb-6 text-[#16305B] hover:underline"
          onClick={() => router.back()}
        >
          &larr; Back
        </button>
        <div className="mb-8 flex items-center gap-4">
          <div className="font-semibold text-[#16305B]">Case Details</div>
          <div className="h-2 w-2 rounded-full bg-[#16305B]" />
          <div className="text-[#6B7280]">Plaintiff Details</div>
          {/* ...other steps... */}
        </div>
        <h1 className="text-2xl font-bold text-[#16305B] mb-4">Case Type</h1>
        <p className="mb-8 text-[#6B7280]">Please select which type of case you are filing for.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button
            className="bg-[#ede7db] rounded shadow p-8 flex flex-col items-center justify-center hover:bg-[#e2dac7] border border-[#e2dac7]"
            onClick={() => router.push("/cases/new/state")}
          >
            <span className="text-2xl font-bold text-[#16305B] mb-2">State</span>
            <span className="text-[#16305B] text-center">
              Cases involving state laws such as family disputes, contracts, property, and most crimes.
            </span>
          </button>
          <button
            className="bg-[#ede7db] rounded shadow p-8 flex flex-col items-center justify-center hover:bg-[#e2dac7] border border-[#e2dac7]"
            onClick={() => router.push("/cases/new")}
          >
            <span className="text-2xl font-bold text-[#16305B] mb-2">Federal</span>
            <span className="text-[#16305B] text-center">
              Cases involving federal laws, constitutional issues, or disputes between citizens of different states with high dollar amounts.
            </span>
          </button>
        </div>
      </main>
    </div>
  );
}