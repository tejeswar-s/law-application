"use client";

import Image from "next/image";
import {
  QuestionMarkCircleIcon, // Help
  ArrowUpRightIcon,       // Apply
} from "@heroicons/react/24/outline";
import {
  BanknotesIcon,          // Better Money Icon
  TruckIcon,              // Car replacement
  AdjustmentsVerticalIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";

export default function JobBoardSection() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("");

  useEffect(() => {
    // Fetch attorney cases for job board
    const fetchJobs = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/cases");
        const data = await res.json();
        const cases = Array.isArray(data) ? data : (Array.isArray(data.recordset) ? data.recordset : []);
        setJobs(cases.map((c: any) => ({
          name: getCaseName(c.PlaintiffGroups, c.DefendantGroups),
          trialDate: c.ScheduledDate ? new Date(c.ScheduledDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
          trialTime: c.ScheduledTime,
          price: c.JurorPay || c.jurorPay || c.PaymentAmount || 0, // Extract payment details
          id: c.Id,
          scheduledDate: c.ScheduledDate,
          jurorPay: c.JurorPay || c.jurorPay || c.PaymentAmount || 0,
        })));
      } catch (err) {
        // handle error
      }
    };
    fetchJobs();
  }, []);

  const handleSearchChange = (e: any) => {
    setSearchQuery(e.target.value);
  };

  const handleSortChange = (e: any) => {
    setSortBy(e.target.value);
  };

  const filteredJobs = jobs.filter((job) =>
    job.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === "trialDateAscending") {
      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
    }
    if (sortBy === "trialDateDescending") {
      return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime();
    }
    if (sortBy === "compensationAscending") {
      return a.jurorPay - b.jurorPay;
    }
    if (sortBy === "compensationDescending") {
      return b.jurorPay - a.jurorPay;
    }
    return 0;
  });

  return (
    <main className="flex-1 min-h-screen overflow-y-auto p-0">
      <div className="p-8 md:p-10 bg-[#FAF9F6] min-h-screen w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0C2D57] leading-tight">
              Job Board
            </h1>
            <p className="mt-2 text-sm text-gray-600">Apply to available trial postings</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <button className="flex items-center gap-2 px-3 py-1 rounded hover:bg-white/60">
              <QuestionMarkCircleIcon className="w-5 h-5 text-gray-600" />
              <span>Help</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center w-2/3">
            <input
              type="text"
              placeholder="Search"
              className="w-full px-4 py-2 border rounded-md text-sm text-gray-700"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <button className="bg-[#0C2D57] text-white px-4 py-2 rounded-md ml-2">
              Search
            </button>
          </div>

          {/* Sort By Filter */}
          <div className="relative inline-block text-left">
            <div>
              <select
                className="px-4 py-2 border rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0C2D57]"
                value={sortBy}
                onChange={handleSortChange}
              >
                <option value="">Sort By</option>
                <option value="trialDateAscending">Trial Date Ascending</option>
                <option value="trialDateDescending">Trial Date Descending</option>
                <option value="compensationAscending">Compensation Ascending</option>
                <option value="compensationDescending">Compensation Descending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Job Board (always show) */}
        <section>
          {sortedJobs.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              No cases are currently available.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sortedJobs.map((job, idx) => (
                <div key={job.id} className="border rounded-md bg-white shadow-sm p-4 flex flex-col justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-md bg-gray-100 flex items-center justify-center text-gray-400">
                      <TruckIcon className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm text-[#0C2D57]">{job.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">Trial Date: {job.trialDate}</p>
                      <p className="text-xs text-gray-500">Time: {job.trialTime}</p>
                    </div>
                  </div>
                  {/* Footer: Apply + Money */}
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      className="flex items-center justify-center gap-1 w-1/2 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50"
                      title="Apply"
                    >
                      <ArrowUpRightIcon className="w-4 h-4 text-gray-600" />
                      Apply
                    </button>
                    <div className="flex items-center justify-center gap-1 w-1/2 text-green-600 font-semibold">
                      <BanknotesIcon className="w-5 h-5" />
                      <span>${job.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
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
