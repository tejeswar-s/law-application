"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function CaseDetailsPage() {
  const [state, setState] = useState("");
  const [county, setCounty] = useState("");
  const [caseType, setCaseType] = useState("");
  const [caseTier, setCaseTier] = useState("");
  const [caseDescription, setCaseDescription] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const steps = [
  "Case Details",
  "Plaintiff Details",
  "Defendant Details",
  "Voir Dire Part 1 & 2",
  "Payment Details",
  "Review & Submit",
];
  const validate = () => {
    const errors: Record<string, string> = {};
    if (!state) errors.state = "State is required";
    if (!county) errors.county = "County is required";
    if (!caseType) errors.caseType = "Case type is required";
    if (!caseTier) errors.caseTier = "Trial case tier is required";
    if (!caseDescription.trim()) errors.caseDescription = "Case description is required";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    localStorage.setItem("state", state);
    localStorage.setItem("county", county);
    localStorage.setItem("caseType", caseType);
    localStorage.setItem("caseTier", caseTier);
    localStorage.setItem("caseDescription", caseDescription);
    // localStorage.setItem("paymentMethod", paymentMethod);
    // localStorage.setItem("paymentAmount", paymentAmount);
    // localStorage.setItem("plaintiffGroups", JSON.stringify(plaintiffGroups));
    // localStorage.setItem("defendantGroups", JSON.stringify(defendantGroups));
    router.push("/attorney/state/plaintiff-details");
  };

  return (
    <div className="min-h-screen flex bg-[#faf8f3] font-sans">
      {/* Sidebar */}
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
              <p>Please fill out the following fields with the necessary information.</p>
              <p>Any with * is required.</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <section className="flex-1 flex flex-col min-h-screen bg-[#faf8f3] px-0 md:px-0 mb-20">
        <div className="w-full max-w-6xl mx-auto px-20">
          {/* Stepper */}
          <div className="flex items-center justify-between px-8 pb-8 pt-8">
            {steps.map((label, idx) => {
              const isActive = idx === 0;
              return (
                <div key={label} className="flex items-center flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                        ${isActive ? "border-[#16305B]" : "border-[#bfc6d1] bg-transparent"}
                      `}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-[#16305B]" : "bg-transparent"}`}></span>
                    </div>
                    <span className={`text-xs leading-tight max-w-[90px] ${isActive ? "text-[#16305B] font-semibold" : "text-[#bfc6d1]"}`}>
                      {label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="flex-1 h-[1px] bg-[#bfc6d1] ml-4 mr-4"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Case Details Form */}
        <div className="flex-1 flex flex-col pl-28">
          <div className="w-full max-w-2xl">
            <h1 className="text-3xl font-bold text-[#16305B] mb-8 mt-2">
              Case Details
            </h1>
            <form className="space-y-6" onSubmit={handleNext}>
              {/* State */}
              <div>
                <label className="block mb-1 text-[#16305B] font-medium">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                >
                  <option value="">Select State</option>
                  <option value="California">California</option>
                  <option value="Texas">Texas</option>
                  <option value="New York">New York</option>
                  {/* Add more states */}
                </select>
                {validationErrors.state && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.state}</p>
                )}
              </div>

              {/* County */}
              <div>
                <label className="block mb-1 text-[#16305B] font-medium">
                  County <span className="text-red-500">*</span>
                </label>
                <select
                  value={county}
                  onChange={e => setCounty(e.target.value)}
                  className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                >
                  <option value="">Select County</option>
                  <option value="County A">County A</option>
                  <option value="County B">County B</option>
                  <option value="County C">County C</option>
                  {/* Add more counties */}
                </select>
                {validationErrors.county && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.county}</p>
                )}
              </div>

              {/* Type of Trial Case */}
              <div>
                <label className="block mb-1 text-[#16305B] font-medium">
                  Type of Trial Case <span className="text-red-500">*</span>
                </label>
                <select
                  value={caseType}
                  onChange={e => setCaseType(e.target.value)}
                  className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                >
                  <option value="">Select Case Type</option>
                  <option value="Civil">Civil</option>
                  <option value="Criminal">Criminal</option>
                </select>
                {validationErrors.caseType && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.caseType}</p>
                )}
              </div>

              {/* Trial Case Tier */}
              <div>
                <label className="block mb-1 text-[#16305B] font-medium">
                  Trial Case Tier <span className="text-red-500">*</span>
                </label>
                <select
                  value={caseTier}
                  onChange={e => setCaseTier(e.target.value)}
                  className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                >
                  <option value="">Select Trial Case Tier</option>
                  <option value="Tier 1">Tier 1</option>
                  <option value="Tier 2">Tier 2</option>
                  <option value="Tier 3">Tier 3</option>
                </select>
                {validationErrors.caseTier && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.caseTier}</p>
                )}
              </div>

              {/* Case Description */}
              <div>
                <label className="block mb-1 text-[#16305B] font-medium">
                  Case Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={caseDescription}
                  onChange={e => setCaseDescription(e.target.value)}
                  placeholder="This section will be posted on the juror job board. Please do not include any confidential information."
                  className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                  rows={3}
                />
                {validationErrors.caseDescription && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.caseDescription}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#16305B] text-white font-semibold px-8 py-2 rounded-md hover:bg-[#0A2342] transition"
                >
                  Next
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
