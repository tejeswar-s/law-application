"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar, AlertCircle } from "lucide-react";
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  getDay, 
  subDays, 
  addDays,
  isToday,
  parseISO,
  subMonths,
  addMonths 
} from "date-fns";

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
  status?: string;
  AdminApprovalStatus?: string;
  AttorneyStatus?: string;
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

function formatTime(timeString: string) {
  try {
    // timeString is like "14:30:00"
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch {
    return timeString;
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
  const [view, setView] = useState<"calendar" | "list">("list");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const router = useRouter();

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
    const selectedGroup: Case[] = selectedDate ? (grouped[selectedDate] || []) : [];

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#16305B]">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-[#16305B]"
              aria-label="Previous month"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-[#16305B]"
              aria-label="Next month"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center font-semibold text-sm text-[#16305B]">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {/* Previous month's overflow days */}
          {Array.from({ length: getDay(monthStart) }).map((_, index) => (
            <div key={`prev-${index}`} className="p-3 text-center text-gray-400">
              <span className="text-sm">
                {format(subDays(monthStart, getDay(monthStart) - index), 'd')}
              </span>
            </div>
          ))}

          {/* Current month's days */}
          {days.map((day) => {
            const formattedDate = format(day, 'yyyy-MM-dd');
            const hasEvents = Boolean(grouped[formattedDate]);
            const dayEvents = grouped[formattedDate] || [];
            const isSelected = selectedDate === formattedDate;
            const isTodays = isToday(day);

            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(formattedDate)}
                className={`relative p-3 text-center cursor-pointer rounded-lg transition-all duration-200
                  ${isSelected 
                    ? 'bg-[#16305B] text-white shadow-lg transform scale-105' 
                    : hasEvents 
                      ? 'bg-blue-50 hover:bg-blue-100' 
                      : 'hover:bg-gray-50'
                  }
                  ${isTodays && !isSelected ? 'ring-2 ring-[#16305B] ring-opacity-50' : ''}
                `}
              >
                <div className={`text-sm font-medium ${
                  isSelected 
                    ? 'text-white' 
                    : isTodays 
                      ? 'text-[#16305B]' 
                      : 'text-gray-700'
                }`}>
                  {format(day, 'd')}
                </div>
                {hasEvents && (
                  <div className="mt-1 flex justify-center gap-1">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-[#16305B]'
                    }`}></span>
                    {dayEvents.length > 1 && (
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-[#16305B]'
                      }`}></span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Next month's overflow days */}
          {Array.from({
            length: (7 - ((getDay(monthStart) + days.length) % 7)) % 7
          }).map((_, index) => (
            <div key={`next-${index}`} className="p-3 text-center text-gray-400">
              <span className="text-sm">
                {format(addDays(monthEnd, index + 1), 'd')}
              </span>
            </div>
          ))}
        </div>

        {/* Selected date cases panel */}
        {selectedDate && selectedGroup.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-[#16305B]">
                Cases on {format(parseISO(selectedDate), 'MMMM d, yyyy')}
              </h3>
              <button 
                onClick={() => setSelectedDate(null)}
                className="text-sm text-gray-500 hover:text-[#16305B]"
              >
                Close
              </button>
            </div>
            <div className="space-y-3">
              {selectedGroup.map((c) => (
                <div 
                  key={c.Id}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-[#16305B]">
                        {getCaseName(c.PlaintiffGroups, c.DefendantGroups)}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {formatTime(c.ScheduledTime)} • Case #{c.Id}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/attorney/cases/${c.Id}`)}
                        className="text-sm text-[#16305B] hover:underline"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => router.push(`/attorney/cases/${c.Id}/war-room`)}
                        className="text-sm text-[#16305B] hover:underline"
                      >
                        War Room
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderList = () => {
    const grouped = groupCasesByDate();
    const sortedDates = Object.keys(grouped).sort();

    if (sortedDates.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Scheduled Cases</h3>
          <p className="text-gray-600">You don't have any scheduled cases yet.</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-lg">
        <div className="divide-y">
          {sortedDates.map(date => (
            <div key={date} className="p-4">
              <h3 className="font-semibold text-[#16305B] mb-3">
                {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
              </h3>
              <div className="space-y-3">
                {grouped[date].map(c => (
                  <div 
                    key={c.Id}
                    className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <h4 className="font-medium text-[#16305B]">
                        {getCaseName(c.PlaintiffGroups, c.DefendantGroups)}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {formatTime(c.ScheduledTime)} • Case #{c.Id}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/attorney/cases/${c.Id}`)}
                        className="text-sm text-[#16305B] hover:underline"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => router.push(`/attorney/cases/${c.Id}/war-room`)}
                        className="text-sm text-[#16305B] hover:underline"
                      >
                        War Room
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronLeft size={24} className="text-[#16305B]" />
          </button>
          <h1 className="text-2xl font-bold text-[#16305B]">Calendar</h1>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full text-center">
            <div className="mb-4">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Calendar Locked</h2>
            <p className="text-gray-600">
              Your calendar will be available once your account is verified by an administrator.
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
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronLeft size={24} className="text-[#16305B]" />
          </button>
          <h1 className="text-2xl font-bold text-[#16305B]">Calendar</h1>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center bg-white rounded-lg shadow p-1">
          <button
            onClick={() => setView("calendar")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              view === "calendar"
                ? "bg-[#16305B] text-white"
                : "text-gray-600 hover:text-[#16305B]"
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              view === "list"
                ? "bg-[#16305B] text-white"
                : "text-gray-600 hover:text-[#16305B]"
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
          {view === "list" ? renderList() : renderCalendar()}
        </div>
      )}
    </main>
  );
}