import React from 'react';
import Link from 'next/link';

export function Step5Success() {
  return (
    <div className="flex-1 flex flex-col pl-28">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-[#16305B] mb-8 mt-2">
          Account Creation Successful
        </h1>
        
        <div className="flex flex-col items-start">
          <div className="flex justify-center w-full mb-6">
            <svg width="90" height="90" viewBox="0 0 90 90">
              <circle
                cx="45"
                cy="45"
                r="40"
                fill="none"
                stroke="#19C900"
                strokeWidth="6"
              />
              <polyline
                points="30,48 42,60 62,36"
                fill="none"
                stroke="#19C900"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          
          <div className="text-lg font-semibold text-[#222] mb-4 w-full text-center">
            Your Account has been created successfully.
          </div>
          
          <div className="text-[#222] text-base mb-8 w-full text-center space-y-2">
            <p>
              Please note: You will have limited functionalities until your
              bar license has been verified.
            </p>
            <p>
              To view updates on your verification, please refer to your{" "}
              <Link
                href="/attorney/profile"
                className="underline text-[#16305B] font-medium hover:text-[#0A2342]"
              >
                Profile
              </Link>{" "}
              or{" "}
              <Link
                href="/contact"
                className="underline text-[#16305B] font-medium hover:text-[#0A2342]"
              >
                contact us
              </Link>{" "}
              directly.
            </p>
          </div>
          
          <div className="w-full">
            <Link href="/login/attorney">
              <button className="w-full bg-[#16305B] text-white font-semibold px-8 py-2 rounded-md hover:bg-[#0A2342] transition">
                Proceed to Attorney Portal
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}