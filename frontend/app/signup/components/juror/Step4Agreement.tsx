import React, { useRef } from 'react';
import { JurorFormData, ValidationErrors } from '../../../../types/signup.types';

interface Step4AgreementProps {
  formData: JurorFormData;
  onUpdate: (data: Partial<JurorFormData>) => void;
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
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-[#0A2342] mb-4">
        Juror User Agreement for Quick Verdicts
      </h1>

      <div 
        ref={agreementRef}
        onScroll={handleAgreementScroll}
        className="max-h-80 overflow-y-auto p-6 border rounded-md bg-white text-sm text-gray-800 leading-relaxed border-gray-300 mb-6"
      >
        <p><strong>Effective Date:</strong> {getTodayDate()}</p>

        <p className="mt-4">
          Welcome to QuickVerdicts. This Juror User Agreement ("Agreement") governs your use of
          our virtual courtroom platform ("Platform"). By registering or using QuickVerdicts as a juror, 
          you ("Juror," "You," or "Your") agree to the following terms and conditions.
        </p>

        <div className="mt-4">
          <h3 className="font-bold mb-2">1. Eligibility and Verification</h3>
          <p>You must meet all eligibility requirements to participate as a juror on QuickVerdicts.</p>
          <p>• You agree to provide accurate and current verification information.</p>
          <p>• You acknowledge that verification steps may be required before you can access full platform features.</p>
        </div>

        <div className="mt-4">
          <h3 className="font-bold mb-2">2. Use of the Platform</h3>
          <p>You may use QuickVerdicts solely for legitimate jury service and in compliance with all applicable laws and regulations.</p>
          <p>• You are responsible for all activity conducted under your account.</p>
          <p>• You agree not to misuse the platform, including attempting unauthorized access, disrupting proceedings, or engaging in inappropriate conduct.</p>
        </div>

        <div className="mt-4">
          <h3 className="font-bold mb-2">3. Jury Service and Proceedings</h3>
          <p>• You acknowledge that virtual jury proceedings may differ from traditional in-person jury service and agree to adapt accordingly.</p>
          <p>• You are responsible for maintaining confidentiality of case materials and deliberations as required by law.</p>
          <p>• You agree to participate actively and professionally in all assigned proceedings.</p>
        </div>

        <div className="mt-4">
          <h3 className="font-bold mb-2">4. Professional Conduct</h3>
          <p>• You agree to maintain appropriate standards of conduct at all times while using the Platform.</p>
          <p>• You must not discuss cases outside of official proceedings or with unauthorized individuals.</p>
          <p>• You are responsible for ensuring your environment is appropriate for jury service.</p>
        </div>

        <div className="mt-4">
          <h3 className="font-bold mb-2">5. Compensation and Payment</h3>
          <p>• QuickVerdicts will provide compensation for jury service as outlined in individual case assignments.</p>
          <p>• Payment will be processed through your selected payment method after completion of service.</p>
          <p>• You are responsible for any applicable taxes on compensation received.</p>
        </div>

        <div className="mt-4">
          <h3 className="font-bold mb-2">6. Limitation of Liability</h3>
          <p>• QuickVerdicts provides the platform "as is" and does not guarantee specific outcomes.</p>
          <p>• QuickVerdicts is not liable for technical failures, delays, or any indirect consequences arising from platform use.</p>
        </div>

        <div className="mt-4">
          <h3 className="font-bold mb-2">7. Account Termination</h3>
          <p>• QuickVerdicts reserves the right to suspend or terminate your access for violations of this Agreement.</p>
          <p>• You may deactivate your account at any time by contacting support.</p>
        </div>

        <div className="mt-4">
          <h3 className="font-bold mb-2">8. Updates to Agreement</h3>
          <p>• QuickVerdicts may modify this Agreement at any time with notice to users.</p>
          <p>• Continued use after changes constitutes acceptance of updated terms.</p>
        </div>

        <div className="mt-4">
          <h3 className="font-bold mb-2">9. Governing Law</h3>
          <p>This Agreement shall be governed by the laws of the State of Texas.</p>
        </div>

        <div className="mt-4 mb-6">
          <h3 className="font-bold mb-2">10. Contact Information</h3>
          <p>For questions or support, please contact us at support@quickverdicts.com.</p>
        </div>
      </div>

      {validationErrors.scroll && (
        <p className="text-red-500 text-sm mt-2">{validationErrors.scroll}</p>
      )}

      <label className="flex items-start gap-3 mt-6">
        <input
          type="checkbox"
          className="accent-[#0A2342] mt-1"
          checked={formData.userAgreementAccepted}
          disabled={!hasScrolledToBottom}
          onChange={(e) => {
            onUpdate({ userAgreementAccepted: e.target.checked });
            onClearError('userAgreementAccepted');
          }}
        />
        <div>
          <span className="text-gray-700">
            I have read and agree to the Juror User Agreement for QuickVerdicts *
          </span>
          {!hasScrolledToBottom && (
            <p className="text-sm text-gray-500 mt-1">Please scroll to the bottom of the agreement first</p>
          )}
        </div>
      </label>
      
      {validationErrors.userAgreementAccepted && (
        <p className="text-red-500 text-sm mt-2">{validationErrors.userAgreementAccepted}</p>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="pt-6">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!hasScrolledToBottom || !formData.userAgreementAccepted || loading}
          className={`w-full font-medium px-8 py-3 rounded-md transition ${
            hasScrolledToBottom && formData.userAgreementAccepted && !loading
              ? "bg-[#0A2342] text-white hover:bg-[#132c54]" 
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {loading ? "Creating Account..." : "Agree and Create Account"}
        </button>
      </div>
    </div>
  );
}