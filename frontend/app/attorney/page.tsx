"use client";

import AttorneySidebar from "./components/AttorneySidebar";
import AttorneyMainSection from "./components/AttorneyMainSection";

export default function AttorneyDashboard() {
  return (
    <div className="min-h-screen flex bg-[#F7F6F3] font-sans">
      <AttorneySidebar />
      <AttorneyMainSection />
    </div>
  );
}