"use client";

import { useEffect, useState } from "react";

type AttorneyUser = {
  firstName: string;
  lastName: string;
  email: string;
  lawFirmName: string;
  phoneNumber: string;
  state: string;
};

export default function AttorneyMainSection() {
  const [user, setUser] = useState<AttorneyUser | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("attorneyUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <main className="flex-1 px-10 py-8 bg-[#F7F6F3]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#16305B]">
          Welcome back{user ? `, ${user.firstName}!` : "!"}
        </h1>
        <div className="flex items-center gap-4">
          <button className="text-[#16305B] hover:underline">Help</button>
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
            onClick={() => window.location.href = "/cases/new"}
          >
            + New Case
          </button>
        </div>
        <div className="bg-white rounded shadow p-8 flex flex-col items-center justify-center min-h-[120px]">
          <p className="text-[#6B7280] mb-2">You do not have any active cases.</p>
          <p className="text-[#6B7280] mb-4">
            Click on{" "}
            <button 
              className="bg-[#16305B] text-white px-3 py-1 rounded mx-1 hover:bg-[#1e417a] transition-colors"
              onClick={() => window.location.href = "/cases/new"}
            >
              New Case
            </button>{" "}
            to file a new case.
          </p>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section>
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-lg font-bold text-[#16305B]">Upcoming Events</h2>
            <p className="text-sm text-[#6B7280]">Manage and access your cases quickly</p>
          </div>
          <button className="bg-[#16305B] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#1e417a] transition-colors">
            + Add Event
          </button>
        </div>
        <div className="bg-white rounded shadow p-8 flex flex-col items-center justify-center min-h-[120px]">
          <p className="text-[#6B7280] mb-2">You do not have anything in your calendar.</p>
          
          {/* Calendar Sync Buttons */}
          <div className="flex gap-4 mb-4">
            <button className="bg-[#e6eefc] text-[#16305B] px-4 py-2 rounded flex items-center gap-2 border border-[#bfc6d1] hover:bg-[#d0e2ff] transition-colors">
              <img 
                src="/outlook-icon.png" 
                alt="Outlook" 
                className="h-5 w-5"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              Sync my Outlook Calendar
            </button>
            <button className="bg-[#e6eefc] text-[#16305B] px-4 py-2 rounded flex items-center gap-2 border border-[#bfc6d1] hover:bg-[#d0e2ff] transition-colors">
              <img 
                src="/google-icon.png" 
                alt="Google" 
                className="h-5 w-5"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              Sync my Google Calendar
            </button>
          </div>
          
          <p className="text-[#6B7280] mb-2">or</p>
          
          <button className="bg-[#16305B] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#1e417a] transition-colors">
            + Add Event
          </button>
        </div>
      </section>
    </main>
  );
}