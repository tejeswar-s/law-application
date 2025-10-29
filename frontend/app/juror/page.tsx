"use client";
import { useState } from "react";
import JurorSidebar from "./components/JurorSidebar";
import JurorMainSection from "./components/JurorMainSection";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";

type Section = "home" | "profile" | "notifications" | "assigned" | "jobs";

export default function JurorDashboard() {
  // Use protected route hook
  useProtectedRoute('juror');

  const [selectedSection, setSelectedSection] = useState<Section>("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      <JurorSidebar
        selectedSection={selectedSection}
        onSectionChange={setSelectedSection}
        onCollapsedChange={setSidebarCollapsed}
      />
      <JurorMainSection selectedSection={selectedSection} sidebarCollapsed={sidebarCollapsed} />
    </div>
  );
}
