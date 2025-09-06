"use client";

import Image from "next/image";
import Link from "next/link";
import { Gavel, Users } from "lucide-react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { FC } from "react";

const SignupPage: FC = () => {
  return (
    <div className="min-h-screen bg-[#f9f7f2] flex flex-col font-sans">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-between pt-36 pb-0">
        <div className="max-w-6xl mx-auto w-full px-6">
          {/* Back Button */}
          <div className="mb-8">
            <Link href="/" className="text-[#0A2342] text-base hover:underline">
              &larr; Back
            </Link>
          </div>

          {/* Heading */}
          <h1
            className="text-3xl md:text-4xl font-bold text-[#0A2342] text-center mb-4"
            style={{ fontFamily: "inherit" }}
          >
            Create Your Quick Verdicts Account
          </h1>
          <p className="text-[#0A2342] text-lg text-center mb-12">
            It only takes a few minutes to get started. Please enter your information below to continue.
          </p>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 justify-center items-start max-w-4xl mx-auto">
            {/* Attorney Card */}
            <div className="bg-[#ede3cf] border border-[#e3e3e3] rounded-md shadow-sm px-8 py-10 flex flex-col items-center min-w-[320px]">
              <h2
                className="text-2xl font-bold text-[#0A2342] mb-2 text-center"
                style={{ fontFamily: "inherit" }}
              >
                Attorney Sign-Up
              </h2>
              <p className="text-[#0A2342] text-base text-center mb-8">
                Start, manage, or join a small claims trial as a licensed attorney.
              </p>
              <Link
                href="/signup/attorney"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#0A2342] text-white rounded-md font-semibold text-base hover:bg-[#132c54] transition mb-2"
              >
                <Gavel size={18} /> Continue as an Attorney
              </Link>
              <p className="text-[#0A2342] text-sm text-center mt-2">
                or{" "}
                <Link
                  href="/login"
                  className="underline hover:text-[#132c54] transition"
                >
                  Log In to Your Attorney Account
                </Link>
              </p>
            </div>

            {/* Juror Card */}
            <div className="bg-[#ede3cf] border border-[#e3e3e3] rounded-md shadow-sm px-8 py-10 flex flex-col items-center min-w-[320px]">
              <h2
                className="text-2xl font-bold text-[#0A2342] mb-2 text-center"
                style={{ fontFamily: "inherit" }}
              >
                Juror Sign-Up
              </h2>
              <p className="text-[#0A2342] text-base text-center mb-8">
                Sign up to serve in real trials and get paid for your time—100% online.
              </p>
              <Link
                href="/signup/juror"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#0A2342] text-white rounded-md font-semibold text-base hover:bg-[#132c54] transition mb-2"
              >
                <Users size={18} /> Continue as a Juror
              </Link>
              <p className="text-[#0A2342] text-sm text-center mt-2">
                or{" "}
                <Link
                  href="/login"
                  className="underline hover:text-[#132c54] transition"
                >
                  Log In to Your Juror Account
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
};

export default SignupPage;
