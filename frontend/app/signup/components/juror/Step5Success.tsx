import React from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Mail, Shield } from 'lucide-react';

export function Step5Success() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle size={48} className="text-green-500" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-3">
            Welcome to Quick Verdicts!
          </h1>
          <p className="text-green-50 text-lg">
            Your juror account has been created successfully
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="text-center mb-8">
            <p className="text-gray-700 text-lg">
              You're all set! Your account is now active and ready to use.
            </p>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
            <h2 className="text-xl font-bold text-[#0A2342] mb-4 flex items-center gap-2">
              <Shield className="text-blue-600" size={24} />
              What's Next?
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="bg-blue-200 text-[#0A2342] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                <span><strong>Log in</strong> to your dashboard using the credentials you just created</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-blue-200 text-[#0A2342] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                <span><strong>Complete onboarding</strong> by watching the introduction video and taking the juror quiz</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-blue-200 text-[#0A2342] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                <span><strong>Browse available cases</strong> on the Job Board and start applying</span>
              </li>
            </ul>
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <Link href="/login/juror">
              <button className="w-full px-8 py-4 bg-[#0A2342] text-white rounded-xl hover:bg-[#132c54] font-semibold transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] flex items-center justify-center gap-3">
                Proceed to Juror Login
                <ArrowRight size={20} />
              </button>
            </Link>
          </div>

          {/* Support Link */}
          <div className="text-center text-sm text-gray-600 pt-4">
            Need help? <a href="/contact" className="text-[#0A2342] font-semibold hover:underline">Contact Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}