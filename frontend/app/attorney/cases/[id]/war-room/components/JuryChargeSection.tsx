"use client";

import { useState, useEffect } from "react";
import { PlusIcon, TrashIcon, DocumentTextIcon, XMarkIcon } from "@heroicons/react/24/outline";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")
  : "http://localhost:4000";

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
}

type QuestionType = "Open Text" | "Multiple Choice" | "Yes/No";

type Question = {
  QuestionId?: number;
  questionText: string;
  questionType: QuestionType;
  options?: string[];
};

export default function JuryChargeSection({ caseId }: { caseId: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchQuestions();
  }, [caseId]);

  const fetchQuestions = async () => {
    try {
      const token = getCookie("token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE}/api/cases/${caseId}/jury-charge`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.questions.length > 0) {
          setQuestions(
            data.questions.map((q: any) => ({
              QuestionId: q.QuestionId,
              questionText: q.QuestionText,
              questionType: q.QuestionType,
              options: q.Options || [],
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error fetching jury charge questions:", error);
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: "", questionType: "Open Text", options: [] },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    
    // If changing to non-multiple choice, clear options
    if (field === "questionType" && value !== "Multiple Choice") {
      updated[index].options = [];
    }
    // If changing to multiple choice, initialize with empty array
    if (field === "questionType" && value === "Multiple Choice" && !updated[index].options) {
      updated[index].options = [""];
    }
    
    setQuestions(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    if (!updated[questionIndex].options) {
      updated[questionIndex].options = [];
    }
    updated[questionIndex].options!.push("");
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options![optionIndex] = value;
    }
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options) {
      updated[questionIndex].options = updated[questionIndex].options!.filter(
        (_, i) => i !== optionIndex
      );
    }
    setQuestions(updated);
  };

  const saveQuestions = async () => {
    // Validate
    const hasEmptyText = questions.some((q) => !q.questionText.trim());
    if (hasEmptyText) {
      setError("Please fill in all question texts before saving");
      return;
    }

    const hasEmptyOptions = questions.some(
      (q) =>
        q.questionType === "Multiple Choice" &&
        (!q.options || q.options.length < 2 || q.options.some((opt) => !opt.trim()))
    );
    if (hasEmptyOptions) {
      setError("Multiple choice questions must have at least 2 non-empty options");
      return;
    }

    setLoading(true);
    setSaved(false);
    setError("");

    try {
      const token = getCookie("token");
      const response = await fetch(`${API_BASE}/api/cases/${caseId}/jury-charge`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questions }),
      });

      if (response.ok) {
        setSaved(true);
        fetchQuestions();
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to save questions");
      }
    } catch (error) {
      console.error("Error saving questions:", error);
      setError("Failed to save questions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <DocumentTextIcon className="h-6 w-6 text-[#0C2D57] mr-3" />
          <div>
            <h2 className="text-xl font-semibold text-[#0C2D57]">Jury Charge / Verdict Questions</h2>
            <p className="text-sm text-gray-600 mt-1">
              Create custom questions for jurors to answer after the trial
            </p>
          </div>
        </div>
        <button
          onClick={addQuestion}
          className="flex items-center px-4 py-2 bg-[#0C2D57] text-white rounded-lg hover:bg-[#0a2347] transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Question
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {questions.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-lg font-medium">No questions added yet</p>
          <p className="text-sm mt-1">
            Click "Add Question" to create verdict questions for jurors
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((question, qIndex) => (
            <div
              key={qIndex}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">
                  Question {qIndex + 1}
                </h3>
                <button
                  onClick={() => removeQuestion(qIndex)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Question Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={question.questionType}
                    onChange={(e) =>
                      updateQuestion(qIndex, "questionType", e.target.value as QuestionType)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2D57] text-gray-900"
                  >
                    <option value="Open Text">Open Text</option>
                    <option value="Multiple Choice">Multiple Choice</option>
                    <option value="Yes/No">Yes/No</option>
                  </select>
                </div>

                {/* Question Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={question.questionText}
                    onChange={(e) =>
                      updateQuestion(qIndex, "questionText", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2D57] text-gray-900"
                    placeholder="e.g., Do you find the defendant liable for negligence?"
                    rows={2}
                  />
                </div>

                {/* Multiple Choice Options */}
                {question.questionType === "Multiple Choice" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Answer Options <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {question.options?.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) =>
                              updateOption(qIndex, optIndex, e.target.value)
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2D57] text-gray-900"
                            placeholder={`Option ${optIndex + 1}`}
                          />
                          <button
                            onClick={() => removeOption(qIndex, optIndex)}
                            className="text-red-600 hover:text-red-700 p-2"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addOption(qIndex)}
                        className="flex items-center text-[#0C2D57] hover:text-[#0a2347] text-sm font-medium"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Option
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
        {saved && (
          <span className="text-green-600 text-sm font-medium flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Questions saved successfully
          </span>
        )}
        <div className="ml-auto">
          <button
            onClick={saveQuestions}
            disabled={loading || questions.length === 0}
            className="px-6 py-2 bg-[#0C2D57] text-white rounded-lg hover:bg-[#0a2347] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Saving..." : "Save Questions"}
          </button>
        </div>
      </div>
    </div>
  );
}