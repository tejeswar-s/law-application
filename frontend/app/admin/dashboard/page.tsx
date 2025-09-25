"use client";
import { useEffect, useState } from "react";
import { Users, UserCheck, Calendar, FileText, AlertCircle, CheckCircle2, Clock, Building2, X, Eye, EyeOff } from "lucide-react";

const BLUE = "#0A2342";
const BG = "#FAF9F6";
const LIGHT_BLUE = "#e6ecf5";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Attorney = {
  AttorneyId: number;
  FirstName: string;
  LastName: string;
  LawFirmName: string;
  Email: string;
  State: string;
  StateBarNumber: string;
  VerificationStatus: string;
  IsVerified: boolean;
  CreatedAt: string;
};

type Juror = {
  JurorId: number;
  Name: string;
  Email: string;
  County: string;
  State: string;
  VerificationStatus: string;
  IsVerified: boolean;
  IsActive: boolean;
  OnboardingCompleted: boolean;
  CriteriaResponses?: string;
  CreatedAt: string;
};

type Trial = {
  CaseId: number;
  CaseNumber: string;
  Title: string;
  ScheduledStartTime: string;
  ScheduledEndTime: string;
  CourtRoomNumber: string;
  Status: string;
  ActualStartTime?: string;
  ActualEndTime?: string;
  Notes?: string;
};

type CriteriaAnswer = {
  age?: string;
  citizen?: string;
  work1?: string;
  work2?: string;
  felony?: string;
  indictment?: string;
};

