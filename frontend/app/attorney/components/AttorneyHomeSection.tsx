"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const AttorneyHelp = dynamic(() => import("./AttorneyHelp"), { ssr: false });
const AttorneyContact = dynamic(() => import("./AttorneyContact"), { ssr: false });
import { differenceInMinutes, format, parseISO, isToday } from "date-fns";
import { useRouter } from "next/navigation";
const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
  : "http://localhost:4000";

console.log("API_BASE configured as:", API_BASE);

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
  PlaintiffGroups: string;
  DefendantGroups: string;
  ScheduledDate: string;
  ScheduledTime: string;
  attorneyEmail: string;
  AttorneyStatus?: string; 
};

// Helper function to read cookies
function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

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
  const [page, setPage] = useState(1);
  const CASES_PER_PAGE = 5;
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
      console.log("Fetching cases for user:", user.email);
      console.log("API URL:", `${API_BASE}/api/cases?userId=${encodeURIComponent(user.email)}`);
      
      const token = getCookie("token");
      console.log("Token from cookie:", token ? "Found" : "Not found");
      
      fetch(`${API_BASE}/api/cases?userId=${encodeURIComponent(user.email)}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          console.log("API Response:", data);
          if (Array.isArray(data)) {
            setCases(data);
          } else {
            console.error("Expected array, got:", data);
            setCases([]);
          }
        })
        .catch(err => {
          console.error("Failed to fetch cases:", err);
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleNewCase = () => {
    router.push("/attorney/state/case-type");
  };

  const handleCaseClick = (caseId: number) => {
    router.push(`/attorney/cases/${caseId}`);
  };

  const handleWarRoomClick = (e: React.MouseEvent, caseId: number) => {
    e.stopPropagation(); // Prevent card click from firing
    router.push(`/attorney/cases/${caseId}/war-room`);
  };

  const grouped = groupCasesByDate(cases);
  const sortedDates = Object.keys(grouped).sort();
  const paginatedCases = cases.slice((page - 1) * CASES_PER_PAGE, page * CASES_PER_PAGE);
  const totalPages = Math.ceil(cases.length / CASES_PER_PAGE);

  if (showContact) {
    return <AttorneyContact onBack={() => { setShowContact(false); setShowHelp(true); }} />;
  }
  if (showHelp) {
    return <AttorneyHelp onContact={() => { setShowHelp(false); setShowContact(true); }} />;
  }
  return (
    <main className="flex-1 px-10 py-8 bg-[#F7F6F3] transition-all duration-300 ease-in-out">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#16305B]">
          Welcome back{user ? `, ${user.firstName}!` : "!"}
        </h1>
        <div className="flex items-center gap-4">
          <button className="text-[#16305B]" onClick={() => setShowHelp(true)}>Help</button>
        </div>
      </div>
      
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
          <>
            <div className="flex gap-3 flex-wrap">
              {paginatedCases.map((c) => (
                <div
                  key={c.Id}
                  onClick={() => handleCaseClick(c.Id)}
                  className="bg-white rounded shadow p-3 w-56 flex flex-col justify-between mb-3 text-black cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <div>
                    <div className="font-bold text-md mb-1">
                      {getCaseName(c.PlaintiffGroups, c.DefendantGroups)}
                    </div>
                    <div className="text-xs text-gray-700 mb-1">Case # {c.Id}</div>
                    <div className="text-[#B10000] font-bold text-xs mb-2">
                      {getTimeWarning(c.ScheduledDate, c.ScheduledTime)}
                    </div>
                  </div>
                  <div>
                    {c.AttorneyStatus === "join_trial" ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/attorney/cases/${c.Id}/trial`);
                        }}
                        className="mt-2 px-3 py-1 bg-green-600 text-white rounded flex items-center gap-2 text-sm font-semibold hover:bg-green-700 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Join Trial
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleWarRoomClick(e, c.Id)}
                        className="mt-2 px-3 py-1 bg-[#16305B] text-white rounded flex items-center gap-2 text-sm font-semibold hover:bg-[#1e417a] transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
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
                        War Room
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center items-center mt-4 gap-4">
              <button
                className="px-3 py-1 rounded bg-[#e6eefc] text-[#16305B] font-semibold disabled:opacity-50"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Prev
              </button>
              <span className="text-[#16305B] font-semibold">
                Page {page} of {totalPages}
              </span>
              <button
                className="px-3 py-1 rounded bg-[#e6eefc] text-[#16305B] font-semibold disabled:opacity-50"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </>
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

      <section>
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-lg font-bold text-[#16305B]">Upcoming Events</h2>
            <p className="text-sm text-[#6B7280]">Manage and access your cases quickly</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#16305B] font-semibold">View</span>
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
          <div className="absolute bottom-4 right-6 flex items-center text-green-600 text-sm">
            <span className="mr-1">✔️</span> Calendar sync up to date
          </div>
        </div>
      </section>
    </main>
  );
}