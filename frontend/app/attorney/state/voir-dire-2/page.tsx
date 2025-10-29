// ===== VOIR DIRE PART 2 PAGE =====
// app/attorney/state/voir-dire-2/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Stepper from "../../components/Stepper";
import { Trash2 } from "lucide-react";

export default function VoirDirePart2() {
  const [questions, setQuestions] = useState<string[]>([""]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("voirDire2Questions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setQuestions(parsed);
        }
      } catch (e) {
        // Keep default
      }
    }
  }, []);

  const handleChange = (idx: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[idx] = value;
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, ""]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length === 1) {
      // Don't allow removing the last question, just clear it
      const newQuestions = [""];
      setQuestions(newQuestions);
      setValidationErrors([]);
    } else {
      const newQuestions = questions.filter((_, i) => i !== idx);
      setQuestions(newQuestions);
      // Also remove corresponding validation error
      const newErrors = validationErrors.filter((_, i) => i !== idx);
      setValidationErrors(newErrors);
    }
  };

  const validate = () => {
    const errors = questions.map(q => q.trim() ? "" : "Required");
    setValidationErrors(errors);
    return errors.every(e => !e);
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const validQuestions = questions.filter(q => q.trim());
    localStorage.setItem("voirDire2Questions", JSON.stringify(validQuestions));
    router.push("/attorney/state/payment-details");
  };

  return (
    <div className="min-h-screen flex bg-[#faf8f3] font-sans">
      <aside className="hidden lg:flex flex-col w-[265px]">
        <div className="flex-1 text-white bg-[#16305B] relative">
          <div className="absolute top-15 left-0 w-full">
            <Image
              src="/logo_sidebar_signup.png"
              alt="Quick Verdicts Logo"
              width={300}
              height={120}
              className="w-full object-cover"
              priority
            />
          </div>
          <div className="px-8 py-8 mt-30">
            <h2 className="text-3xl font-medium mb-4">New Case</h2>
            <div className="text-sm leading-relaxed text-blue-100 space-y-3">
              <p>Fill in Voir Dire disqualifier questions.</p>
              <p>Voir Dire must be written out as a "Yes / No answer" question.</p>
            </div>
          </div>
        </div>
      </aside>
      <section className="flex-1 flex flex-col min-h-screen bg-[#faf8f3] px-0 md:px-0 mb-20">
        <div className="w-full max-w-6xl mx-auto px-20">
          <Stepper currentStep={3} />
        </div>
        <div className="flex-1 flex flex-col pl-28">
          <div className="w-full max-w-2xl">
            <h1 className="text-3xl font-bold text-[#16305B] mb-8 mt-2">Custom Voir Dire Questions</h1>
            <form className="space-y-6" onSubmit={handleNext}>
              {questions.map((q, idx) => (
                <div key={idx} className="mb-4">
                  <label className="block mb-1 text-[#16305B] font-medium">
                    Question No. {idx + 1} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={q}
                      onChange={e => handleChange(idx, e.target.value)}
                      placeholder='Write out Voir Dire as a "Yes / No answer" question.'
                      className="flex-1 px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                    />
                    <button
                      type="button"
                      onClick={() => removeQuestion(idx)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors flex items-center gap-2 border border-red-200"
                      title="Remove this question"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Remove</span>
                    </button>
                  </div>
                  {validationErrors[idx] && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors[idx]}</p>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addQuestion}
                className="text-[#16305B] text-sm font-medium mb-4 hover:text-[#0A2342] transition-colors flex items-center gap-1"
              >
                <span className="text-lg">+</span>
                <span>Add Another Voir Dire Question</span>
              </button>
              <button
                type="submit"
                className="w-full bg-[#16305B] text-white font-semibold px-8 py-2 rounded-md hover:bg-[#0A2342] transition"
              >
                Next
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}