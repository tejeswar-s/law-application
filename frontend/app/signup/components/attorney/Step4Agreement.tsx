import React, { useRef } from 'react';
import { AttorneyFormData, ValidationErrors } from '../../../../types/signup.types';

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

  const handleAgreementScroll = () => {
    const element = agreementRef.current;
    if (element) {
      const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 5;
      onScrolledToBottom(isAtBottom);
    }
  };

  const getTodayDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="flex-1 flex flex-col pl-28">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-[#16305B] mb-8 mt-2">
          Attorney User Agreement for QuickVerdicts
        </h1>
        
        {/* Agreement Content */}
        <div 
          ref={agreementRef}
          onScroll={handleAgreementScroll}
          className="border border-[#bfc6d1] rounded-md bg-white p-6 h-96 overflow-y-auto mb-6 text-[#16305B] text-sm leading-relaxed"
        >
          <div className="space-y-4">
            <p><strong>Effective Date:</strong> {getTodayDate()}</p>
            
            <p>Welcome to QuickVerdict. This Attorney User Agreement ("Agreement") governs your use of our virtual courtroom platform ("Platform"). By registering or using QuickVerdict as an attorney, you ("Attorney," "You," or "Your") agree to the following terms and conditions.</p>

            <div>
              <h3 className="font-bold mb-2">1. Eligibility and Verification</h3>
              <p>You must be a licensed attorney in good standing with the relevant jurisdiction(s) to participate on QuickVerdict.</p>
              <p>• You agree to provide accurate and current verification information, including your bar license number and jurisdiction.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">2. Use of the Platform</h3>
              <p>You may use QuickVerdict solely for legitimate legal proceedings and in compliance with all applicable laws, court rules, and ethical obligations.</p>
              <p>• You are responsible for all activity conducted under your account, including compliance with this Agreement and any posted community standards or platform guidelines.</p>
              <p>• You agree not to misuse the platform, including, but not limited to, attempting unauthorized access, disrupting proceedings, or harassing other users.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">3. Case Management and Proceedings</h3>
              <p>• You acknowledge that virtual proceedings may differ from traditional in-person court appearances and agree to adapt accordingly to ensure a fair and professional process.</p>
              <p>• You are responsible for uploading, managing, and presenting case materials securely and in accordance with applicable confidentiality requirements.</p>
              <p>• You agree to respect all deadlines, schedules, and platform instructions issued for cases handled via QuickVerdict.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">4. Professional Conduct and Compliance</h3>
              <p>• You agree to maintain professional standards of conduct at all times while using the Platform.</p>
              <p>• You must comply with all applicable bar rules, ethical guidelines, and legal professional standards.</p>
              <p>• You are responsible for ensuring that your use of the Platform complies with client confidentiality requirements and attorney-client privilege.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">5. Fees and Payment</h3>
              <p>• QuickVerdict may charge service fees or case handling fees, which will be communicated at the time of case submission or scheduling.</p>
              <p>• Payment terms for any applicable fees will be outlined separately and must be adhered to in order to maintain active use of the platform.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">6. Limitation of Liability</h3>
              <p>• QuickVerdict provides the platform "as is" and does not guarantee outcomes or case results.</p>
              <p>• QuickVerdict is not liable for delays, technical failures, or any indirect, incidental, or consequential damages arising out of your use of the platform.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">7. Account Termination</h3>
              <p>• QuickVerdict reserves the right to suspend or terminate your access at any time for violations of this Agreement, unethical conduct, or misuse of the platform.</p>
              <p>• You may terminate your account at any time by contacting support.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">8. Updates to the Agreement</h3>
              <p>• QuickVerdict may modify this Agreement at any time. Updated terms will be communicated to you, and continued use of the Platform after notice constitutes acceptance of the changes.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">9. Governing Law</h3>
              <p>This Agreement shall be governed by the laws of the State of Texas, without regard to conflict of law principles.</p>
            </div>

            <div>
              <h3 className="font-bold mb-2">10. Contact Information</h3>
              <p>For questions, account issues, or support, please contact us at support@quickverdicts.com.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={formData.userAgreementAccepted}
            onChange={(e) => {
              onUpdate({ userAgreementAccepted: e.target.checked });
              onClearError('userAgreementAccepted');
            }}
            className="w-5 h-5 mt-1 accent-[#16305B] flex-shrink-0"
            disabled={!hasScrolledToBottom}
          />
          <div className="text-[#16305B] text-sm leading-relaxed">
            <p>
              I have read and agree to the Attorney User Agreement for QuickVerdicts <span className="text-red-500">*</span>
            </p>
            {!hasScrolledToBottom && (
              <p className="text-xs text-gray-500 mt-1">Please scroll to the bottom of the agreement first</p>
            )}
          </div>
        </div>

        {validationErrors.userAgreementAccepted && (
          <p className="text-red-500 text-sm mt-2">{validationErrors.userAgreementAccepted}</p>
        )}

        {validationErrors.scroll && (
          <p className="text-red-500 text-sm mt-2">{validationErrors.scroll}</p>
        )}

        <div className="text-[#16305B] text-sm bg-gray-50 p-3 rounded border mb-6">
          <p className="font-medium">By clicking "Agree and Create Account", you acknowledge that you have read, understood, and accepted this Attorney User Agreement.</p>
        </div>
        
        <div className="pt-2">
          <button
            type="button"
            onClick={onSubmit}
            disabled={!hasScrolledToBottom || !formData.userAgreementAccepted || loading}
            className={`w-full font-semibold px-8 py-3 rounded-md transition ${
              hasScrolledToBottom && formData.userAgreementAccepted && !loading
                ? "bg-[#16305B] text-white hover:bg-[#0A2342] cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {loading ? "Creating Account..." : "Agree and Create Account"}
          </button>
          
          {error && (
            <div className="text-red-500 mt-2 text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}