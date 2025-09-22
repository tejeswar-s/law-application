"use client";

import AttorneySidebar from "../components/AttorneySidebar";
import AttorneyProfileSection from "../components/AttorneyProfileSection";

export default function AttorneyProfilePage() {
  return (
    <div className="min-h-screen flex bg-[#F7F6F3] font-sans">
      <AttorneySidebar selectedSection={"home"} onSectionChange={function (section: "home" | "cases" | "calendar" | "profile" | "notifications"): void {
        throw new Error("Function not implemented.");
      } } />
      <AttorneyProfileSection />
    </div>
  );
}
