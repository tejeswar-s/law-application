"use client";

import { useState } from "react";
import { X } from "lucide-react";

const quizQuestions = [
  {
    question: "Quick Verdict simulates real jury trials using actual people as mock jurors.",
    options: ["True", "False"],
    answer: "True",
    explanation: "Quick Verdict collects feedback from real participants to simulate how a jury might respond to a case."
  },
  {
    question: "Which of these are required at all times while in the court room?",
    options: [
      "Camera enabled for the full duration of the trial",
      "Business casual attire",
      "A stable internet connection",
      "All of the above"
    ],
    answer: "All of the above",
    explanation: "All of these are required for participation in a Quick Verdict trial."
  },
  {
    question: "What is the main purpose of Quick Verdict?",
    options: [
      "Provide legal representation",
      "File court documents",
      "Help test case strategies with mock jurors",
      "Offer free legal advice"
    ],
    answer: "Help test case strategies with mock jurors",
    explanation: "Quick Verdict helps attorneys test case strategies with feedback from mock jurors."
  },
  {
    question: "You weren't selected for a case. What should you do next?",
    options: [
      "Close the app and ignore future invites",
      "Stay available and check back regularly for new cases",
      "Contact support and demand to be selected",
      "Create a new account to increase your chances"
    ],
    answer: "Stay available and check back regularly for new cases",
    explanation: "Stay available and check back for new opportunities."
  },
  {
    question: "What should you do after finishing a Quick Verdict case?",
    options: [
      "Close the tab and leave",
      "Wait for your results to be posted online",
      "Complete the witness believability form, confirm payment, and leave feedback",
      "Restart the case"
    ],
    answer: "Complete the witness believability form, confirm payment, and leave feedback",
    explanation: "You must complete all post-case steps before leaving."
  },
  {
    question: "If you're selected for a case but can no longer attend, it's okay to ignore the session.",
    options: ["True", "False"],
    answer: "False",
    explanation: "You should always notify the team if you cannot attend."
  },
  {
    question: "What does the randomly selected foreperson do in a Quick Verdict session?",
    options: [
      "Decides the outcome of the case",
      "Asks the attorneys questions",
      "Helps guide discussion and keeps things organized",
      "Shares legal advice with the group"
    ],
    answer: "Helps guide discussion and keeps things organized",
    explanation: "The foreperson helps guide the group and keeps things on track."
  },
  {
    question: "Quick Verdict uses a timer during the trial session to help keep the discussion focused and on track.",
    options: ["True", "False"],
    answer: "True",
    explanation: "A timer is used to keep the session focused and on schedule."
  }
];

