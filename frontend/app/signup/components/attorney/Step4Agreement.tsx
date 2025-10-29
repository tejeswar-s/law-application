import React, { useRef, useCallback } from 'react';
import { AttorneyFormData, ValidationErrors } from '../../../../types/signup.types';
import { FileText, CheckCircle2 } from 'lucide-react';

interface Step4AgreementProps {
  formData: AttorneyFormData;
  onUpdate: (data: Partial<AttorneyFormData>) => void;
  validationErrors: ValidationErrors;
  onClearError: (field: string) => void;
  hasScrolledToBottom: boolean;
  onScrolledToBottom: (scrolled: boolean) => void;
  onSubmit: () => void;
  loading?: boolean;
  error?: string | null;
}

export function Step4Agreement({
  formData,
  onUpdate,
  validationErrors,
  onClearError,
  hasScrolledToBottom,
  onScrolledToBottom,
  onSubmit,
  loading = false,
  error,
}: Step4AgreementProps) {
  const agreementRef = useRef<HTMLDivElement>(null);

  const handleAgreementScroll = useCallback(() => {
    const element = agreementRef.current;
    if (element) {
      const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 5;
      if (isAtBottom !== hasScrolledToBottom) {
        onScrolledToBottom(isAtBottom);
      }
    }
  }, [hasScrolledToBottom, onScrolledToBottom]);

  const getTodayDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <FileText className="w-6 h-6 text-[#0A2342]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#0A2342]">
            User Agreement
          </h1>
          <p className="text-gray-600 text-sm">
            Please read and accept the terms to complete your registration
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[#0A2342] to-[#132c54] px-6 py-4">
          <h2 className="text-xl font-bold text-white">
            Attorney User Agreement for QuickVerdicts
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            <strong>Effective Date:</strong> {getTodayDate()}
          </p>
        </div>

        <div 
          ref={agreementRef}
          onScroll={handleAgreementScroll}
          className="max-h-[500px] overflow-y-auto p-8 text-sm text-gray-800 leading-relaxed"
        >
          <p className="mb-6">
            Welcome to QuickVerdict. This Attorney User Agreement ("Agreement") governs your use of our virtual courtroom platform ("Platform"). By registering or using QuickVerdict as an attorney, you ("Attorney," "You," or "Your") agree to the following terms and conditions.
          </p>

          <div className="mb-6">
            <h3 className="font-bold text-lg text-[#0A2342] mb-3 flex items-center gap-2">
              <span className="bg-[#0A2342] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">1</span>
              Eligibility and Verification
            </h3>
            <div className="pl-8 space-y-2 text-gray-700">
              <p>You must be a licensed attorney in good standing with the relevant jurisdiction(s) to participate on QuickVerdict.</p>
              <p>• You agree to provide accurate and current verification information, including your bar license number and jurisdiction.</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-lg text-[#0A2342] mb-3 flex items-center gap-2">
              <span className="bg-[#0A2342] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">2</span>
              Use of the Platform
            </h3>
            <div className="pl-8 space-y-2 text-gray-700">
              <p>You may use QuickVerdict solely for legitimate legal proceedings and in compliance with all applicable laws, court rules, and ethical obligations.</p>
              <p>• You are responsible for all activity conducted under your account, including compliance with this Agreement and any posted community standards or platform guidelines.</p>
              <p>• You agree not to misuse the platform, including, but not limited to, attempting unauthorized access, disrupting proceedings, or harassing other users.</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-lg text-[#0A2342] mb-3 flex items-center gap-2">
              <span className="bg-[#0A2342] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">3</span>
              Case Management and Proceedings
            </h3>
            <div className="pl-8 space-y-2 text-gray-700">
              <p>• You acknowledge that virtual proceedings may differ from traditional in-person court appearances and agree to adapt accordingly to ensure a fair and professional process.</p>
              <p>• You are responsible for uploading, managing, and presenting case materials securely and in accordance with applicable confidentiality requirements.</p>
              <p>• You agree to respect all deadlines, schedules, and platform instructions issued for cases handled via QuickVerdict.</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-lg text-[#0A2342] mb-3 flex items-center gap-2">
              <span className="bg-[#0A2342] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">4</span>
              Professional Conduct and Compliance
            </h3>
            <div className="pl-8 space-y-2 text-gray-700">
              <p>• You agree to maintain professional standards of conduct at all times while using the Platform.</p>
              <p>• You must comply with all applicable bar rules, ethical guidelines, and legal professional standards.</p>
              <p>• You are responsible for ensuring that your use of the Platform complies with client confidentiality requirements and attorney-client privilege.</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-lg text-[#0A2342] mb-3 flex items-center gap-2">
              <span className="bg-[#0A2342] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">5</span>
              Fees and Payment
            </h3>
            <div className="pl-8 space-y-2 text-gray-700">
              <p>• QuickVerdict may charge service fees or case handling fees, which will be communicated at the time of case submission or scheduling.</p>
              <p>• Payment terms for any applicable fees will be outlined separately and must be adhered to in order to maintain active use of the platform.</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-lg text-[#0A2342] mb-3 flex items-center gap-2">
              <span className="bg-[#0A2342] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">6</span>
              Limitation of Liability
            </h3>
            <div className="pl-8 space-y-2 text-gray-700">
              <p>• QuickVerdict provides the platform "as is" and does not guarantee outcomes or case results.</p>
              <p>• QuickVerdict is not liable for delays, technical failures, or any indirect, incidental, or consequential damages arising out of your use of the platform.</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-lg text-[#0A2342] mb-3 flex items-center gap-2">
              <span className="bg-[#0A2342] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">7</span>
              Account Termination
            </h3>
            <div className="pl-8 space-y-2 text-gray-700">
              <p>• QuickVerdict reserves the right to suspend or terminate your access at any time for violations of this Agreement, unethical conduct, or misuse of the platform.</p>
              <p>• You may terminate your account at any time by contacting support.</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-lg text-[#0A2342] mb-3 flex items-center gap-2">
              <span className="bg-[#0A2342] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">8</span>
              Updates to the Agreement
            </h3>
            <div className="pl-8 space-y-2 text-gray-700">
              <p>• QuickVerdict may modify this Agreement at any time. Updated terms will be communicated to you, and continued use of the Platform after notice constitutes acceptance of the changes.</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-lg text-[#0A2342] mb-3 flex items-center gap-2">
              <span className="bg-[#0A2342] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">9</span>
              Governing Law
            </h3>
            <div className="pl-8 space-y-2 text-gray-700">
              <p>This Agreement shall be governed by the laws of the State of Texas, without regard to conflict of law principles.</p>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-bold text-lg text-[#0A2342] mb-3 flex items-center gap-2">
              <span className="bg-[#0A2342] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">10</span>
              Contact Information
            </h3>
            <div className="pl-8 space-y-2 text-gray-700">
              <p>For questions, account issues, or support, please contact us at <strong>support@quickverdicts.com</strong>.</p>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        {!hasScrolledToBottom && (
          <div className="px-6 py-3 bg-yellow-50 border-t-2 border-yellow-200 flex items-center gap-3">
            <svg className="animate-bounce w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <p className="text-sm text-yellow-800 font-medium">
              Please scroll to the bottom to read the complete agreement
            </p>
          </div>
        )}
      </div>

      {validationErrors.scroll && (
        <p className="text-red-500 text-sm mt-3 flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          {validationErrors.scroll}
        </p>
      )}

      <label className="flex items-start gap-4 mt-6 p-6 bg-white rounded-xl border-2 border-gray-200 cursor-pointer hover:border-[#0A2342] transition-all">
        <input
          type="checkbox"
          className="sr-only"
          checked={formData.userAgreementAccepted}
          disabled={!hasScrolledToBottom}
          onChange={(e) => {
            onUpdate({ userAgreementAccepted: e.target.checked });
            onClearError('userAgreementAccepted');
          }}
        />
        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          formData.userAgreementAccepted 
            ? "bg-[#0A2342] border-[#0A2342]" 
            : "bg-white border-gray-300"
        } ${!hasScrolledToBottom ? "opacity-50" : ""}`}>
          {formData.userAgreementAccepted && <CheckCircle2 size={16} className="text-white" />}
        </div>
        <div>
          <span className={`font-medium ${!hasScrolledToBottom ? "text-gray-400" : "text-gray-700"}`}>
            I have read and agree to the Attorney User Agreement for QuickVerdicts <span className="text-red-500">*</span>
          </span>
          {!hasScrolledToBottom && (
            <p className="text-sm text-gray-500 mt-1">📜 Please scroll to the bottom of the agreement first</p>
          )}
        </div>
      </label>
      
      {validationErrors.userAgreementAccepted && (
        <p className="text-red-500 text-sm mt-2">{validationErrors.userAgreementAccepted}</p>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mt-4 flex items-start gap-3">
          <div className="bg-red-100 rounded-full p-2">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-700 text-sm font-medium flex-1">{error}</p>
        </div>
      )}

      <div className="pt-6">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!hasScrolledToBottom || !formData.userAgreementAccepted || loading}
          className={`w-full font-semibold px-8 py-4 rounded-xl transition-all shadow-md ${
            hasScrolledToBottom && formData.userAgreementAccepted && !loading
              ? "bg-[#0A2342] text-white hover:bg-[#132c54] hover:shadow-lg transform hover:scale-[1.02]" 
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Your Account...
            </span>
          ) : (
            "Agree and Create Account"
          )}
        </button>
      </div>
    </div>
  );
}