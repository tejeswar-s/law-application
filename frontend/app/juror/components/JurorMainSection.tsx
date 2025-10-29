"use client";

import HomeSection from "./HomeSection";
import ProfileSection from "./ProfileSection";
import NotificationsSection from "./NotificationsSection";
import AssignedCasesSection from "./AssignedCasesSection";
import JobBoardSection from "./JobBoardSection";

type Section = "home" | "profile" | "notifications" | "assigned" | "jobs";

export default function JurorMainSection({ selectedSection, sidebarCollapsed }: { selectedSection: Section; sidebarCollapsed: boolean }) {
  switch (selectedSection) {
    case "profile":
      return <ProfileSection />;
    case "notifications":
      return <NotificationsSection />;
    case "assigned":
      return <AssignedCasesSection />;
    case "jobs":
      return <JobBoardSection />;
    case "home":
    default:
      return <HomeSection sidebarCollapsed={sidebarCollapsed} />;
  }
}
