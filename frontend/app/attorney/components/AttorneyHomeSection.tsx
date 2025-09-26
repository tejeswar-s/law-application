"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const AttorneyHelp = dynamic(() => import("./AttorneyHelp"), { ssr: false });
const AttorneyContact = dynamic(() => import("./AttorneyContact"), { ssr: false });
import { differenceInMinutes, format, parseISO, isToday } from "date-fns";
import { useRouter } from "next/navigation";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

type AttorneyUser = {
  firstName: string;
  lastName: string;
  email: string;
  lawFirmName: string;
  phoneNumber: string;
  state: string;
};

type Case = {
  Id: number;
  PlaintiffGroups: string; // JSON string
  DefendantGroups: string; // JSON string
  ScheduledDate: string;   // e.g., "2025-08-23"
  ScheduledTime: string;   // e.g., "12:00"
  attorneyEmail: string;   // added field for attorney's email
  // ...other fields
};

function getCaseName(plaintiffGroups: string, defendantGroups: string) {
  try {
    const plaintiffs = JSON.parse(plaintiffGroups);
    const defendants = JSON.parse(defendantGroups);
    const plaintiffName = plaintiffs[0]?.plaintiffs?.[0]?.name || "Plaintiff";
    const defendantName = defendants[0]?.defendants?.[0]?.name || "Defendant";
    return `${plaintiffName} v. ${defendantName}`;
  } catch {
    return "Case";
  }
}

function getTimeWarning(scheduledDate: string, scheduledTime: string) {
  try {
    const trialDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();
    const diff = differenceInMinutes(trialDateTime, now);
    if (diff > 0) {
      return `TRIAL BEGINS IN :${diff < 10 ? "0" : ""}${diff} MIN`;
    } else {
      return "TRIAL STARTED";
    }
  } catch {
    return "";
  }
}

function groupCasesByDate(cases: Case[]) {
  const grouped: { [date: string]: Case[] } = {};
  cases.forEach((c) => {
    grouped[c.ScheduledDate] = grouped[c.ScheduledDate] || [];
    grouped[c.ScheduledDate].push(c);
  });
  return grouped;
}