export default function JurorQuizOverlay({ open, onClose, onFinish }: { open: boolean; onClose: () => void; onFinish: () => void; }) {
  const [step, setStep] = useState<'quiz'|'correct'|'incorrect'|'finished'>("quiz");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const q = quizQuestions[current];
  const isLast = current === quizQuestions.length - 1;

  // Sidebar width: 280px (default), overlay left margin for main section only
  return (
    <div className="fixed inset-y-0 right-0 left-[280px] z-50 bg-black/40 flex items-stretch justify-stretch">
      <div className="relative bg-white w-full h-full flex flex-col overflow-hidden rounded-none shadow-none">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <span className="font-semibold text-[18px] text-[#222]">Quick Verdicts Quiz</span>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose} aria-label="Close"><X size={22} /></button>
        </div>
        {/* Main Content */}
        <div className="flex-1 flex flex-col px-12 pt-12 pb-8">
          {step === "quiz" && (
            <>
              <div className="w-full max-w-2xl">
                <div className="text-[18px] font-bold text-[#222] mb-8">{q.question}</div>
                <div className="flex flex-col gap-4 mb-8">
                  {q.options.map(opt => (
                    <button
                      key={opt}
                      className={`flex items-center gap-2 px-5 py-2 border rounded-md text-[16px] font-medium transition-colors text-left ${selected === opt ? 'border-[#0C2D57] bg-[#F3F6FA]' : 'border-gray-300 bg-white hover:border-[#0C2D57]'}`}
                      onClick={() => !submitted && setSelected(opt)}
                      disabled={submitted}
                      style={{ minWidth: 260 }}
                    >
                      <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${selected === opt ? 'border-[#0C2D57]' : 'border-gray-400'}`}>{selected === opt ? <span className="w-2.5 h-2.5 rounded-full bg-[#0C2D57] block"/> : null}</span>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1" />
              <div className="flex justify-end w-full">
                <button
                  className={`px-6 py-2 rounded font-semibold text-white text-lg transition-colors ${selected ? 'bg-[#0C2D57] hover:bg-[#0a2342]' : 'bg-gray-300 cursor-not-allowed'}`}
                  disabled={!selected || submitted}
                  onClick={() => {
                    setSubmitted(true);
                    setTimeout(() => {
                      if (selected === q.answer) setStep('correct');
                      else setStep('incorrect');
                      setSubmitted(false);
                    }, 150);
                  }}
                >
                  Submit
                </button>
              </div>
            </>
          )}
          {step === "correct" && (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <svg width="56" height="56" className="mb-6" viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="28" fill="#EAFBEA"/><path d="M18 29.5L25 36.5L38 23.5" stroke="#2ECC40" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div className="text-2xl font-semibold text-[#222] mb-2">Correct</div>
              <div className="text-center text-gray-600 mb-8 max-w-md">{q.explanation}</div>
              <button
                className="px-6 py-2 rounded font-semibold text-white text-lg bg-[#0C2D57] hover:bg-[#0a2342]"
                onClick={() => {
                  if (isLast) setStep('finished');
                  else {
                    setCurrent(c => c + 1);
                    setSelected(null);
                    setStep('quiz');
                  }
                }}
              >
                {isLast ? 'Finish' : 'Next Question'}
              </button>
            </div>
          )}
          {step === "incorrect" && (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <svg width="56" height="56" className="mb-6" viewBox="0 0 56 56" fill="none"><circle cx="28" cy="28" r="28" fill="#FDEAEA"/><path d="M36 20L20 36" stroke="#B3261E" strokeWidth="3" strokeLinecap="round"/><path d="M20 20L36 36" stroke="#B3261E" strokeWidth="3" strokeLinecap="round"/></svg>
              <div className="text-2xl font-semibold text-[#222] mb-2">Incorrect</div>
              <div className="text-center text-gray-600 mb-8 max-w-md">{q.explanation}</div>
              <button
                className="px-6 py-2 rounded font-semibold text-white text-lg bg-[#0C2D57] hover:bg-[#0a2342]"
                onClick={() => {
                  setSelected(null);
                  setStep('quiz');
                }}
              >
                Try Again
              </button>
            </div>
          )}
          {step === "finished" && (
            <div className="flex flex-col items-center justify-center w-full h-full">
              {/* Rocket icon */}
              <svg width="56" height="56" className="mb-6" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="28" r="28" fill="#FDF6EA"/>
                <g>
                  <path d="M28 18V38" stroke="#B68B2C" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M18 28H38" stroke="#B68B2C" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M22 22L34 34" stroke="#B68B2C" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M34 22L22 34" stroke="#B68B2C" strokeWidth="3" strokeLinecap="round"/>
                  {/* Rocket icon */}
                  <g>
                    <path d="M28 20c2.5 0 4.5 2 4.5 4.5 0 2.2-1.6 4.1-3.7 4.4l-.8.1-.8-.1C25.1 29 23.5 27.1 23.5 24.5 23.5 22 25.5 20 28 20Z" fill="#F9A825"/>
                    <path d="M28 20v10" stroke="#F9A825" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="28" cy="24.5" r="1.5" fill="#fff"/>
                  </g>
                </g>
              </svg>
              <div className="text-2xl font-semibold text-[#222] mb-2">Finished</div>
              <div className="text-center text-gray-600 mb-8 max-w-md">Congrats!<br/>You are now able to apply for cases in your county.</div>
              <button
                className="px-6 py-2 rounded font-semibold text-white text-lg bg-[#0C2D57] hover:bg-[#0a2342]"
                onClick={onFinish}
              >
                Juror Job Board
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
