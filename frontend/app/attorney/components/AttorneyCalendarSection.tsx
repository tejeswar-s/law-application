"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { format, parseISO, isToday, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
  : "http://localhost:4000";

type AttorneyUser = {
  attorneyId: number;
  firstName: string;
  lastName: string;
  email: string;
  isVerified: boolean;
  verificationStatus: string;
};

type Case = {
  Id: number;
  PlaintiffGroups: string;
  DefendantGroups: string;
  ScheduledDate: string;
  ScheduledTime: string;
  attorneyEmail: string;
};

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

interface AttorneyCalendarSectionProps {
  onBack: () => void;
}

export default function AttorneyCalendarSection({ onBack }: AttorneyCalendarSectionProps) {
  const [user, setUser] = useState<AttorneyUser | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"calendar" | "list">("calendar");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("attorneyUser");
      if (stored) {
        try {
          const parsedUser = JSON.parse(stored);
          setUser(parsedUser);
        } catch (error) {
          console.error("Failed to parse attorney user:", error);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (user && user.isVerified) {
      fetchCases();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchCases = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = getCookie("token");
      const res = await fetch(`${API_BASE}/api/cases?userId=${encodeURIComponent(user.email)}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setCases(data);
      } else {
        setCases([]);
      }
    } catch (err) {
      console.error("Failed to fetch cases:", err);
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  // Group cases by date
  const groupCasesByDate = () => {
    const grouped: { [date: string]: Case[] } = {};
    cases.forEach((c) => {
      if (c.ScheduledDate) {
        grouped[c.ScheduledDate] = grouped[c.ScheduledDate] || [];
        grouped[c.ScheduledDate].push(c);
      }
    });
    return grouped;
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const grouped = groupCasesByDate();

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#16305B]">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 bg-[#16305B] text-white rounded hover:bg-[#1e417a] transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              Next
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayEvents = grouped[dateStr] || [];
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toString()}
                className={`min-h-[100px] p-2 border rounded ${
                  !isCurrentMonth ? "bg-gray-50 text-gray-400" : "bg-white"
                } ${isCurrentDay ? "ring-2 ring-[#16305B]" : ""}`}
              >
                <div className={`text-sm font-semibold mb-1 ${isCurrentDay ? "text-[#16305B]" : ""}`}>
                  {format(day, "d")}
                </div>
                {dayEvents.length > 0 && (
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.Id}
                        className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded truncate"
                        title={getCaseName(event.PlaintiffGroups, event.DefendantGroups)}
                      >
                        {event.ScheduledTime} - {getCaseName(event.PlaintiffGroups, event.DefendantGroups)}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderList = () => {
    const grouped = groupCasesByDate();
    const sortedDates = Object.keys(grouped).sort();

    if (sortedDates.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No upcoming events scheduled.</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="divide-y">
          {sortedDates.map((date) => {
            let dateLabel = "Invalid date";
            try {
              const parsed = parseISO(date);
              if (!isNaN(parsed.getTime())) {
                dateLabel = isToday(parsed)
                  ? `Today, ${format(parsed, "MMMM d")}`
                  : format(parsed, "EEEE, MMMM d, yyyy");
              }
            } catch {
              // leave as "Invalid date"
            }

            return (
              <div key={date} className="p-6">
                <h3 className="font-semibold text-lg text-[#16305B] mb-4">{dateLabel}</h3>
                <div className="space-y-3">
                  {grouped[date].map((event) => (
                    <div key={event.Id} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                      <div className="text-sm font-medium text-gray-600 w-20">
                        {event.ScheduledTime}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {getCaseName(event.PlaintiffGroups, event.DefendantGroups)}
                        </div>
                        <div className="text-sm text-gray-600">Case #{event.Id}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Show locked state for unverified attorneys
  if (!user?.isVerified) {
    return (
      <main className="flex-1 px-10 py-8 bg-[#F7F6F3] transition-all duration-300 ease-in-out">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#16305B] hover:text-[#1e417a] transition-colors"
            aria-label="Go back to home"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-[#16305B]">Calendar</h1>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="bg-white rounded-lg shadow-lg p-12 max-w-md text-center">
            <div className="mb-6">
              <Lock className="mx-auto h-16 w-16 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Restricted</h2>
            <p className="text-gray-600 mb-4">
              Your account is pending verification by an administrator. You will be able to access the Calendar section once your account is approved.
            </p>
            <p className="text-sm text-gray-500">
              This usually takes 24-48 hours. You'll receive a notification once your account is verified.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-10 py-8 bg-[#F7F6F3] transition-all duration-300 ease-in-out">
      {/* Header with Back Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#16305B] hover:text-[#1e417a] transition-colors"
            aria-label="Go back to home"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#16305B]">Calendar & Events</h1>
            <p className="text-sm text-[#6B7280]">Track your upcoming trials and events</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">View:</span>
          <button
            onClick={() => setView("calendar")}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              view === "calendar"
                ? "bg-[#16305B] text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              view === "list"
                ? "bg-[#16305B] text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Calendar/List Content */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#16305B]" />
        </div>
      ) : (
        <div>
          {view === "calendar" ? renderCalendar() : renderList()}
        </div>
      )}
    </main>
  );
}