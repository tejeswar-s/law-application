"use client";

import { useState } from "react";
import AttorneySidebar from "./components/AttorneySidebar";
import AttorneyMainSection from "./components/AttorneyMainSection";

type Section = "home" | "profile" | "notifications" | "cases" | "calendar";

export default function AttorneyDashboard() {
  const [selectedSection, setSelectedSection] = useState<Section>("home");

  return (
    <div className="min-h-screen flex bg-[#F7F6F3] font-sans">
      <AttorneySidebar selectedSection={"home"} onSectionChange={function (section: "home" | "cases" | "calendar" | "profile" | "notifications"): void {
        throw new Error("Function not implemented.");
      } } />
      <AttorneyMainSection selectedSection={selectedSection} />
    </div>
  );
}
