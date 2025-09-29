"use client";

import {
  QuestionMarkCircleIcon, // Help
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export default function AssignedCasesSection() {
  return (
    <main className="flex-1 min-h-screen overflow-y-auto p-0">
      <div className="p-8 md:p-10 bg-[#FAF9F6] min-h-screen w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0C2D57] leading-tight">
              Assigned Cases
            </h1>
            <p className="mt-2 text-sm text-gray-600">View which cases you've applied to</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <button className="flex items-center gap-2 px-3 py-1 rounded hover:bg-white/60">
              <QuestionMarkCircleIcon className="w-5 h-5 text-gray-600" />
              <span>Help</span>
            </button>
          </div>
        </div>

        {/* Job Board (always show) */}
        <section>
          <div className="text-center text-gray-500 py-12">
            You do not have any active cases.
            <button className="mt-4 px-4 py-2 bg-[#0C2D57] text-white rounded-md">
              Apply For a Case Now
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
