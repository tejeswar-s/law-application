"use client";

import AttorneyHomeSection from "./AttorneyHomeSection";
import AttorneyProfileSection from "./AttorneyProfileSection";
import AttorneyNotificationsSection from "./AttorneyNotificationsSection";
import AttorneyCasesSection from "./AttorneyCasesSection";
import AttorneyCalendarSection from "./AttorneyCalendarSection";

type Section = "home" | "profile" | "notifications" | "cases" | "calendar";

interface AttorneyMainSectionProps {
  selectedSection: Section;
  onSectionChange: (section: Section) => void;
}

export default function AttorneyMainSection({ selectedSection, onSectionChange }: AttorneyMainSectionProps) {
  const handleBack = () => {
    onSectionChange("home");
  };

  switch (selectedSection) {
    case "profile":
      return <AttorneyProfileSection onBack={handleBack} />;
    case "notifications":
      return <AttorneyNotificationsSection onBack={handleBack} />;
    case "cases":
      return <AttorneyCasesSection onBack={handleBack} />;
    case "calendar":
      return <AttorneyCalendarSection onBack={handleBack} />;
    case "home":
    default:
      return <AttorneyHomeSection />;
  }
}