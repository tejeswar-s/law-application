"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Stepper from "../../components/Stepper";

export default function CaseDetailsPage() {
  const [state, setState] = useState("");
  const [county, setCounty] = useState("");
  const [caseType, setCaseType] = useState("");
  const [caseTier, setCaseTier] = useState("");
  const [caseDescription, setCaseDescription] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [caseTypeSelection, setCaseTypeSelection] = useState<string | null>(null);
  const [availableStates, setAvailableStates] = useState<{ label: string; value: string }[]>([]);
  const [availableCounties, setAvailableCounties] = useState<{ label: string; value: string }[]>([]);
  const [countiesLoading, setCountiesLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCaseTypeSelection(localStorage.getItem("caseTypeSelection"));
      // Load saved data
      setState(localStorage.getItem("state") || "");
      setCounty(localStorage.getItem("county") || "");
      setCaseType(localStorage.getItem("caseType") || "");
      setCaseTier(localStorage.getItem("caseTier") || "");
      setCaseDescription(localStorage.getItem("caseDescription") || "");
    }
  }, []);

  // Fetch states on mount
  useEffect(() => {
    async function fetchStates() {
      try {
        const res = await fetch("https://api.census.gov/data/2020/dec/pl?get=NAME&for=state:*");
        const data = await res.json();
        const states = data.slice(1).map((row: [string, string]) => ({
          label: row[0],
          value: row[1]
        }));
        // Sort states alphabetically by label
        states.sort((a, b) => a.label.localeCompare(b.label));
        setAvailableStates(states);
      } catch (error) {
        setAvailableStates([]);
      }
    }
    fetchStates();
  }, []);

  // Fetch counties when state changes
  useEffect(() => {
    async function fetchCounties() {
      if (state) {
        setCountiesLoading(true);
        try {
          const stateCode = state.padStart(2, "0");
          const res = await fetch(
            `https://api.census.gov/data/2020/dec/pl?get=NAME&for=county:*&in=state:${stateCode}`
          );
          const data = await res.json();
          setAvailableCounties(
            data.slice(1).map((row: [string, string, string]) => ({
              label: row[0],
              value: row[2]
            }))
          );
        } catch (error) {
          setAvailableCounties([]);
        } finally {
          setCountiesLoading(false);
        }
      } else {
        setAvailableCounties([]);
      }
    }
    fetchCounties();
  }, [state]);

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
          <Stepper currentStep={0} />
        </div>

        {/* Case Details Form */}
        <div className="flex-1 flex flex-col pl-28">
          <div className="w-full max-w-2xl">
            <h1 className="text-3xl font-bold text-[#16305B] mb-8 mt-2">
              Case Details {caseTypeSelection ? `(${caseTypeSelection.charAt(0).toUpperCase() + caseTypeSelection.slice(1)})` : ""}
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
                  {availableStates.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
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
                <div className="relative z-10">
                  <select
                    value={county}
                    onChange={e => setCounty(e.target.value)}
                    className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                    disabled={!state || countiesLoading}
                  >
                    <option value="">Select County</option>
                    {availableCounties.map(c => (
                      <option key={c.value} value={c.label}>{c.label}</option>
                    ))}
                  </select>
                  {validationErrors.county && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.county}</p>
                  )}
                </div>
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
                  <option value="Tier 1">Tier 1 - 2.5 hours, $2,500</option>
                  <option value="Tier 2">Tier 2 - 3.0 hours, $3,000</option>
                  <option value="Tier 3">Tier 3 - 4.0 hours, $4,000</option>
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