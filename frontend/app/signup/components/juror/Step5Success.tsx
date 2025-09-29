import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

export function Step5Success() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
            <Check size={32} color="white" />
          </div>
        </div>
        
        <h1 className="text-2xl font-semibold text-[#0A2342]">
          Account Creation Successful!
        </h1>

        <p className="text-gray-700 max-w-2xl mx-auto">
          Welcome to Quick Verdicts! Your juror account has been created successfully. 
          You can now access your dashboard and complete any remaining onboarding tasks.
        </p>

        <Link href="/login/juror">
          <button className="mt-6 px-8 py-3 bg-[#0A2342] text-white rounded-md hover:bg-[#132c54] font-medium">
            Proceed to Juror Login
          </button>
        </Link>
      </div>
    </div>
  );
}