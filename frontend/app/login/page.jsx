"use client";
import Image from "next/image";
import Link from "next/link";
import Footer from "../components/Footer"
import Navbar from "../components/Navbar"
import { ArrowLeft, Gavel, Users } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f9f7f2] flex flex-col font-sans">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-between pt-36 pb-0">
        <div className="max-w-6xl mx-auto w-full px-6">
          {/* Back Button */}
          <div className="mb-8">
            <Link
              href="/"
              className="text-[#0A2342] text-base hover:underline flex items-center gap-1"
            >
              <ArrowLeft size={18} /> Back
            </Link>
          </div>
          {/* Heading */}
          <h1 className="text-3xl md:text-4xl font-bold text-[#0A2342] text-center mb-2" style={{ fontFamily: "inherit" }}>
            Log into Your Quick Verdicts Account
          </h1>
          <p className="text-[#0A2342] text-lg text-center mb-12">
            Select your role below to log in
          </p>
          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 justify-center items-start max-w-4xl mx-auto">
            {/* Attorney Login Card */}
            <div className="bg-[#ede3cf] border border-[#e3e3e3] rounded-md shadow-sm px-8 py-10 flex flex-col items-center min-w-[320px]">
              <h2 className="text-2xl font-bold text-[#0A2342] mb-2 text-center" style={{ fontFamily: "inherit" }}>
                Attorney Login
              </h2>
              <p className="text-[#0A2342] text-base text-center mb-8">
                Start, manage, or join a small claims trial as a licensed attorney.
              </p>
              <Link
                href="/login/attorney"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#0A2342] text-white rounded-md font-semibold text-base hover:bg-[#132c54] transition mb-2"
              >
                <Gavel size={18} /> Login as an Attorney
              </Link>
              <p className="text-[#0A2342] text-sm text-center mt-2">
                or{" "}
                <Link
                  href="/signup/attorney"
                  className="underline hover:text-[#132c54] transition"
                >
                  Create a New Attorney Account
                </Link>
              </p>
            </div>
            {/* Juror Login Card */}
            <div className="bg-[#ede3cf] border border-[#e3e3e3] rounded-md shadow-sm px-8 py-10 flex flex-col items-center min-w-[320px]">
              <h2 className="text-2xl font-bold text-[#0A2342] mb-2 text-center" style={{ fontFamily: "inherit" }}>
                Juror Login
              </h2>
              <p className="text-[#0A2342] text-base text-center mb-8">
                Serve in real trials and get paid for your time—100% online.
              </p>
              <Link
                href="/login/juror"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#0A2342] text-white rounded-md font-semibold text-base hover:bg-[#132c54] transition mb-2"
              >
                <Users size={18} /> Login as a Juror
              </Link>
              <p className="text-[#0A2342] text-sm text-center mt-2">
                or{" "}
                <Link
                  href="/signup/juror"
                  className="underline hover:text-[#132c54] transition"
                >
                  Create a New Juror Account
                </Link>
              </p>
            </div>
          </div>
        </div>
        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}
