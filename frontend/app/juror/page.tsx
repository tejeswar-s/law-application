"use client";
import { useState } from "react";
import JurorSidebar from "./components/JurorSidebar";
import JurorMainSection from "./components/JurorMainSection";

type Section = "home" | "profile" | "notifications" | "assigned" | "jobs";

export default function JurorDashboard() {
  const [selectedSection, setSelectedSection] = useState<Section>("home");

  return (
    <div className="flex min-h-screen">
      <JurorSidebar
        selectedSection={selectedSection}
        onSectionChange={setSelectedSection}
      />
      <JurorMainSection selectedSection={selectedSection} />
    </div>
  );
}
