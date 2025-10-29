"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { ArrowLeft, Gavel, Users } from "lucide-react";

interface RoleCardProps {
  title: string;
  description: string;
  loginHref: string;
  signupHref: string;
  icon: React.ElementType;
  loginLabel: string;
  signupLabel: string;
}

function RoleCard({
  title,
  description,
  loginHref,
  signupHref,
  icon: Icon,
  loginLabel,
  signupLabel,
}: RoleCardProps) {
  return (
    <div className="bg-[#ede3cf] border border-[#e3e3e3] rounded-md shadow-sm px-8 py-10 flex flex-col items-center min-w-[320px]">
      <h2
        className="text-2xl font-bold text-[#0A2342] mb-2 text-center"
        style={{ fontFamily: "inherit" }}
      >
        {title}
      </h2>
      <p className="text-[#0A2342] text-base text-center mb-8">
        {description}
      </p>
      <Link
        href={loginHref}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#0A2342] text-white rounded-md font-semibold text-base hover:bg-[#132c54] transition mb-2"
      >
        <Icon size={18} /> {loginLabel}
      </Link>
      <p className="text-[#0A2342] text-sm text-center mt-2">
        or{" "}
        <Link
          href={signupHref}
          className="underline hover:text-[#132c54] transition"
        >
          {signupLabel}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState(0);

  // Preload critical images
  useEffect(() => {
    const imagesToLoad = [
      "/logo_sidebar_signup.png"
    ];

    let loaded = 0;
    imagesToLoad.forEach((src) => {
      const img = new window.Image();
      img.src = src;
      img.onload = () => {
        loaded++;
        setLoadedImages(loaded);
        if (loaded === imagesToLoad.length) {
          setIsLoading(false);
        }
      };
      img.onerror = () => {
        loaded++;
        setLoadedImages(loaded);
        if (loaded === imagesToLoad.length) {
          setIsLoading(false);
        }
      };
    });
  }, []);

  // Loading Screen
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#f9f7f2] flex flex-col items-center justify-center z-50">
        <div className="text-center">
          <div className="mb-4">
            <Image
              src="/logo_sidebar_signup.png"
              alt="Quick Verdicts Logo"
              width={200}
              height={80}
              priority
            />
          </div>
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0A2342] transition-all duration-300"
              style={{
                width: `${(loadedImages / 1) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

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
          <h1
            className="text-3xl md:text-4xl font-bold text-[#0A2342] text-center mb-2"
            style={{ fontFamily: "inherit" }}
          >
            Log into Your Quick Verdicts Account
          </h1>
          <p className="text-[#0A2342] text-lg text-center mb-12">
            Select your role below to log in
          </p>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 justify-center items-start max-w-4xl mx-auto">
            <RoleCard
              title="Attorney Login"
              description="Start, manage, or join a small claims trial as a licensed attorney."
              loginHref="/login/attorney"
              signupHref="/signup/attorney"
              icon={Gavel}
              loginLabel="Login as an Attorney"
              signupLabel="Create a New Attorney Account"
            />
            <RoleCard
              title="Juror Login"
              description="Serve in real trials and get paid for your time—100% online."
              loginHref="/login/juror"
              signupHref="/signup/juror"
              icon={Users}
              loginLabel="Login as a Juror"
              signupLabel="Create a New Juror Account"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12">
          <Footer />
        </div>
      </main>
    </div>
  );
}