export default function AdminDashboard() {
  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  const [jurors, setJurors] = useState<Juror[]>([]);
  const [todayTrials, setTodayTrials] = useState<Trial[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  
  // Modal states
  const [selectedJuror, setSelectedJuror] = useState<Juror | null>(null);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineTarget, setDeclineTarget] = useState<{ type: 'attorney' | 'juror', id: number } | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [attRes, jurRes, trialsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/attorneys`),
        fetch(`${API_BASE}/api/admin/jurors`),
        fetch(`${API_BASE}/api/admin/today-trials`)
      ]);
      
      const attData = await attRes.json();
      const jurData = await jurRes.json();
      const trialsData = await trialsRes.json();
      
      setAttorneys(attData.attorneys || attData);
      setJurors(jurData.jurors || jurData);
      setTodayTrials(trialsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAttorney = async (attorneyId: number) => {
    setActionLoading(prev => ({ ...prev, [`attorney_${attorneyId}`]: true }));
    try {
      const response = await fetch(`${API_BASE}/api/admin/attorneys/${attorneyId}/verify`, {
        method: "POST",
      });
      
      if (response.ok) {
        setAttorneys(prev =>
          prev.map(a =>
            a.AttorneyId === attorneyId
              ? { ...a, VerificationStatus: "verified", IsVerified: true }
              : a
          )
        );
      }
    } catch (error) {
      console.error("Error verifying attorney:", error);
    } finally {
      setActionLoading(prev => ({ ...prev, [`attorney_${attorneyId}`]: false }));
    }
  };

  const handleDeclineAttorney = async (attorneyId: number, reason: string) => {
    setActionLoading(prev => ({ ...prev, [`attorney_${attorneyId}`]: true }));
    try {
      const response = await fetch(`${API_BASE}/api/admin/attorneys/${attorneyId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      
      if (response.ok) {
        setAttorneys(prev =>
          prev.map(a =>
            a.AttorneyId === attorneyId
              ? { ...a, VerificationStatus: "declined", IsVerified: false }
              : a
          )
        );
      }
    } catch (error) {
      console.error("Error declining attorney:", error);
    } finally {
      setActionLoading(prev => ({ ...prev, [`attorney_${attorneyId}`]: false }));
      setShowDeclineModal(false);
      setDeclineReason("");
      setDeclineTarget(null);
    }
  };

  const handleVerifyJuror = async (jurorId: number) => {
    setActionLoading(prev => ({ ...prev, [`juror_${jurorId}`]: true }));
    try {
      const response = await fetch(`${API_BASE}/api/admin/jurors/${jurorId}/verify`, {
        method: "POST",
      });
      
      if (response.ok) {
        setJurors(prev =>
          prev.map(j =>
            j.JurorId === jurorId
              ? { ...j, VerificationStatus: "verified", IsVerified: true }
              : j
          )
        );
      }
    } catch (error) {
      console.error("Error verifying juror:", error);
    } finally {
      setActionLoading(prev => ({ ...prev, [`juror_${jurorId}`]: false }));
    }
  };

  const handleDeclineJuror = async (jurorId: number, reason: string) => {
    setActionLoading(prev => ({ ...prev, [`juror_${jurorId}`]: true }));
    try {
      const response = await fetch(`${API_BASE}/api/admin/jurors/${jurorId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      
      if (response.ok) {
        setJurors(prev =>
          prev.map(j =>
            j.JurorId === jurorId
              ? { ...j, VerificationStatus: "declined", IsVerified: false }
              : j
          )
        );
      }
    } catch (error) {
      console.error("Error declining juror:", error);
    } finally {
      setActionLoading(prev => ({ ...prev, [`juror_${jurorId}`]: false }));
      setShowDeclineModal(false);
      setDeclineReason("");
      setDeclineTarget(null);
    }
  };

  const openDeclineModal = (type: 'attorney' | 'juror', id: number) => {
    setDeclineTarget({ type, id });
    setShowDeclineModal(true);
  };

  const handleDecline = () => {
    if (!declineTarget) return;
    
    if (declineTarget.type === 'attorney') {
      handleDeclineAttorney(declineTarget.id, declineReason);
    } else {
      handleDeclineJuror(declineTarget.id, declineReason);
    }
  };

  const parseCriteriaResponses = (criteriaString: string): CriteriaAnswer => {
    try {
      return JSON.parse(criteriaString || '{}');
    } catch {
      return {};
    }
  };

  const updateTrialNotes = async (caseId: number, notes: string, status: string = 'in_progress') => {
    try {
      await fetch(`${API_BASE}/api/admin/trials/${caseId}/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, status }),
      });
      
      setTodayTrials(prev =>
        prev.map(trial =>
          trial.CaseId === caseId ? { ...trial, Notes: notes, Status: status } : trial
        )
      );
    } catch (error) {
      console.error("Error updating trial:", error);
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
          <div className="space-y-4">
            {/* Empty State */}
            {!Array.isArray(todayTrials) || todayTrials.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 text-gray-400 mb-2" />
                <p>No trials scheduled for today</p>
              </div>
            ) : (
              todayTrials.map((trial) => (
                <div
                  key={trial.CaseId}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  {/* Trial Header */}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {trial.CaseNumber}
                      </h4>
                      <p className="text-sm text-gray-600">{trial.Title}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusClass(
                        trial.Status
                      )}`}
                    >
                      {trial.Status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>

                  {/* Trial Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">
                        Scheduled:{" "}
                        {new Date(trial.ScheduledStartTime).toLocaleTimeString()}
                      </p>
                      <p className="text-gray-600">
                        Courtroom: {trial.CourtRoomNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">
                        Actual Start:{" "}
                        {trial.ActualStartTime
                          ? new Date(trial.ActualStartTime).toLocaleTimeString()
                          : "Pending"}
                      </p>
                      <p className="text-gray-600">
                        Actual End:{" "}
                        {trial.ActualEndTime
                          ? new Date(trial.ActualEndTime).toLocaleTimeString()
                          : "Pending"}
                      </p>
                    </div>
                  </div>

                  {/* Notes Input */}
                  <div className="mt-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Notes:</span>
                      <input
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                        placeholder="Add notes..."
                        value={trial.Notes || ""}
                        onChange={(e) =>
                          updateTrialNotes(trial.CaseId, e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
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
                            ) : attorney.VerificationStatus === 'declined' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <X className="h-3 w-3 mr-1" />
                                Declined
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
                          {!attorney.IsVerified && attorney.VerificationStatus !== 'declined' && (
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => handleVerifyAttorney(attorney.AttorneyId)}
                                disabled={actionLoading[`attorney_${attorney.AttorneyId}`]}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors hover:shadow-md disabled:opacity-50"
                                style={{ backgroundColor: BLUE }}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                {actionLoading[`attorney_${attorney.AttorneyId}`] ? 'Loading...' : 'Verify'}
                              </button>
                              <button
                                onClick={() => openDeclineModal('attorney', attorney.AttorneyId)}
                                disabled={actionLoading[`attorney_${attorney.AttorneyId}`]}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors hover:shadow-md disabled:opacity-50"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Decline
                              </button>
                            </div>
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
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Criteria</th>
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
                          ) : juror.VerificationStatus === 'declined' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <X className="h-3 w-3 mr-1" />
                              Declined
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
                          {juror.CriteriaResponses && (
                            <button
                              onClick={() => {
                                setSelectedJuror(juror);
                                setShowCriteriaModal(true);
                              }}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(juror.CreatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {!juror.IsVerified && juror.VerificationStatus !== 'declined' && (
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => handleVerifyJuror(juror.JurorId)}
                                disabled={actionLoading[`juror_${juror.JurorId}`]}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors hover:shadow-md disabled:opacity-50"
                                style={{ backgroundColor: BLUE }}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                {actionLoading[`juror_${juror.JurorId}`] ? 'Loading...' : 'Verify'}
                              </button>
                              <button
                                onClick={() => openDeclineModal('juror', juror.JurorId)}
                                disabled={actionLoading[`juror_${juror.JurorId}`]}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors hover:shadow-md disabled:opacity-50"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Decline
                              </button>
                            </div>
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

      {/* Criteria Modal */}
      {showCriteriaModal && selectedJuror && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold" style={{ color: BLUE }}>
                  Criteria Responses - {selectedJuror.Name}
                </h3>
                <button
                  onClick={() => {
                    setShowCriteriaModal(false);
                    setSelectedJuror(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {(() => {
                const criteria = parseCriteriaResponses(selectedJuror.CriteriaResponses || '{}');
                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-700 mb-2">Are you at least 18 years old?</p>
                        <p className={`font-semibold ${criteria.age === 'yes' ? 'text-green-600' : 'text-red-600'}`}>
                          {criteria.age === 'yes' ? 'Yes' : criteria.age === 'no' ? 'No' : 'Not answered'}
                        </p>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-700 mb-2">Are you a US citizen?</p>
                        <p className={`font-semibold ${criteria.citizen === 'yes' ? 'text-green-600' : 'text-red-600'}`}>
                          {criteria.citizen === 'yes' ? 'Yes' : criteria.citizen === 'no' ? 'No' : 'Not answered'}
                        </p>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-700 mb-2">Do you/family work for law firm, insurance, or claims company?</p>
                        <p className={`font-semibold ${criteria.work1 === 'no' ? 'text-green-600' : 'text-yellow-600'}`}>
                          {criteria.work1 === 'yes' ? 'Yes' : criteria.work1 === 'no' ? 'No' : 'Not answered'}
                        </p>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-700 mb-2">Worked for law firm, insurance, or claims in past year?</p>
                        <p className={`font-semibold ${criteria.work2 === 'no' ? 'text-green-600' : 'text-yellow-600'}`}>
                          {criteria.work2 === 'yes' ? 'Yes' : criteria.work2 === 'no' ? 'No' : 'Not answered'}
                        </p>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-700 mb-2">Convicted of felony?</p>
                        <p className={`font-semibold ${criteria.felony === 'no' ? 'text-green-600' : 'text-yellow-600'}`}>
                          {criteria.felony === 'yes' ? 'Yes' : criteria.felony === 'no' ? 'No' : 'Not answered'}
                        </p>
                      </div>
                      
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-700 mb-2">Currently under indictment?</p>
                        <p className={`font-semibold ${criteria.indictment === 'no' ? 'text-green-600' : 'text-red-600'}`}>
                          {criteria.indictment === 'yes' ? 'Yes' : criteria.indictment === 'no' ? 'No' : 'Not answered'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Eligibility Summary */}
                    <div className="mt-6 p-4 rounded-lg border-2" style={{ 
                      backgroundColor: (criteria.age === 'yes' && criteria.citizen === 'yes' && criteria.indictment !== 'yes') ? '#f0fdf4' : '#fef2f2',
                      borderColor: (criteria.age === 'yes' && criteria.citizen === 'yes' && criteria.indictment !== 'yes') ? '#16a34a' : '#dc2626'
                    }}>
                      <p className="font-semibold text-lg mb-2">Eligibility Status</p>
                      <p className={`font-medium ${(criteria.age === 'yes' && criteria.citizen === 'yes' && criteria.indictment !== 'yes') ? 'text-green-700' : 'text-red-700'}`}>
                        {(criteria.age === 'yes' && criteria.citizen === 'yes' && criteria.indictment !== 'yes') 
                          ? '✓ Meets basic eligibility requirements' 
                          : '✗ Does not meet basic eligibility requirements'}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold" style={{ color: BLUE }}>
                Decline {declineTarget?.type === 'attorney' ? 'Attorney' : 'Juror'}
              </h3>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for declining (optional):
                </label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Provide a reason for declining this application..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeclineModal(false);
                    setDeclineReason("");
                    setDeclineTarget(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDecline}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}