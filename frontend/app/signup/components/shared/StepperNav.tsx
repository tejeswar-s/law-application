import React from 'react';

interface Step {
  label: string;
  completed: boolean;
  active: boolean;
}

interface StepperNavProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function StepperNav({ steps, currentStep, className = '' }: StepperNavProps) {
  const processedSteps: Step[] = steps.map((label, index) => ({
    label,
    completed: currentStep > index + 1,
    active: currentStep === index + 1,
  }));

  return (
    <div className={`w-full max-w-6xl mx-auto px-20 ${className}`}>
      <div className="flex items-center justify-between px-8 pb-8">
        {processedSteps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          
          return (
            <div key={step.label} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                    ${
                      step.active
                        ? "border-[#16305B]"
                        : step.completed
                        ? "border-[#16305B] bg-[#16305B]"
                        : "border-[#bfc6d1] bg-transparent"
                    }
                  `}
                >
                  {step.completed ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      className="text-white"
                    >
                      <path
                        d="M4 7.5l2 2 4-4"
                        stroke="white"
                        strokeWidth="2"
                        fill="none"
                      />
                    </svg>
                  ) : (
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        step.active ? "bg-[#16305B]" : "bg-transparent"
                      }`}
                    />
                  )}
                </div>

                <span
                  className={`text-xs leading-tight max-w-[90px] ${
                    step.active
                      ? "text-[#16305B] font-semibold"
                      : step.completed
                      ? "text-[#16305B]"
                      : "text-[#bfc6d1]"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {!isLast && (
                <div className="flex-1 h-[1px] bg-[#bfc6d1] ml-4 mr-4" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}