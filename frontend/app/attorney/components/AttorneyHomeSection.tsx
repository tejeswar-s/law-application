"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight, AlertCircle, Calendar, Briefcase } from "lucide-react";
import { format, parseISO, isToday } from "date-fns";

const AttorneyHelp = dynamic(() => import("./AttorneyHelp"), { ssr: false });
const AttorneyContact = dynamic(() => import("./AttorneyContact"), { ssr: false });

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
  : "http://localhost:4000";

type AttorneyUser = {
  attorneyId: number;
  firstName: string;
  lastName: string;
  email: string;
  lawFirmName: string;
  phoneNumber?: string;
  isVerified: boolean;
  verificationStatus: string;
};

type Case = {
  Id: number;
  PlaintiffGroups: string;
  DefendantGroups: string;
  ScheduledDate: string;
  ScheduledTime?: string;
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

// Introductory Slider Component for Unverified Attorneys
function IntroductorySlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      title: "Welcome to Quick Verdicts!",
      description: "Your comprehensive platform for managing virtual trials efficiently and effectively.",
      image: "/image2.png"
    },
    {
      title: "Manage Your Cases",
      description: "Create, organize, and track all your cases in one centralized dashboard.",
      image: "/image3.png"
    },
    {
      title: "Virtual Courtroom",
      description: "Conduct trials seamlessly with our integrated video conferencing and case management tools.",
      image: "/image4.png"
    },
    {
      title: "War Room Collaboration",
      description: "Prepare for trials with document management, witness preparation, and team collaboration features.",
      image: "/image5.png"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
      <div className="relative">
        {/* Slide Content */}
        <div className="text-center mb-6">
          <div className="mb-6 flex justify-center">
            <img 
              src={slides[currentSlide].image} 
              alt={slides[currentSlide].title}
              className="h-64 w-auto object-contain rounded-lg"
            />
          </div>
          <h2 className="text-2xl font-bold text-[#16305B] mb-3">
            {slides[currentSlide].title}
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {slides[currentSlide].description}
          </p>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={prevSlide}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} className="text-[#16305B]" />
          </button>
          
          {/* Dots Indicator */}
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide 
                    ? "w-8 bg-[#16305B]" 
                    : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight size={24} className="text-[#16305B]" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AttorneyHomeSection() {
  const [user, setUser] = useState<AttorneyUser | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [casesLoading, setCasesLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    // Load user from localStorage
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.isVerified) {
      fetchCases();
    }
  }, [user]);

  const fetchCases = async () => {
    if (!user) return;
    
    setCasesLoading(true);
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
      setCasesLoading(false);
    }
  };

  // Get upcoming events (cases with scheduled dates)
  const getUpcomingEvents = () => {
    const now = new Date();
    return cases
      .filter(c => {
        if (!c.ScheduledDate) return false;
        const eventDate = new Date(`${c.ScheduledDate}T${c.ScheduledTime || '00:00'}`);
        return eventDate >= now;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.ScheduledDate}T${a.ScheduledTime || '00:00'}`);
        const dateB = new Date(`${b.ScheduledDate}T${b.ScheduledTime || '00:00'}`);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 6); // Show only first 6 upcoming events
  };

  // Get recent cases
  const getRecentCases = () => {
    return cases.slice(0, 6); // Show 6 cases in a 3x2 grid
  };

  if (loading) {
    return (
      <main className="flex-1 px-10 py-8 bg-[#F7F6F3] flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#16305B]" />
      </main>
    );
  }

  if (showContact) {
    return <AttorneyContact onBack={() => { setShowContact(false); setShowHelp(true); }} />;
  }

  if (showHelp) {
    return <AttorneyHelp onContact={() => { setShowHelp(false); setShowContact(true); }} />;
  }

  const isVerified = user?.isVerified || false;
  const upcomingEvents = getUpcomingEvents();
  const recentCases = getRecentCases();
  

  function formatTime(timeString: string) {
    try {
      if (!timeString) return "";
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours || "0", 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes || '00'} ${ampm}`;
    } catch {
      return timeString || "";
    }
  }

  function getTimeWarning(scheduledDate: string, scheduledTime?: string) {
    try {
      const trialDateTime = new Date(`${scheduledDate}T${scheduledTime || '00:00'}`);
      const now = new Date();
      const diffInMs = trialDateTime.getTime() - now.getTime();
      const diffInMinutes = Math.floor(diffInMs / 60000);
      if (diffInMinutes > 0 && diffInMinutes < 60) {
        return `Starts in ${diffInMinutes} min`;
      } else if (diffInMinutes < 0) {
        return "In Progress";
      }
      return null;
    } catch {
      return null;
    }
  }

  function getStatusInfo(c: Case | any) {
    if (c.AdminApprovalStatus === "pending") {
      return {
        label: "Pending Approval",
        color: "bg-yellow-100 text-yellow-700 border-yellow-300",
      };
    }
    if (c.AdminApprovalStatus === "rejected") {
      return {
        label: "Rejected",
        color: "bg-red-100 text-red-700 border-red-300",
      };
    }
    if (c.AttorneyStatus === "join_trial") {
      return {
        label: "Ready for Trial",
        color: "bg-green-100 text-green-700 border-green-300",
      };
    }
    if (c.AttorneyStatus === "view_details") {
      return {
        label: "Completed",
        color: "bg-purple-100 text-purple-700 border-purple-300",
      };
    }
    if (c.AttorneyStatus === "war_room") {
      return {
        label: "Open for Applications",
        color: "bg-blue-100 text-blue-700 border-blue-300",
      };
    }
    return null;
  }

  const handleCaseClick = (caseId: number) => {
    router.push(`/attorney/cases/${caseId}`);
  };

  return (
    <main className="flex-1 px-10 py-8 bg-[#F7F6F3] transition-all duration-300 ease-in-out">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#16305B]">
          Welcome back{user ? `, ${user.firstName}!` : "!"}
        </h1>
        <div className="flex items-center gap-4">
          <button 
            className="text-[#16305B] hover:text-[#1e417a] transition-colors" 
            onClick={() => setShowHelp(true)}
          >
            Help
          </button>
        </div>
      </div>

      {/* Verification Status Alert for Unverified Attorneys */}
      {!isVerified && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-start">
            <AlertCircle className="text-yellow-600 mr-3 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <h3 className="text-yellow-800 font-semibold mb-1">Account Pending Verification</h3>
              <p className="text-yellow-700 text-sm">
                Your account is currently under review by our admin team. You will gain full access to Cases and Calendar sections once your account is verified. In the meantime, you can explore the platform features below and manage your profile.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Introductory Slider for Unverified Attorneys */}
      {!isVerified && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-[#16305B] mb-4">Get Started with Quick Verdicts</h2>
          <IntroductorySlider />
        </section>
      )}

      {/* Cases Section Preview */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <Briefcase className="text-[#16305B]" size={24} />
            <div>
              <h2 className="text-lg font-bold text-[#16305B]">Your Cases</h2>
              <p className="text-sm text-[#6B7280]">
                {isVerified ? "Manage and access your cases quickly" : "Available after verification"}
              </p>
            </div>
          </div>
        </div>
        
        {isVerified ? (
          casesLoading ? (
            <div className="bg-white rounded shadow p-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-[#16305B]" />
            </div>
          ) : recentCases.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {recentCases.map((c) => {
                  const statusInfo = getStatusInfo(c);
                  const timeWarning = c.AttorneyStatus === "join_trial" ? getTimeWarning(c.ScheduledDate, c.ScheduledTime) : null;
                  const caseTitle = getCaseName(c.PlaintiffGroups, c.DefendantGroups);

                  return (
                    <div
                      key={c.Id}
                      onClick={() => handleCaseClick(c.Id)}
                      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-[#16305B] cursor-pointer overflow-hidden group flex flex-col h-full"
                    >
                      <div className="relative p-4 border-b bg-gradient-to-r from-[#16305B] to-[#1e417a]">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-base text-white mb-1 line-clamp-2 h-12 overflow-hidden">
                              {caseTitle}
                            </h3>
                            <p className="text-xs text-blue-200">Case #{c.Id}</p>
                          </div>
                        </div>

                        {statusInfo && (
                          <div className={`absolute top-3 right-3 flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold border ${statusInfo.color}`}>
                            <span className="hidden sm:inline">{statusInfo.label}</span>
                          </div>
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col">
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4 text-[#16305B]" />
                            <span className="font-medium">{format(parseISO(c.ScheduledDate), 'MMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-medium">{formatTime(c.ScheduledTime || '')}</span>
                          </div>
                        </div>

                        {timeWarning && (
                          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs font-bold text-red-700">{timeWarning}</p>
                          </div>
                        )}

                        <div className="mt-auto">
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/attorney/cases/${c.Id}/war-room`); }}
                            className="w-full px-4 py-2.5 bg-[#16305B] text-white rounded-lg flex items-center justify-center gap-2 text-sm font-semibold hover:bg-[#1e417a] transition-colors shadow-sm hover:shadow-md"
                          >
                            War Room
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-gray-50 text-center border-t rounded">
                <p className="text-sm text-gray-600">
                  Showing {recentCases.length} of {cases.length} cases. 
                  <span
                    className="font-semibold text-[#16305B] ml-1 cursor-pointer hover:underline"
                    onClick={() => {
                      // Dispatch an in-page navigation event so the main area loads the Cases section
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('navigate-to-cases'));
                      }
                    }}
                  >
                    View all in Cases section →
                  </span>
                </p>
              </div>

              {/* If a date was selected from upcoming events, show the cases for that date here */}
              {selectedDate && (
                <div className="mt-6 bg-white rounded-lg shadow p-4">
                  <h3 className="text-lg font-semibold text-[#16305B] mb-3">Cases on {selectedDate}</h3>
                  <div className="divide-y">
                    {cases.filter(x => x.ScheduledDate === selectedDate).map((d) => (
                      <div key={d.Id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{getCaseName(d.PlaintiffGroups, d.DefendantGroups)}</div>
                          <div className="text-sm text-gray-600">{formatTime(d.ScheduledTime || '')}</div>
                        </div>
                        <div>
                          <button onClick={() => router.push(`/attorney/cases/${d.Id}`)} className="text-sm text-[#16305B] hover:underline">View</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-right">
                    <button className="text-sm text-gray-500 hover:underline" onClick={() => setSelectedDate(null)}>Close</button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded shadow p-12 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Cases Yet</h3>
              <p className="text-gray-600">
                You haven't created any cases yet. Click on <span className="font-semibold text-[#16305B]">Cases</span> in the sidebar to create your first case.
              </p>
            </div>
          )
        ) : (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Cases Section Locked</h3>
              <p className="text-gray-600">
                You will be able to create and manage cases once your account is verified by an administrator. This ensures the security and integrity of our platform.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Calendar Section Preview - List View */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="text-[#16305B]" size={24} />
            <div>
              <h2 className="text-lg font-bold text-[#16305B]">Upcoming Events</h2>
              <p className="text-sm text-[#6B7280]">
                {isVerified ? "Track your upcoming trials and events" : "Available after verification"}
              </p>
            </div>
          </div>
        </div>
        
        {isVerified ? (
          casesLoading ? (
            <div className="bg-white rounded shadow p-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-[#16305B]" />
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="bg-white rounded-lg shadow">
              <div className="divide-y">
                {upcomingEvents.map((event) => {
                  let dateLabel = "Invalid date";
                  try {
                    const parsed = parseISO(event.ScheduledDate);
                    if (!isNaN(parsed.getTime())) {
                      dateLabel = isToday(parsed)
                        ? `Today, ${format(parsed, "MMMM d")}`
                        : format(parsed, "EEEE, MMMM d, yyyy");
                    }
                  } catch {
                    // leave as "Invalid date"
                  }

                  return (
                    <div key={event.Id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedDate(event.ScheduledDate)}>
                      <div className="flex items-start gap-3">
                        <div className="text-sm font-medium text-[#16305B] w-24 flex-shrink-0 mt-1">
                          {event.ScheduledTime}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-1">
                            {getCaseName(event.PlaintiffGroups, event.DefendantGroups)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {dateLabel} • Case #{event.Id}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 bg-gray-50 text-center border-t">
                <p className="text-sm text-gray-600">
                  Showing {upcomingEvents.length} upcoming events.
                  <span className="font-semibold text-[#16305B] ml-1 cursor-pointer hover:underline" onClick={() => router.push('/attorney/calendar')}>
                    View all in Calendar section →
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded shadow p-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Events</h3>
              <p className="text-gray-600">
                You don't have any scheduled events. Schedule cases to see them here.
              </p>
            </div>
          )
        ) : (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar Section Locked</h3>
              <p className="text-gray-600">
                You will be able to view and manage your calendar once your account is verified by an administrator.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}