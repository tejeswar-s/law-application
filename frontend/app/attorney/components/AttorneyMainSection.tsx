"use client";

import AttorneyHomeSection from "./AttorneyHomeSection";
import AttorneyProfileSection from "./AttorneyProfileSection";
import AttorneyNotificationsSection from "./AttorneyNotificationsSection";
import AttorneyCasesSection from "./AttorneyCasesSection";
import AttorneyCalendarSection from "./AttorneyCalendarSection";

type Section = "home" | "profile" | "notifications" | "cases" | "calendar";

export default function AttorneyMainSection({ selectedSection }: { selectedSection: Section }) {
  switch (selectedSection) {
    case "profile":
      return <AttorneyProfileSection />;
    case "notifications":
      return <AttorneyNotificationsSection />;
    case "cases":
      return <AttorneyCasesSection />;
    case "calendar":
      return <AttorneyCalendarSection />;
    case "home":
    default:
      return <AttorneyHomeSection />;
  }
}
