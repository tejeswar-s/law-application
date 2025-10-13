"use client";

import { useState } from "react";
import AttorneySidebar from "./components/AttorneySidebar";
import AttorneyMainSection from "./components/AttorneyMainSection";

type Section = "home" | "profile" | "notifications" | "cases" | "calendar";

export default function AttorneyDashboard() {
  const [selectedSection, setSelectedSection] = useState<Section>("home");

  return (
    <div className="min-h-screen flex bg-[#F7F6F3] font-sans">
      <AttorneySidebar
        selectedSection={selectedSection}
        onSectionChange={(section: Section) => setSelectedSection(section)}
      />
      <AttorneyMainSection selectedSection={selectedSection} />
    </div>
  );
}
