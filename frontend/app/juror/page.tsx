"use client";
import JurorSidebar from "./components/JurorSidebar";
import JurorMainSection from "./components/JurorMainSection";

export default function JurorDashboard() {
  return (
    <div className="flex min-h-screen">
      <JurorSidebar />
      <JurorMainSection />
    </div>
  );
}
