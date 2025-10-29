// ===== SCHEDULE TRIAL PAGE =====
// app/attorney/state/schedule-trail/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Stepper from "../../components/Stepper";
import { Calendar, Clock, MapPin, Monitor, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function BufferingAnimation() {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#16305B]"></div>
    </div>
  );
}

const allTimeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", 
  "15:00", "15:30", "16:00", "16:30", "17:00"
];

const getMonthName = (monthIndex: number) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[monthIndex];
};

const getDayName = (dayIndex: number) => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayIndex];
};

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const isToday = (date: Date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

const formatDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (date: Date) => {
  const dayName = getDayName(date.getDay());
  const monthName = getMonthName(date.getMonth());
  const day = date.getDate();
  const year = date.getFullYear();
  return `${dayName}, ${monthName} ${day}, ${year}`;
};

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

type BlockedSlot = {
  BlockedDate: string;
  BlockedTime: string;
};

export default function ScheduleTrialPage() {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [showDetails, setShowDetails] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [scheduled, setScheduled] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const router = useRouter();

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfMonth(currentYear, currentMonth);
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  useEffect(() => {
    fetchBlockedSlots();
  }, [currentYear, currentMonth]);

  const fetchBlockedSlots = async () => {
    setLoadingSlots(true);
    try {
      const startDate = new Date(currentYear, currentMonth, 1);
      const endDate = new Date(currentYear, currentMonth + 1, 0);
      
      const startDateStr = formatDateString(startDate);
      const endDateStr = formatDateString(endDate);

      const response = await fetch(
        `${API_BASE}/api/admin/calendar/blocked?startDate=${startDateStr}&endDate=${endDateStr}`
      );

      if (response.ok) {
        const data = await response.json();
        setBlockedSlots(data.blockedSlots || []);
      }
    } catch (error) {
      console.error("Error fetching blocked slots:", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const isDateAvailable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    const dayOfWeek = date.getDay();
    if (date < today || dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }

    const dateStr = formatDateString(date);
    const blockedTimesForDate = blockedSlots
      .filter(slot => {
        const slotDate = new Date(slot.BlockedDate);
        return formatDateString(slotDate) === dateStr;
      })
      .map(slot => slot.BlockedTime.substring(0, 5));

    const availableSlots = allTimeSlots.filter(time => !blockedTimesForDate.includes(time));
    return availableSlots.length > 0;
  };

  const getAvailableTimeSlots = () => {
    if (!selectedDate) return [];

    const dateStr = formatDateString(selectedDate);
    const blockedTimesForDate = blockedSlots
      .filter(slot => {
        const slotDate = new Date(slot.BlockedDate);
        return formatDateString(slotDate) === dateStr;
      })
      .map(slot => slot.BlockedTime.substring(0, 5));

    return allTimeSlots.filter(time => !blockedTimesForDate.includes(time));
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentYear, currentMonth - 1, 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentYear, currentMonth + 1, 1);
    setCurrentDate(newDate);
  };

  const handleDateSelect = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    if (isDateAvailable(date)) {
      setSelectedDate(date);
      setSelectedTime("");
      setShowDetails(false);
    }
  };

  const handleTimeSelect = (slot: string) => {
    setSelectedTime(slot);
    setShowDetails(true);
  };

  const handleSchedule = () => {
    setScheduled(true);
  };

  const handleComplete = async () => {
    setRedirecting(true);

    const voirDire2Questions = JSON.parse(localStorage.getItem("voirDire2Questions") || "[]");

    const generateCaseTitle = () => {
      try {
        const plaintiffGroups = JSON.parse(localStorage.getItem("plaintiffGroups") || "[]");
        const defendantGroups = JSON.parse(localStorage.getItem("defendantGroups") || "[]");
        
        const plaintiffName = plaintiffGroups[0]?.plaintiffs?.[0]?.name || "Plaintiff";
        const defendantName = defendantGroups[0]?.defendants?.[0]?.name || "Defendant";
        
        return `${plaintiffName} v. ${defendantName}`;
      } catch {
        return "Case Title";
      }
    };

    const caseDetails = {
      county: localStorage.getItem("county"),
      caseType: localStorage.getItem("caseTypeSelection"),
      caseTier: localStorage.getItem("caseTier"),
      civilOrCriminal: localStorage.getItem("caseType"),
      caseDescription: localStorage.getItem("caseDescription"),
      paymentMethod: localStorage.getItem("paymentMethod"),
      paymentAmount: localStorage.getItem("paymentAmount"),
      plaintiffGroups: JSON.parse(localStorage.getItem("plaintiffGroups") || "[]"),
      defendantGroups: JSON.parse(localStorage.getItem("defendantGroups") || "[]"),
      scheduledDate: selectedDate ? formatDateString(selectedDate) : '',
      scheduledTime: selectedTime + ":00",
      name,
      email,
    };

    const token = getCookie("token");

    const response = await fetch(`${API_BASE}/api/cases`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        caseType: caseDetails.caseType,
        caseTier: caseDetails.caseTier,
        county: caseDetails.county,
        caseTitle: generateCaseTitle(),
        caseDescription: caseDetails.caseDescription,
        paymentMethod: caseDetails.paymentMethod,
        paymentAmount: caseDetails.paymentAmount,
        scheduledDate: caseDetails.scheduledDate,
        scheduledTime: caseDetails.scheduledTime,
        plaintiffGroups: caseDetails.plaintiffGroups,
        defendantGroups: caseDetails.defendantGroups,
        voirDire2Questions: voirDire2Questions,
      }),
    });

    if (!response.ok) {
      alert("Failed to create case");
      setRedirecting(false);
      return;
    }

    setTimeout(() => {
      router.push("/attorney");
    }, 1800);
  };

  function getEndTime(start: string) {
    const [h, m] = start.split(":").map(Number);
    let endH = h + 2;
    let endM = m + 30;
    if (endM >= 60) {
      endH += 1;
      endM -= 60;
    }
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  }

  const availableTimeSlots = selectedDate ? getAvailableTimeSlots() : [];

  return (
    <div className="min-h-screen flex bg-[#faf8f3] font-sans">
      <aside className="hidden lg:flex flex-col w-[265px]">
        <div className="flex-1 text-white bg-[#16305B] relative">
          <div className="absolute top-15 left-0 w-full">
            <Image
              src="/logo_sidebar_signup.png"
              alt="Quick Verdicts Logo"
              width={300}
              height={120}
              className="w-full object-cover"
              priority
            />
          </div>
          <div className="px-8 py-8 mt-30">
            <h2 className="text-3xl font-medium mb-4">Schedule Trial</h2>
            <div className="text-sm leading-relaxed text-blue-100 space-y-3">
              <p>Select your preferred date and time for the trial.</p>
              <p className="text-xs text-blue-200">⚠️ Only available dates are shown</p>
            </div>
          </div>
        </div>
      </aside>

      <section className="flex-1 flex flex-col min-h-screen bg-[#faf8f3] px-0 md:px-0 mb-20">
        {redirecting ? (
          <div className="flex flex-col items-center justify-center w-full h-screen">
            <BufferingAnimation />
            <div className="mt-6 text-[#16305B] text-lg font-semibold">
              Creating case and opening dashboard...
            </div>
          </div>
        ) : (
          <>
            {/* Stepper */}
            <div className="w-full max-w-6xl mx-auto px-20">
              <Stepper currentStep={6} />
            </div>

            <div className="w-full max-w-6xl mx-auto mb-8 px-20">
              <h1 className="text-3xl font-bold text-[#16305B] mb-2">Schedule Trial</h1>
              <p className="text-gray-600 text-base">
                Choose your preferred date and time for this trial.
              </p>
            </div>

            {scheduled ? (
              <div className="flex-1 flex flex-col items-center justify-center px-8">
                <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-gray-200 p-10">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Trial Scheduled Successfully!</h2>
                    <p className="text-gray-600">A confirmation has been sent to your email address.</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4 text-lg">Trial Details</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-[#16305B] mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-600">Date</div>
                          <div className="font-medium text-gray-900">
                            {selectedDate ? formatDisplayDate(selectedDate) : "Not selected"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-[#16305B] mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-600">Time</div>
                          <div className="font-medium text-gray-900">
                            {selectedTime ? `${selectedTime} - ${getEndTime(selectedTime)}` : "Not selected"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-[#16305B] mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-600">Location</div>
                          <div className="font-medium text-gray-900">
                            {localStorage.getItem("county") || "County, State"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Monitor className="w-5 h-5 text-[#16305B] mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-600">Format</div>
                          <div className="font-medium text-gray-900">Virtual Trial (Details will follow)</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full bg-[#16305B] text-white font-semibold px-8 py-3 rounded-lg hover:bg-[#0A2342] transition-colors"
                    onClick={handleComplete}
                  >
                    Complete & Go to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex justify-center px-8">
                <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="grid md:grid-cols-2">
                    {/* Left Side - Calendar */}
                    <div className="p-8 border-r border-gray-200">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Select Date</h2>
                        {loadingSlots && (
                          <span className="text-sm text-blue-600">Loading...</span>
                        )}
                      </div>

                      {/* Month Navigation */}
                      <div className="flex items-center justify-between mb-6">
                        <button 
                          onClick={handlePrevMonth}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          aria-label="Previous month"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <span className="text-lg font-semibold text-gray-900">
                          {getMonthName(currentMonth)} {currentYear}
                        </span>
                        <button 
                          onClick={handleNextMonth}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          aria-label="Next month"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>

                      {/* Calendar Grid */}
                      <div className="mb-4">
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                            <div key={day} className="text-xs font-semibold text-gray-500 text-center py-2">
                              {day}
                            </div>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: startOffset }, (_, index) => (
                            <div key={`empty-${index}`} className="h-10"></div>
                          ))}
                          
                          {Array.from({ length: daysInMonth }, (_, index) => {
                            const day = index + 1;
                            const date = new Date(currentYear, currentMonth, day);
                            const isAvailable = isDateAvailable(date);
                            const isTodayDate = isToday(date);
                            const isSelected = selectedDate && 
                              selectedDate.getDate() === day && 
                              selectedDate.getMonth() === currentMonth &&
                              selectedDate.getFullYear() === currentYear;
                            
                            return (
                              <button
                                key={day}
                                type="button"
                                className={`h-10 rounded-lg text-sm font-medium transition-all ${
                                  isSelected
                                    ? "bg-[#16305B] text-white shadow-md"
                                    : isAvailable
                                    ? "text-gray-900 hover:bg-blue-50 border border-gray-200"
                                    : "text-gray-300 bg-gray-50 cursor-not-allowed"
                                } ${
                                  isTodayDate && !isSelected
                                    ? "border-2 border-[#16305B]"
                                    : ""
                                }`}
                                disabled={!isAvailable}
                                onClick={() => handleDateSelect(day)}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="flex gap-4 text-xs text-gray-600 mt-6 pt-6 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-[#16305B] rounded"></div>
                          <span>Today</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
                          <span>Unavailable</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Time Selection or Details */}
                    <div className="p-8 bg-gray-50">
                      {!selectedDate ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <Calendar className="w-16 h-16 text-gray-300 mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Date</h3>
                          <p className="text-gray-600 text-sm">
                            Choose an available date from the calendar to see time slots
                          </p>
                        </div>
                      ) : !showDetails ? (
                        <>
                          <div className="mb-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Select Time</h3>
                            <p className="text-sm text-gray-600">
                              {formatDisplayDate(selectedDate)}
                            </p>
                          </div>
                          
                          {availableTimeSlots.length === 0 ? (
                            <div className="text-center py-12">
                              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                              <p className="text-gray-600 font-medium mb-4">No available time slots</p>
                              <button
                                className="text-[#16305B] font-medium underline"
                                onClick={() => setSelectedDate(null)}
                              >
                                Choose a different date
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                              {availableTimeSlots.map((slot) => (
                                <button
                                  key={slot}
                                  type="button"
                                  className={`py-3 px-4 text-center border-2 rounded-lg font-medium transition-all ${
                                    selectedTime === slot
                                      ? "bg-[#16305B] text-white border-[#16305B] shadow-md"
                                      : "bg-white text-gray-900 border-gray-200 hover:border-[#16305B] hover:bg-blue-50"
                                  }`}
                                  onClick={() => handleTimeSelect(slot)}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="mb-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Enter Details</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDisplayDate(selectedDate)}</span>
                              <span className="mx-2">•</span>
                              <Clock className="w-4 h-4" />
                              <span>{selectedTime}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-4 mb-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16305B] focus:border-transparent"
                                placeholder="Enter your full name"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16305B] focus:border-transparent"
                                placeholder="Enter your email"
                              />
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500 mb-6 p-3 bg-gray-100 rounded-lg">
                            By proceeding, you confirm that you agree to our Terms of Use and Privacy Policy.
                          </div>
                          
                          <button
                            type="button"
                            className="w-full bg-[#16305B] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#0A2342] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!name || !email}
                            onClick={handleSchedule}
                          >
                            Schedule Trial
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}