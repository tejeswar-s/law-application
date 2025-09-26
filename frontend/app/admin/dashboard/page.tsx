"use client";
import { useEffect, useState, useRef } from "react";
import { Users, UserCheck, Calendar, FileText, AlertCircle, CheckCircle2, Clock, Building2 } from "lucide-react";

const BLUE = "#0A2342";
const BG = "#FAF9F6";
const LIGHT_BLUE = "#e6ecf5";
const ACCENT_YELLOW = "#F6E27F";

type Attorney = {
  AttorneyId: number;
  FirstName: string;
  LastName: string;
  Email: string;
  LawFirmName: string;
  State: string;
  StateBarNumber: string;
  IsVerified: boolean;
  CreatedAt: string;
  VerificationStatus?: string;
};

type Juror = {
  JurorId: number;
  Name: string;
  Email: string;
  County: string;
  State: string;
  IsVerified: boolean;
  IsActive?: boolean;
  OnboardingCompleted?: boolean;
  CreatedAt: string;
  CriteriaResponses?: { question: string; answer: string }[];
};

export default function AdminDashboard() {
  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  const [jurors, setJurors] = useState<Juror[]>([]);
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<any[]>([]);
  const [showCriteriaPopup, setShowCriteriaPopup] = useState(false);
  const [currentCriteriaResponses, setCurrentCriteriaResponses] = useState<{ question: string; answer: string }[]>([]);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/cases");
        const data = await res.json();

        const casesData = Array.isArray(data)
          ? data
          : Array.isArray(data.recordset)
          ? data.recordset
          : [];

        setCases(
          casesData.map((c: any) => ({
            id: c.Id,
            caseNumber: c.CaseNumber || `Case #${c.Id}`,
            scheduledDate: c.ScheduledDate,
            scheduledTime: c.ScheduledTime,
            courtroom: c.Courtroom || `ACS Courtroom`,
            debriefing: c.DebriefingStart || "_____",
            endingTime: c.EndingTime || "_____",
          }))
        );
      } catch (err) {
        console.error("Error fetching cases:", err);
      }
    };

    fetchCases();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [attRes, jurRes] = await Promise.all([
          fetch("http://localhost:4000/api/admin/attorneys"),
          fetch("http://localhost:4000/api/admin/jurors"),
        ]);
        const attData = await attRes.json();
        const jurData = await jurRes.json();
        console.log(attData);
        console.log(jurData);
        setAttorneys(attData.attorneys || attData);
        const jurorsData = (jurData.jurors || jurData).map((j: any) => ({
          JurorId: j.JurorId ?? j.id,
          Name: j.Name ?? j.name,
          Email: j.Email ?? j.email,
          County: j.County ?? j.county,
          State: j.State ?? j.state,
          IsVerified: j.IsVerified ?? j.verified,
          IsActive: j.IsActive ?? j.isActive,
          OnboardingCompleted: j.OnboardingCompleted ?? j.onboardingCompleted,
          CreatedAt: j.CreatedAt ?? j.createdAt,
          CriteriaResponses: j.CriteriaResponses ?? j.criteriaResponses ?? [],
        }));
        setJurors(jurorsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleVerifyAttorney = async (attorneyId: number) => {
    try {
      await fetch(
        `http://localhost:4000/api/admin/attorneys/${attorneyId}/verify`,
        {
          method: "POST",
        }
      );
      setAttorneys((prev) =>
        prev.map((a) =>
          a.AttorneyId === attorneyId
            ? { ...a, VerificationStatus: "verified", IsVerified: true }
            : a
        )
      );
    } catch (error) {
      console.error("Error verifying attorney:", error);
    }
  };

  const handleVerifyJuror = async (jurorId: number) => {
    try {
      await fetch(`http://localhost:4000/api/admin/jurors/${jurorId}/verify`, {
        method: "POST",
      });
      setJurors((prev) =>
        prev.map((j) =>
          j.JurorId === jurorId
            ? { ...j, VerificationStatus: "verified", IsVerified: true }
            : j
        )
      );
    } catch (error) {
      console.error("Error verifying juror:", error);
    }
  };

  // Stats calculations
  const stats = {
    totalAttorneys: attorneys.length,
    verifiedAttorneys: attorneys.filter(a => a.IsVerified).length,
    totalJurors: jurors.length,
    verifiedJurors: jurors.filter(j => j.IsVerified).length,
  };

  // Filter states
  const [attorneyFilter, setAttorneyFilter] = useState<"all" | "verified" | "not_verified">("all");
  const [jurorFilter, setJurorFilter] = useState<"all" | "verified" | "not_verified">("all");

  // Pagination states
  const [attorneyPage, setAttorneyPage] = useState(1);
  const [jurorPage, setJurorPage] = useState(1);
  const PAGE_SIZE = 10;

  // Refs for smooth scroll
  const attorneySectionRef = useRef<HTMLDivElement>(null);
  const jurorSectionRef = useRef<HTMLDivElement>(null);

  // Filtered attorneys
  const filteredAttorneys = attorneys.filter(a => {
    if (attorneyFilter === "verified") return a.IsVerified;
    if (attorneyFilter === "not_verified") return !a.IsVerified;
    return true;
  });
  // Paginated attorneys
  const attorneyStartIdx = (attorneyPage - 1) * PAGE_SIZE;
  const attorneyEndIdx = attorneyStartIdx + PAGE_SIZE;
  const paginatedAttorneys = filteredAttorneys.slice(attorneyStartIdx, attorneyEndIdx);

  // Filtered jurors
  const filteredJurors = jurors.filter(j => {
    if (jurorFilter === "verified") return j.IsVerified;
    if (jurorFilter === "not_verified") return !j.IsVerified;
    return true;
  });
  // Paginated jurors
  const jurorStartIdx = (jurorPage - 1) * PAGE_SIZE;
  const jurorEndIdx = jurorStartIdx + PAGE_SIZE;
  const paginatedJurors = filteredJurors.slice(jurorStartIdx, jurorEndIdx);

  if (loading) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: BG }}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: BLUE }}></div>
          <p className="text-lg font-medium" style={{ color: BLUE }}>Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full" style={{ backgroundColor: BG }}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: BLUE }}>
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Manage attorneys, jurors, and system operations</p>
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-lg" style={{ backgroundColor: LIGHT_BLUE }}>
                <Building2 className="h-6 w-6" style={{ color: BLUE }} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Attorneys</p>
                <p className="text-2xl font-bold" style={{ color: BLUE }}>{stats.totalAttorneys}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified Attorneys</p>
                <p className="text-2xl font-bold text-green-600">{stats.verifiedAttorneys}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-lg" style={{ backgroundColor: LIGHT_BLUE }}>
                <Users className="h-6 w-6" style={{ color: BLUE }} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jurors</p>
                <p className="text-2xl font-bold" style={{ color: BLUE }}>{stats.totalJurors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified Jurors</p>
                <p className="text-2xl font-bold text-green-600">{stats.verifiedJurors}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions and Calendar Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-semibold mb-4" style={{ color: BLUE }}>Quick Actions</h2>
            <div className="space-y-3">
              <button
                className="w-full bg-white rounded-lg p-4 text-left font-medium hover:shadow-md transition-all border border-gray-200 group"
                onClick={() => attorneySectionRef.current?.scrollIntoView({ behavior: "smooth" })}
              >
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  <span className="ml-3 text-gray-900 group-hover:text-blue-600">Attorneys Excel Sheet</span>
                </div>
              </button>
              <button
                className="w-full bg-white rounded-lg p-4 text-left font-medium hover:shadow-md transition-all border border-gray-200 group"
                onClick={() => jurorSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
              >
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  <span className="ml-3 text-gray-900 group-hover:text-blue-600">Jurors Excel Sheet</span>
                </div>
              </button>
              
              <button className="w-full bg-white rounded-lg p-4 text-left font-medium hover:shadow-md transition-all border border-gray-200 group">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  <span className="ml-3 text-gray-900 group-hover:text-blue-600">Pending Cases Excel Sheet</span>
                </div>
              </button>
            </div>

            <h3 className="text-lg font-semibold mt-6 mb-3" style={{ color: BLUE }}>Agreements</h3>
            <div className="space-y-3">
              <button className="w-full bg-white border-2 rounded-lg p-4 text-left font-medium hover:shadow-md transition-all group" style={{ borderColor: BLUE }}>
                <div className="flex items-center">
                  <FileText className="h-5 w-5 group-hover:text-blue-600 transition-colors" style={{ color: BLUE }} />
                  <span className="ml-3" style={{ color: BLUE }}>Attorneys Signed Agreements</span>
                </div>
              </button>
              
              <button className="w-full bg-white rounded-lg p-4 text-left font-medium hover:shadow-md transition-all border border-gray-200 group">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  <span className="ml-3 text-gray-900 group-hover:text-blue-600">Jurors Signed Agreements</span>
                </div>
              </button>
              
              <button className="w-full bg-white rounded-lg p-4 text-left font-medium hover:shadow-md transition-all border border-gray-200 group">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  <span className="ml-3 text-gray-900 group-hover:text-blue-600">War Room Support</span>
                </div>
              </button>
            </div>
          </div>

          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <Calendar className="h-6 w-6 mr-3" style={{ color: BLUE }} />
              <h2 className="text-xl font-semibold" style={{ color: BLUE }}>Interactive Calendar</h2>
            </div>
            <div className="flex flex-col items-center justify-center min-h-[300px] bg-gray-50 rounded-lg">
              <Calendar className="h-16 w-16 text-gray-400 mb-4" />
              <div className="text-lg font-semibold text-gray-600 mb-2">Calendar Component</div>
              <div className="text-sm text-gray-500 text-center">
                Cases identified by Case No.<br />
                Integration pending - calendar component to be embedded here
              </div>
            </div>
          </div>
        </div>

        {/* Today's Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Trials */}
<div
  className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
  style={{ minHeight: 320, maxHeight: 320, display: 'flex', flexDirection: 'column' }}
>
  <div className="flex items-center mb-4">
    <Clock className="h-6 w-6 mr-3" style={{ color: BLUE }} />
    <h3 className="text-xl font-semibold" style={{ color: BLUE }}>
      Today's Trials
    </h3>
  </div>
  {cases.length === 0 ? (
    <div className="text-center text-gray-500 py-8">
      No trials scheduled today.
    </div>
  ) : (
    <div
      className="flex-1 overflow-y-auto space-y-6"
      style={{ maxHeight: 220 }} // Adjust height for ~3 items
    >
      {cases.map((c) => (
        <div key={c.id} className="border rounded-lg p-4 bg-gray-50">
          <div className="font-semibold text-blue-900">{c.caseNumber}</div>
          <div className="text-sm text-gray-600">Courtroom: {c.courtroom}</div>
          <div className="text-sm text-gray-600">
            Date: {c.scheduledDate} | Time: {c.scheduledTime}
          </div>
          <div className="text-sm text-gray-600">
            Debriefing: {c.debriefing} | Ending: {c.endingTime}
          </div>
        </div>
      ))}
      {cases.length > 3 && (
        <div className="text-center text-blue-600 text-sm mt-2">Scroll for more...</div>
      )}
    </div>
  )}
</div>


          {/* Today's Notifications */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200" style={{ minHeight: 320, maxHeight: 320, display: 'flex', flexDirection: 'column' }}>
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 mr-3" style={{ color: BLUE }} />
              <h3 className="text-xl font-semibold" style={{ color: BLUE }}>Today's Notifications</h3>
            </div>
            
            <div className="flex-1 flex flex-col justify-center space-y-4">
              <div className="flex items-center space-x-3">
                <input className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-black" />
              </div>
              <div className="flex items-center space-x-3">
                <input className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-black" />
              </div>
              <button className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Send Notifications
              </button>
            </div>
          </div>
        </div>

        {/* Data Tables */}
        <div className="space-y-8">
          {/* Attorneys Table */}
          <div ref={attorneySectionRef} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Building2 className="h-6 w-6 mr-3" style={{ color: BLUE }} />
                  <h2 className="text-xl font-semibold" style={{ color: BLUE }}>Attorneys Management</h2>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">{filteredAttorneys.length} attorneys</div>
                  <select
                    className="border rounded px-2 py-1 text-sm text-black bg-white"
                    value={attorneyFilter}
                    onChange={e => {
                      setAttorneyFilter(e.target.value as any);
                      setAttorneyPage(1);
                    }}
                  >
                    <option value="all">All</option>
                    <option value="verified">Verified</option>
                    <option value="not_verified">Not Verified</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Attorney Info</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Law Firm</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bar Number</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedAttorneys.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No attorneys found</p>
                        <p className="text-gray-400 text-sm">New attorney registrations will appear here</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedAttorneys.map((attorney) => (
                      <tr key={attorney.AttorneyId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-gray-900">
                              {attorney.FirstName} {attorney.LastName}
                            </div>
                            <div className="text-sm text-gray-600">{attorney.Email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-900">{attorney.LawFirmName}</td>
                        <td className="px-6 py-4 text-gray-900">{attorney.State}</td>
                        <td className="px-6 py-4 text-gray-900 font-mono text-sm">{attorney.StateBarNumber}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {attorney.IsVerified ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(attorney.CreatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {!attorney.IsVerified && (
                            <button
                              onClick={() => handleVerifyAttorney(attorney.AttorneyId)}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors hover:shadow-md"
                              style={{ backgroundColor: BLUE }}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Verify
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="flex justify-between items-center px-6 py-4 bg-gray-50">
              <button
                className="px-3 py-1 rounded bg-gray-200 text-black disabled:opacity-50"
                disabled={attorneyPage === 1}
                onClick={() => setAttorneyPage(attorneyPage - 1)}
              >
                Previous
              </button>
              <span className="text-sm text-black">
                Page {attorneyPage} of {Math.max(1, Math.ceil(filteredAttorneys.length / PAGE_SIZE))}
              </span>
              <button
                className="px-3 py-1 rounded bg-gray-200 text-black disabled:opacity-50"
                disabled={attorneyEndIdx >= filteredAttorneys.length}
                onClick={() => setAttorneyPage(attorneyPage + 1)}
              >
                Next
              </button>
            </div>
          </div>

          {/* Jurors Table */}
          <div ref={jurorSectionRef} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-6 w-6 mr-3" style={{ color: BLUE }} />
                  <h2 className="text-xl font-semibold" style={{ color: BLUE }}>Jurors Management</h2>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">{filteredJurors.length} jurors</div>
                  <select
                    className="border rounded px-2 py-1 text-sm text-black bg-white"
                    value={jurorFilter}
                    onChange={e => {
                      setJurorFilter(e.target.value as any);
                      setJurorPage(1);
                    }}
                  >
                    <option value="all">All</option>
                    <option value="verified">Verified</option>
                    <option value="not_verified">Not Verified</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Juror Info</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Verification</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Onboarding</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedJurors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No jurors found</p>
                        <p className="text-gray-400 text-sm">New juror registrations will appear here</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedJurors.map((juror) => (
                      <tr key={juror.JurorId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-gray-900">{juror.Name}</div>
                            <div className="text-sm text-gray-600">{juror.Email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-gray-900">{juror.County}</div>
                            <div className="text-sm text-gray-600">{juror.State}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {juror.IsVerified ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {juror.IsActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {juror.OnboardingCompleted ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Complete
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Pending
                            </span>
                          )}
                          {juror.CriteriaResponses && juror.CriteriaResponses.length > 0 && (
                            <button
                              className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-blue-800 hover:bg-blue-100 transition"
                              onClick={() => {
                                setCurrentCriteriaResponses(juror.CriteriaResponses!);
                                setShowCriteriaPopup(true);
                              }}
                            >
                              View
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(juror.CreatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {!juror.IsVerified && (
                            <button
                              onClick={() => handleVerifyJuror(juror.JurorId)}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors hover:shadow-md"
                              style={{ backgroundColor: BLUE }}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Verify
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="flex justify-between items-center px-6 py-4 bg-gray-50">
              <button
                className="px-3 py-1 rounded bg-gray-200 text-black disabled:opacity-50"
                disabled={jurorPage === 1}
                onClick={() => setJurorPage(jurorPage - 1)}
              >
                Previous
              </button>
              <span className="text-sm text-black">
                Page {jurorPage} of {Math.max(1, Math.ceil(filteredJurors.length / PAGE_SIZE))}
              </span>
              <button
                className="px-3 py-1 rounded bg-gray-200 text-black disabled:opacity-50"
                disabled={jurorEndIdx >= filteredJurors.length}
                onClick={() => setJurorPage(jurorPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {showCriteriaPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-lg shadow-lg p-6 min-w-[300px] max-w-[90vw]">
              <h3 className="text-lg font-semibold mb-3 text-blue-900">Criteria Responses</h3>
              <div className="space-y-2 mb-4">
                {currentCriteriaResponses.map((resp, idx) => (
                  <div key={idx} className="text-sm text-gray-800">
                    <span className="font-semibold">{resp.question}:</span> {resp.answer}
                  </div>
                ))}
                {currentCriteriaResponses.length === 0 && (
                  <div className="text-sm text-gray-400">No responses available.</div>
                )}
              </div>
              <button
                className="px-4 py-1 rounded bg-blue-600 text-white font-medium hover:bg-blue-700"
                onClick={() => setShowCriteriaPopup(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}