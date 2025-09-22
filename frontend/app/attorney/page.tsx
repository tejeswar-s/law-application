"use client";

import { useState } from "react";
import AttorneySidebar from "./components/AttorneySidebar";
import AttorneyMainSection from "./components/AttorneyMainSection";
import { Section } from "./types";

export default function AttorneyDashboard() {
  const [selectedSection, setSelectedSection] = useState<Section>("home");

  return (
    <div className="min-h-screen flex bg-[#F7F6F3] font-sans">
      <AttorneySidebar
        selectedSection={selectedSection}
        onSectionChange={setSelectedSection}
      />
      <AttorneyMainSection selectedSection={selectedSection} />
    </div>
  );
}