// Add a simple calendar mockup for demo (replace with a real calendar component if needed)
function CalendarMock({ selectedDates }: { selectedDates: string[] }) {
  return (
    <div className="bg-white rounded shadow p-6 w-[350px] min-h-[350px] flex flex-col items-center justify-center">
      <div className="font-semibold mb-2">June 2025</div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 30 }, (_, i) => {
          const day = i + 1;
          const dateStr = `2025-06-${day.toString().padStart(2, "0")}`;
          const isSelected = selectedDates.includes(dateStr);
          return (
            <div
              key={day}
              className={`w-8 h-8 flex items-center justify-center rounded-full ${
                isSelected ? "bg-yellow-400 text-white font-bold" : "text-gray-700"
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AttorneyHomeSection() {
  const [user, setUser] = useState<any>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventView, setEventView] = useState<"calendar" | "list">("list");
  const [showHelp, setShowHelp] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("attorneyUser");
      if (stored) setUser(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(true);
      // Use user.email here, no need to redeclare user
      fetch(`${API_BASE}/api/cases?userId=${encodeURIComponent(user.email)}`)
        .then(res => res.json())
        .then(data => setCases(data))
        .catch(err => {
          console.error("Failed to fetch cases:", err);
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleNewCase = () => {
    router.push("/attorney/state/case-details");
  };

  const grouped = groupCasesByDate(cases);
  const sortedDates = Object.keys(grouped).sort();

  if (showContact) {
    return <AttorneyContact onBack={() => { setShowContact(false); setShowHelp(true); }} />;
  }
  if (showHelp) {
    return <AttorneyHelp onContact={() => { setShowHelp(false); setShowContact(true); }} />;
  }
  return (
    <main className="flex-1 px-10 py-8 bg-[#F7F6F3] transition-all duration-300 ease-in-out">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#16305B]">
          Welcome back{user ? `, ${user.firstName}!` : "!"}
        </h1>
        <div className="flex items-center gap-4">
          <button className="text-[#16305B]" onClick={() => setShowHelp(true)}>Help</button>
        </div>
      </div>
      {/* Your Cases Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-lg font-bold text-[#16305B]">Your Cases</h2>
            <p className="text-sm text-[#6B7280]">Manage and access your cases quickly</p>
          </div>
          <button
            className="bg-[#16305B] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#1e417a] transition-colors"
            onClick={handleNewCase}
          >
            + New Case
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#16305B]" />
          </div>
        ) : cases.length > 0 ? (
          <div className="flex gap-6 flex-wrap">
            {cases.map((c) => (
              <div
                key={c.Id}
                className="bg-white rounded shadow p-6 w-80 flex flex-col justify-between mb-4 text-black"
              >
                <div>
                  {/* Case Name */}
                  <div className="font-bold text-xl mb-1">
                    {getCaseName(c.PlaintiffGroups, c.DefendantGroups)}
                  </div>
                  {/* Case Number */}
                  <div className="text-md text-gray-700 mb-1">Case # {c.Id}</div>
                  {/* Red warning */}
                  <div className="text-[#B10000] font-bold text-md mb-4">
                    {getTimeWarning(c.ScheduledDate, c.ScheduledTime)}
                  </div>
                </div>
                <div>
                  {/* Blue Finish War room button with arrow icon */}
                  <button
                    onClick={() => router.push(`/attorney/cases/${c.Id}/war-room`)}
                    className="mt-2 px-6 py-2 bg-[#16305B] text-white rounded flex items-center gap-2 text-lg font-semibold"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                    Finish War Room
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded shadow p-8 flex flex-col items-center justify-center min-h-[120px]">
            <p className="text-[#6B7280] mb-2">You do not have any active cases.</p>
            <p className="text-[#6B7280] mb-4">
              Click on{" "}
              <button 
                className="bg-[#16305B] text-white px-3 py-1 rounded mx-1 hover:bg-[#1e417a] transition-colors"
                onClick={handleNewCase}
              >
                New Case
              </button>{" "}
              to file a new case.
            </p>
          </div>
        )}
      </section>

      {/* Upcoming Events Section */}
      <section>
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-lg font-bold text-[#16305B]">Upcoming Events</h2>
            <p className="text-sm text-[#6B7280]">Manage and access your cases quickly</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#16305B] font-semibold">View</span>
            <button
              className={`bg-[#e6eefc] px-2 py-1 rounded ${eventView === "calendar" ? "ring-2 ring-[#16305B]" : ""}`}
              onClick={() => setEventView("calendar")}
            >
              <span role="img" aria-label="calendar">📅</span>
            </button>
            <button
              className={`bg-[#e6eefc] px-2 py-1 rounded ${eventView === "list" ? "ring-2 ring-[#16305B]" : ""}`}
              onClick={() => setEventView("list")}
            >
              <span role="img" aria-label="list">📋</span>
            </button>
            <button className="ml-2 bg-[#16305B] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#1e417a] transition-colors">
              + Add Event
            </button>
          </div>
        </div>
        <div className="bg-white rounded shadow p-6 min-h-[120px] relative flex">
          <span className="absolute top-4 right-6 text-sm text-gray-500">
            Source: <span role="img" aria-label="outlook">📧</span>
          </span>
          {eventView === "calendar" ? (
            <>
              <CalendarMock selectedDates={sortedDates} />
              <div className="flex-1 pl-8">
                {/* List of events for selected dates, similar to your screenshot */}
                {sortedDates.length === 0 ? (
                  <div className="text-gray-500">No upcoming events.</div>
                ) : (
                  <div>
                    {sortedDates.map(date => (
                      <div key={date} className="mb-4 flex">
                        <div className="w-48 font-semibold text-[#363636]">
                          {isToday(parseISO(date))
                            ? `Today, ${format(parseISO(date), "MMMM d")}`
                            : format(parseISO(date), "EEE, MMMM d")}
                        </div>
                        <div className="flex-1">
                          {grouped[date].map(ev => (
                            <div key={ev.Id} className="mb-1">
                              <span className="font-medium text-black">
                                {ev.ScheduledTime && (
                                  <span>{ev.ScheduledTime} </span>
                                )}
                                {getCaseName(ev.PlaintiffGroups, ev.DefendantGroups)} War Room due
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            // List view (your current implementation)
            <div className="flex-1">
              {sortedDates.length === 0 ? (
                <div className="text-gray-500">No upcoming events.</div>
              ) : (
                <div>
                  {sortedDates.map(date => {
                    let dateLabel = "Invalid date";
                    let parsed: Date | null = null;
                    try {
                      parsed = parseISO(date);
                      if (!isNaN(parsed.getTime())) {
                        dateLabel = isToday(parsed)
                          ? `Today, ${format(parsed, "MMMM d")}`
                          : format(parsed, "EEE, MMMM d");
                      }
                    } catch {
                      // leave as "Invalid date"
                    }
                    return (
                      <div key={date} className="mb-4 flex">
                        <div className="w-48 font-semibold text-[#363636]">
                          {dateLabel}
                        </div>
                        <div className="flex-1">
                          {grouped[date].map(ev => (
                            <div key={ev.Id} className="mb-1">
                              <span className="font-medium text-black">
                                {ev.ScheduledTime && (
                                  <span>{ev.ScheduledTime} </span>
                                )}
                                {getCaseName(ev.PlaintiffGroups, ev.DefendantGroups)} War Room due
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          <div className="absolute bottom-4 right-6 flex items-center text-green-600 text-sm">
            <span className="mr-1">✔️</span> Calendar sync up to date
          </div>
        </div>
      </section>
    </main>
  );
}

// Example frontend API call
const fetchCases = async (userId) => {
  try {
    const response = await fetch(`/api/cases?userId=${encodeURIComponent(userId)}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch cases');
    }
    return data;
  } catch (error) {
    console.error('Error fetching cases:', error);
    throw error;
  }
};
