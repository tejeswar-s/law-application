"use client";

import React, { useState } from "react";
import Image from "next/image";

const availableDates = ["23", "24", "25", "26", "29", "30"];
const timeSlots = [
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
];

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

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [showDetails, setShowDetails] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [scheduled, setScheduled] = useState(false);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime("");
    setShowDetails(false);
  };

  const handleTimeSelect = (slot: string) => {
    setSelectedTime(slot);
    setShowDetails(true);
  };

  const handleSchedule = () => {
    setScheduled(true);
  };

  const handleComplete = async () => {
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
      scheduledDate: `2025-08-${selectedDate.padStart(2, "0")}`,  // ✅ FIX
        scheduledTime: selectedTime + ":00",                 
      name,
      email,
    };
    console.log({
  county: localStorage.getItem("county"),
  caseType: localStorage.getItem("caseType"),
  // ...etc
});

    await fetch("http://localhost:4000/api/schedule-trial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...caseDetails,
        UserId: user.email, // or user.id if you have it
      }),
    });
  };

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
        <div className="w-full max-w-6xl mx-auto px-20">
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
        </div>

        {/* Heading + Subheading */}
        <div className="w-full max-w-3xl mx-auto mb-6 px-6">
          <h1 className="text-2xl font-semibold text-black">Schedule Trial</h1>
          <p className="text-black text-sm">
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
                    {selectedTime
                      ? `${selectedTime} - ${getEndTime(selectedTime)}, Monday, August ${selectedDate}, 2025`
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
          // Schedule Trial Card
          <div className="flex-1 flex flex-col items-center">
            <div className="w-full max-w-4xl bg-white rounded-xl shadow border border-[#e5e7eb] flex flex-row p-0 overflow-hidden">
              {/* Left Section */}
              <div className="w-1/2 flex flex-col items-center justify-center py-8 px-8">
                <div className="mb-4">
                  <Image
                    src="/user-avatar.png"
                    alt="User Avatar"
                    width={56}
                    height={56}
                    className="rounded-full"
                  />
                </div>
                <div className="text-black font-bold text-lg mb-2">
                  Quick Verdicts
                </div>
                <div className="text-black font-bold text-2xl mb-2">
                  Trial Scheduling
                </div>
                <div className="text-black mb-2 flex items-center gap-2 text-base">
                  <span>⏱</span> 2 hr 30 min
                </div>
                <div className="text-black text-base mb-2 flex items-center gap-2">
                  <span>🖥️</span> Web conferencing details provided upon confirmation.
                </div>
              </div>

              {/* Right Section */}
              <div className="w-1/2 bg-white py-8 px-8 border-l border-[#e5e7eb] flex flex-col justify-between">
                {!selectedDate ? (
                  <>
                    {/* Calendar UI */}
                    <div className="text-black font-semibold text-lg mb-2">
                      Select a Date & Time
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <button className="text-gray-500 text-xl px-2">‹</button>
                      <span className="text-base text-black font-medium">
                        August 2025
                      </span>
                      <button className="text-gray-500 text-xl px-2">›</button>
                    </div>
                    <div className="grid grid-cols-7 text-center text-xs text-black mb-2 font-semibold">
                      {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
                        <div key={d}>{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2 mb-6">
                      {Array.from({ length: 31 }, (_, i) => {
                        const day = (i + 1).toString();
                        const isAvailable = availableDates.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            className={`w-8 h-8 rounded-full border text-xs font-semibold ${
                              isAvailable
                                ? "bg-[#e0e6f1] hover:bg-[#bfc6d1] text-black"
                                : "bg-[#f7f6f3] text-[#bfc6d1] cursor-not-allowed"
                            }`}
                            disabled={!isAvailable}
                            onClick={() => handleDateSelect(day)}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : !showDetails ? (
                  <>
                    <div className="text-black font-semibold mb-2">
                      {`Thursday, August ${selectedDate}`}
                    </div>
                    <div className="flex flex-col gap-2 h-64 overflow-y-auto mb-4">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          className={`w-full py-2 rounded border text-base font-semibold ${
                            selectedTime === slot
                              ? "bg-[#16305B] text-white border-[#16305B]"
                              : "bg-white text-[#16305B] border-[#e0e6f1] hover:bg-[#e0e6f1]"
                          }`}
                          onClick={() => handleTimeSelect(slot)}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-black font-semibold text-lg mb-4">
                      Enter details
                    </div>
                    <input
                      type="text"
                      placeholder="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border text-[#16305B] rounded px-3 py-2 mb-3 text-sm"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border text-[#16305B] rounded px-3 py-2 mb-3 text-sm"
                    />
                    <div className="text-black text-sm mb-4">
                      <strong>Selected:</strong> {`August ${selectedDate}, ${selectedTime}`}
                    </div>
                    <button
                      type="button"
                      className="bg-[#16305B] text-white w-full py-2 rounded font-semibold hover:bg-[#0A2342]"
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
      </section>
    </div>
  );

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
}
