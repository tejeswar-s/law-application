import React from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Mail, Shield, AlertCircle } from 'lucide-react';

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
            Your attorney account has been created successfully
          </p>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Verification Notice */}
          <div className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-yellow-600 mt-1 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-2">Bar License Verification Pending</h3>
                <p className="text-sm text-yellow-800 leading-relaxed">
                  Your account has limited functionality until your bar license is verified by our team. 
                  This process typically takes 2-3 business days. You'll receive an email notification 
                  once verification is complete.
                </p>
              </div>
            </div>
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
                <span><strong>Log in</strong> to your attorney portal using the credentials you just created</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-blue-200 text-[#0A2342] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                <span><strong>Complete your profile</strong> and familiarize yourself with the platform</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-blue-200 text-[#0A2342] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                <span><strong>Check verification status</strong> on your <Link href="/attorney/profile" className="text-blue-600 hover:underline font-semibold">Profile page</Link></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-blue-200 text-[#0A2342] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                <span><strong>Once verified</strong>, start your first small claims case with Quick Verdicts</span>
              </li>
            </ul>
          </div>

          {/* Help Section */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border-2 border-indigo-200">
            <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-700 mb-3">
              If you have any questions about the verification process or need assistance with your account:
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/attorney/profile" className="text-[#0A2342] hover:underline text-sm font-semibold flex items-center gap-1">
                <Shield size={16} />
                Check Profile Status
              </Link>
              <span className="hidden sm:inline text-gray-400">•</span>
              <Link href="/contact" className="text-[#0A2342] hover:underline text-sm font-semibold flex items-center gap-1">
                <Mail size={16} />
                Contact Support
              </Link>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <Link href="/login/attorney">
              <button className="w-full px-8 py-4 bg-[#0A2342] text-white rounded-xl hover:bg-[#132c54] font-semibold transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] flex items-center justify-center gap-3">
                Proceed to Attorney Portal
                <ArrowRight size={20} />
              </button>
            </Link>
          </div>

          {/* Footer Note */}
          <div className="text-center text-sm text-gray-600 pt-4 border-t-2 border-gray-100">
            <p className="mb-2">
              Your verification status will be updated within 2-3 business days
            </p>
            <p className="text-xs text-gray-500">
              Account ID: ATT-{Math.random().toString(36).substr(2, 9).toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}