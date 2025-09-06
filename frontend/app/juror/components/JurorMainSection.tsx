"use client";

import Image from "next/image";
import {
  QuestionMarkCircleIcon, // Help
  ArrowUpRightIcon,       // Apply
} from "@heroicons/react/24/outline";
import {
  BanknotesIcon,          // Better Money Icon
  TruckIcon,              // Car replacement
} from "@heroicons/react/24/solid";

export default function JurorMainSection() {
  const tasks = [
    {
      title: "Introduction to Quick Verdicts Video",
      duration: "5 minutes",
      img: "/introduction_video.png",
    },
    {
      title: "Juror Quiz",
      duration: "3 minutes",
      img: "/juror_quiz.png",
    },
  ];

  const jobs = [
    { title: "Vehicle Damage Case", date: "11/12/2025", time: "11:00 AM - 4:00 PM", price: 50 },
    { title: "Property Theft Case", date: "12/15/2025", time: "10:00 AM - 3:00 PM", price: 75 },
    { title: "Assault Charge", date: "01/20/2026", time: "1:00 PM - 5:00 PM", price: 100 },
    { title: "Fraud Investigation", date: "02/10/2026", time: "9:00 AM - 12:00 PM", price: 150 },
    { title: "Contract Dispute", date: "03/05/2026", time: "2:00 PM - 6:00 PM", price: 125 },
    { title: "Breach of Privacy", date: "04/15/2026", time: "11:30 AM - 4:30 PM", price: 200 },
    { title: "Intellectual Property", date: "05/25/2026", time: "10:00 AM - 3:00 PM", price: 300 },
  ];

  return (
    <main className="flex-1 p-8 md:p-10 bg-[#FAF9F6] min-h-screen overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#0C2D57] leading-tight">
            Welcome, John!
          </h1>
          <p className="mt-2 text-sm text-gray-600">Good to see you — here's what's next</p>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-700">
          <button className="flex items-center gap-2 px-3 py-1 rounded hover:bg-white/60">
            <QuestionMarkCircleIcon className="w-5 h-5 text-gray-600" />
            <span>Help</span>
          </button>
        </div>
      </div>

      {/* My Tasks */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-[#0C2D57]">My Tasks</h2>
            <p className="text-sm text-gray-600">Before you get started complete these modules</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {tasks.map((t, i) => (
            <article
              key={i}
              className="relative rounded-md bg-white shadow-sm overflow-hidden"
            >
              {/* Image with white spacing */}
              <div className="p-4">
                <div className="relative w-full h-40 rounded-md overflow-hidden">
                  <Image
                    src={t.img}
                    alt={t.title}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="px-4 pb-10">
                <h3 className="font-medium text-[15px] text-[#0C2D57] leading-snug">
                  {t.title}
                </h3>
                <p className="text-xs text-gray-500 mt-2">{t.duration}</p>
              </div>

              {/* Radio bottom-right */}
              <div className="absolute right-4 bottom-4">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center" />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Job Board */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-[#0C2D57]">Job Board</h2>
          <p className="text-sm text-gray-600">Apply to available trial postings</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {jobs.map((job, idx) => (
            <div
              key={idx}
              className="border rounded-md bg-white shadow-sm p-4 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-md bg-gray-100 flex items-center justify-center text-gray-400">
                  <TruckIcon className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm text-[#0C2D57]">{job.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">Trial Date: {job.date}</p>
                  <p className="text-xs text-gray-500">{job.time}</p>
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
      </section>
    </main>
  );
}
