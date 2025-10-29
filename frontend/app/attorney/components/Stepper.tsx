// components/Stepper.tsx
"use client";
import { useRouter } from "next/navigation";

type StepperProps = {
  currentStep: number;
  onBack?: () => void;
};

const steps = [
  { label: "Case Details", path: "/attorney/state/case-details" },
  { label: "Plaintiff Details", path: "/attorney/state/plaintiff-details" },
  { label: "Defendant Details", path: "/attorney/state/defendant-details" },
  { label: "Voir Dire Part 1 & 2", path: "/attorney/state/voir-dire-1" },
  { label: "Payment", path: "/attorney/state/payment-details" },
  { label: "Review", path: "/attorney/state/review-details" },
  { label: "Schedule", path: "/attorney/state/schedule-trail" },
];

export default function Stepper({ currentStep, onBack }: StepperProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (currentStep > 0) {
      router.push(steps[currentStep - 1].path);
    } else {
      router.push("/attorney/state/case-type");
    }
  };

  return (
    <div className="w-full py-6">
      {/* Back Button */}
      <div className="mb-8 px-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="font-medium">Back</span>
        </button>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between px-8 pb-6">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <div key={step.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-2.5 min-w-[90px]">
                {/* Circle with checkmark or empty */}
                <div
                  className={`w-8 h-8 rounded-full border-[2.5px] flex items-center justify-center transition-all flex-shrink-0
                    ${
                      isCompleted
                        ? "border-[#9ca3af] bg-[#9ca3af]"
                        : isActive
                        ? "border-[#1e3a5f] bg-white"
                        : "border-[#d1d5db] bg-white"
                    }
                  `}
                >
                  {isCompleted && (
                    <svg
                      className="w-4.5 h-4.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-xs leading-tight text-center max-w-[90px] ${
                    isActive
                      ? "text-[#1e3a5f] font-bold"
                      : isCompleted
                      ? "text-[#9ca3af] font-medium"
                      : "text-[#d1d5db] font-medium"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line - Always light gray */}
              {idx < steps.length - 1 && (
                <div className="flex-1 h-[2px] bg-[#d1d5db] mx-3 mb-8"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}