"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// Buffering animation component
function BufferingAnimation() {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#16305B]"></div>
    </div>
  );
}

const timeSlots = [
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", 
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
];

// Calendar utility functions
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

const isSameDate = (date1: Date | null, date2: Date) => {
  if (!date1) return false;
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
};

const isDateAvailable = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const dayOfWeek = date.getDay();
  return date >= today && dayOfWeek !== 0 && dayOfWeek !== 6;
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

export default function ScheduleTrialPage() {
  const steps = [
    "Case Details",
    "Plaintiff Details", 
    "Defendant Details",
    "Voir Dire Part 1 & 2",
    "Payment Details",
    "Review",
    "Schedule",
  ];

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
  const router = useRouter();

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfMonth(currentYear, currentMonth);
  
  // Adjust for Monday start (0 = Sunday, 1 = Monday)
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

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
    setRedirecting(true); // Show animation
    const user = JSON.parse(localStorage.getItem("attorneyUser") || "{}");

    const caseDetails = {
      county: localStorage.getItem("county"),
      caseType: localStorage.getItem("caseType"),
      caseTier: localStorage.getItem("caseTier"),
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

    await fetch(`${API_BASE}/api/schedule-trial`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...caseDetails,
        UserId: user.email,
      }),
    });

    // Show animation for 1.8s before redirecting
    setTimeout(() => {
      router.push("/attorney");
    }, 1800);
  };

  // Helper to get end time (adds 2.5 hours to start time)
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

  return (
    <div className="min-h-screen flex bg-[#faf8f3] font-sans">
      {/* Sidebar */}
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
            <h2 className="text-3xl font-medium mb-4">Quick Verdicts</h2>
            <div className="text-sm leading-relaxed text-blue-100 space-y-3">
              <p>Schedule your trial date and time.</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <section className="flex-1 flex flex-col min-h-screen bg-[#faf8f3] px-0 md:px-0 mb-20">
        {redirecting ? (
          <div className="flex flex-col items-center justify-center w-full h-screen">
            <BufferingAnimation />
            <div className="mt-6 text-[#16305B] text-lg font-semibold">
              Opening dashboard...
            </div>
          </div>
        ) : (
          <>
            {/* Stepper */}
            <div className="flex items-center justify-between px-8 pb-8 pt-8">
              {steps.map((label, idx) => {
                const isActive = idx === 6;
                return (
                  <div key={label} className="flex items-center flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                          ${isActive ? "border-[#16305B]" : "border-[#bfc6d1] bg-transparent"}
                        `}
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isActive ? "bg-[#16305B]" : "bg-transparent"
                          }`}
                        ></span>
                      </div>
                      <span
                        className={`text-xs leading-tight max-w-[90px] ${
                          isActive
                            ? "text-[#16305B] font-semibold"
                            : "text-[#bfc6d1]"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className="flex-1 h-[1px] bg-[#bfc6d1] ml-4 mr-4"></div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="w-full max-w-4xl mx-auto mb-8 px-6">
              <h1 className="text-3xl font-semibold text-[#333333] mb-2">Schedule Trial</h1>
              <p className="text-[#666666] text-base">
                Choose your ideal date and time for this trial you are filing.
              </p>
            </div>

            {/* Scheduled Confirmation */}
            {scheduled ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-full max-w-xl bg-white rounded-xl shadow border border-[#e5e7eb] flex flex-col items-center py-10 px-8">
                  <div className="mb-4">
                    <Image
                      src="/user-avatar.png"
                      alt="User Avatar"
                      width={56}
                      height={56}
                      className="rounded-full"
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[#16305B] text-2xl">✔️</span>
                    <span className="text-black font-semibold text-lg">
                      You are scheduled
                    </span>
                  </div>
                  <div className="text-gray-500 text-sm mb-6 text-center">
                    A calendar invitation has been sent to your email address.
                  </div>
                  <div className="w-full bg-white border border-[#e5e7eb] rounded-lg p-6 mb-6">
                    <div className="font-bold text-black mb-2">Trial Scheduling</div>
                    <div className="flex items-center gap-2 mb-2 text-black">
                      <span>👤</span>
                      <span>{name || "Joe Attorney"}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2 text-black">
                      <span>🕒</span>
                      <span>
                        {selectedTime && selectedDate
                          ? `${selectedTime} - ${getEndTime(selectedTime)}, ${formatDisplayDate(selectedDate)}`
                          : "16:00 - 18:30, Monday, August 19, 2025"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2 text-black">
                      <span>📍</span>
                      <span>Dallas, Texas, USA</span>
                    </div>
                    <div className="flex items-center gap-2 text-black">
                      <span>🖥️</span>
                      <span>Web conferencing details to follow.</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full bg-[#16305B] text-white font-semibold px-8 py-3 rounded-md hover:bg-[#0A2342] transition"
                    onClick={handleComplete}
                  >
                    Complete
                  </button>
                </div>
              </div>
            ) : (
              // Main Scheduling Interface
              <div className="flex-1 flex justify-center">
                <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-[#e5e7eb] flex overflow-hidden" style={{ height: 'fit-content' }}>
                  
                  {/* Left Info Panel */}
                  <div className="w-80 bg-white p-8 flex flex-col">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mr-3">
                        <Image
                          src="/user-avatar.png"
                          alt="Quick Verdicts"
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 font-medium">Quick Verdicts</div>
                      </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Trial Scheduling</h2>
                    
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center text-gray-700">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">2hr 30 min</span>
                      </div>
                      
                      <div className="flex items-start text-gray-700">
                        <svg className="w-5 h-5 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm leading-relaxed">Web conferencing details provided upon confirmation.</span>
                      </div>
                    </div>

                    {selectedDate && selectedTime && (
                      <div className="border-t border-gray-200 pt-6">
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center text-gray-700">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">{selectedTime} - {getEndTime(selectedTime)}, {formatDisplayDate(selectedDate)}</span>
                          </div>
                          <div className="flex items-center text-gray-700">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Dallas, Texas, USA</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Selection Panel */}
                  <div className="flex-1 bg-gray-50 p-8 border-l border-gray-200">
                    
                    {!selectedDate ? (
                      // Calendar View
                      <>
                        <div className="mb-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Date & Time</h3>
                        </div>
                        
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-2">
                          <button 
                            onClick={handlePrevMonth}
                            className="p-1 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <span className="text-base font-semibold text-gray-900">
                            {getMonthName(currentMonth)} {currentYear}
                          </span>
                          <button 
                            onClick={handleNextMonth}
                            className="p-1 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Days of Week */}
                        <div className="grid grid-cols-7 gap-0.5 mb-1">
                          {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
                            <div key={day} className="text-xs font-medium text-gray-500 text-center py-1">
                              {day}
                            </div>
                          ))}
                        </div>
                        
                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-0.5 mb-4">
                          {/* Empty cells for days before month starts */}
                          {Array.from({ length: startOffset }, (_, index) => (
                            <div key={`empty-${index}`} className="h-8"></div>
                          ))}
                          
                          {/* Days of the month */}
                          {Array.from({ length: daysInMonth }, (_, index) => {
                            const day = index + 1;
                            const date = new Date(currentYear, currentMonth, day);
                            const isAvailable = isDateAvailable(date);
                            const isTodayDate = isToday(date);
                            
                            return (
                              <button
                                key={day}
                                type="button"
                                className={`h-8 w-8 text-xs font-medium rounded transition-all ${
                                  isAvailable
                                    ? "text-gray-900 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                                    : "text-gray-300 cursor-not-allowed"
                                } ${
                                  isTodayDate && isAvailable
                                    ? "bg-blue-500 text-white hover:bg-blue-600"
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

                        {/* Time Zone */}
                        <div className="mt-8">
                          <div className="text-sm font-medium text-gray-700 mb-2">Time zone</div>
                          <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Central European Time (8:11pm)</span>
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </>
                    ) : !showDetails ? (
                      // Time Selection View
                      <>
                        <div className="mb-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Date & Time</h3>
                          <p className="text-blue-600 font-medium">{formatDisplayDate(selectedDate).split(',')[0]}, {getMonthName(selectedDate.getMonth())} {selectedDate.getDate()}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2">
                          {timeSlots.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              className={`py-3 px-4 text-center border rounded-lg font-medium transition-all ${
                                selectedTime === slot
                                  ? "bg-blue-500 text-white border-blue-500"
                                  : "bg-white text-blue-600 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                              }`}
                              onClick={() => handleTimeSelect(slot)}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>

                        {/* Time Zone */}
                        <div className="mt-8">
                          <div className="text-sm font-medium text-gray-700 mb-2">Time zone</div>
                          <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Central European Time (8:11pm)</span>
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </>
                    ) : (
                      // Details Entry Form
                      <>
                        <div className="mb-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">Enter details</h3>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full px-4 py-3 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter your name"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full px-4 py-3 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter your email"
                            />
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500 mb-6">
                          By proceeding, you confirm that you have read and agree to <span className="text-blue-600 underline">Calendly's Terms of Use</span> and <span className="text-blue-600 underline">Privacy Notice</span>.
                        </div>
                        
                        <button
                          type="button"
                          className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!name || !email}
                          onClick={handleSchedule}
                        >
                          Schedule Event
                        </button>
                      </>
                    )}
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