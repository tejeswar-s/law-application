"use client";

import AttorneySidebar from "../components/AttorneySidebar";
import AttorneyProfileSection from "../components/AttorneyProfileSection";

export default function AttorneyProfilePage() {
  return (
    <div className="min-h-screen flex bg-[#F7F6F3] font-sans">
      <AttorneySidebar />
      <AttorneyProfileSection />
    </div>
  );
}
