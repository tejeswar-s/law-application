import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  userType: 'attorney' | 'juror';
  step: number;
  sidebarContent: {
    title: string;
    description: string;
  };
  onBack: () => void;
  showSignup?: boolean;
}

export function AuthLayout({
  children,
  userType,
  step,
  sidebarContent,
  onBack,
  showSignup = true,
}: AuthLayoutProps) {
  const bgColor = userType === 'attorney' ? '#16305B' : '#0A2342';
  
  return (
    <div className="min-h-screen flex bg-[#faf8f3] font-sans">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-[280px]">
        <div className="flex-1 text-white relative" style={{ backgroundColor: bgColor }}>
          {/* Logo */}
          <div className="absolute top-15 left-0 w-full">
            <Link href="/">
              <Image
                src="/logo_sidebar_signup.png"
                alt="Quick Verdicts Logo"
                width={300}
                height={120}
                className="w-full object-cover"
                priority
              />
            </Link>
          </div>

          {/* Content */}
          <div className="px-6 py-8 mt-48">
            <h2 className="text-xl font-semibold mb-4">
              {sidebarContent.title}
            </h2>
            <div className="text-sm leading-relaxed text-blue-100 space-y-3">
              <p>{sidebarContent.description}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <section className="flex-1 flex flex-col min-h-screen bg-[#faf8f3] px-0 md:px-0">
        {/* Top Row */}
        <div className="w-full max-w-6xl mx-auto px-20">
          <div className="flex items-center justify-between pt-8 pb-8 px-8">
            <div className="flex items-center gap-2">
              <button
                onClick={onBack}
                className="text-[#16305B] text-base flex items-center gap-2 hover:underline"
                type="button"
              >
                <ArrowLeft size={18} /> Back
              </button>
            </div>
            {showSignup && (
              <div className="flex items-center gap-4">
                <span className="text-[#16305B] text-sm">
                  Already have an account?
                </span>
                <Link href={`/login/${userType}`}>
                  <button className="border border-[#16305B] text-[#16305B] rounded-md px-4 py-1.5 text-sm hover:bg-[#f3f6fa] transition">
                    Log In
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {children}
        </div>
      </section>
    </div>
  );
}