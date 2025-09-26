"use client";
import { useEffect, useState } from "react";
import { Users, UserCheck, Calendar, FileText, AlertCircle, CheckCircle2, Clock, Building2 } from "lucide-react";

const BLUE = "#0A2342";
const BG = "#FAF9F6";
const LIGHT_BLUE = "#e6ecf5";
const ACCENT_YELLOW = "#F6E27F";

type Attorney = {
  id: string;
  name: string;
  email: string;
  barNumber: string;
  verified: boolean;
};

type Juror = {
  id: string;
  name: string;
  email: string;
  age: string;
  county: string;
  verified: boolean;
};

export default function AdminDashboard() {
  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  const [jurors, setJurors] = useState<Juror[]>([]);
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<any[]>([]);

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
        setJurors(jurData.jurors || jurData);
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
              <button className="w-full bg-white rounded-lg p-4 text-left font-medium hover:shadow-md transition-all border border-gray-200 group">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  <span className="ml-3 text-gray-900 group-hover:text-blue-600">Pending Cases Excel Sheet</span>
                </div>
              </button>
              
              <button className="w-full bg-white rounded-lg p-4 text-left font-medium hover:shadow-md transition-all border border-gray-200 group">
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  <span className="ml-3 text-gray-900 group-hover:text-blue-600">Attorneys Excel Sheet</span>
                </div>
              </button>
              
              <button className="w-full bg-white rounded-lg p-4 text-left font-medium hover:shadow-md transition-all border border-gray-200 group">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  <span className="ml-3 text-gray-900 group-hover:text-blue-600">Jurors Excel Sheet</span>
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
<div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
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
    <div className="space-y-6">
      {cases.map((c) => (
        <div
          key={c.id}
          className="border-l-4 pl-4"
          style={{ borderColor: BLUE }}
        >
          <div className="font-semibold text-gray-900 mb-2">
            {c.caseNumber} – Scheduled Start Time:{" "}
            {c.scheduledTime || "_____"}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-blue-600 hover:underline cursor-pointer">
              <span>🔗 Link to {c.courtroom}</span>
            </div>
            <div className="text-gray-600">
              Debriefing Starts: {c.debriefing}
            </div>
            <div className="text-gray-600">
              Actual Ending Time: {c.endingTime}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Notes:</span>
              <input className="flex-1 border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>


          {/* Today's Notifications */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 mr-3" style={{ color: BLUE }} />
              <h3 className="text-xl font-semibold" style={{ color: BLUE }}>Today's Notifications</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="text-gray-700 font-medium">Case No.</span>
                <input className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-gray-700 font-medium">Case No.</span>
                <input className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Building2 className="h-6 w-6 mr-3" style={{ color: BLUE }} />
                  <h2 className="text-xl font-semibold" style={{ color: BLUE }}>Attorneys Management</h2>
                </div>
                <div className="text-sm text-gray-600">
                  {attorneys.length} total attorneys
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
                  {attorneys.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No attorneys found</p>
                        <p className="text-gray-400 text-sm">New attorney registrations will appear here</p>
                      </td>
                    </tr>
                  ) : (
                    attorneys.map((attorney) => (
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
          </div>

          {/* Jurors Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-6 w-6 mr-3" style={{ color: BLUE }} />
                  <h2 className="text-xl font-semibold" style={{ color: BLUE }}>Jurors Management</h2>
                </div>
                <div className="text-sm text-gray-600">
                  {jurors.length} total jurors
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
                  {jurors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No jurors found</p>
                        <p className="text-gray-400 text-sm">New juror registrations will appear here</p>
                      </td>
                    </tr>
                  ) : (
                    jurors.map((juror) => (
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
          </div>
        </div>
      </div>
    </main>
  );
}