"use client";
import { useEffect, useState, useRef } from "react";
import { Users, UserCheck, Calendar, FileText, AlertCircle, CheckCircle2, Clock, Building2, XCircle, Video, Timer } from "lucide-react";

const BLUE = "#0A2342";
const BG = "#FAF9F6";
const LIGHT_BLUE = "#e6ecf5";
const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
  : "http://localhost:4000";

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
  VerificationStatus?: string;
  CriteriaResponses?: { question: string; answer: string }[];
};

type PendingCase = {
  CaseId: number;
  CaseTitle: string;
  AttorneyName: string;
  LawFirmName: string;
  ScheduledDate: string;
  ScheduledTime: string;
  County: string;
  CaseType: string;
};

type TimeSlot = {
  date: string;
  time: string;
};

export default function AdminDashboard() {
  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  const [jurors, setJurors] = useState<Juror[]>([]);
  const [pendingCases, setPendingCases] = useState<PendingCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAttorneys: 0,
    verifiedAttorneys: 0,
    totalJurors: 0,
    verifiedJurors: 0,
    pendingCases: 0,
  });

  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineType, setDeclineType] = useState<"attorney" | "juror">("attorney");
  const [declineId, setDeclineId] = useState<number | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showCriteriaPopup, setShowCriteriaPopup] = useState(false);
  const [currentCriteriaResponses, setCurrentCriteriaResponses] = useState<{ question: string; answer: string }[]>([]);
  const [attorneyFilter, setAttorneyFilter] = useState<"all" | "verified" | "not_verified" | "declined">("all");
  const [jurorFilter, setJurorFilter] = useState<"all" | "verified" | "not_verified" | "declined">("all");
  const [attorneyPage, setAttorneyPage] = useState(1);
  const [jurorPage, setJurorPage] = useState(1);
  const PAGE_SIZE = 5;

  // Active trials monitoring states
  const [todaysTrials, setTodaysTrials] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Case rejection states
  const [showCaseRejectModal, setShowCaseRejectModal] = useState(false);
  const [rejectCaseId, setRejectCaseId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectComments, setRejectComments] = useState("");
  const [suggestedSlots, setSuggestedSlots] = useState<TimeSlot[]>([
    { date: "", time: "" },
    { date: "", time: "" },
    { date: "", time: "" }
  ]);
  const [caseActionLoading, setCaseActionLoading] = useState<number | null>(null);

  const attorneySectionRef = useRef<HTMLDivElement>(null);
  const jurorSectionRef = useRef<HTMLDivElement>(null);
  const casesSectionRef = useRef<HTMLDivElement>(null);

  const REJECTION_REASONS = [
    { value: "scheduling_conflict", label: "🔄 Scheduling Conflict - I'm unavailable at this time" },
    { value: "invalid_case_details", label: "📋 Invalid Case Details - Information incomplete/inappropriate" },
    { value: "missing_documentation", label: "📄 Missing Documentation - Required documents not provided" },
    { value: "jurisdictional_issues", label: "⚖️ Jurisdictional Issues - Case outside platform scope" },
    { value: "duplicate_submission", label: "🔁 Duplicate Submission - Case already exists" },
    { value: "insufficient_lead_time", label: "⏰ Insufficient Lead Time - Trial date too soon" },
    { value: "other", label: "✏️ Other - Specify in comments" }
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch today's trials
  useEffect(() => {
    const fetchTodaysTrials = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/trial/admin/trials/today`);
        const data = await response.json();
        if (data.success) {
          setTodaysTrials(data.trials);
        }
      } catch (error) {
        console.error('Error fetching today\'s trials:', error);
      }
    };

    fetchTodaysTrials();
    const interval = setInterval(fetchTodaysTrials, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Timer for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate trial status
  const getTrialStatus = (scheduledDate: string, scheduledTime: string) => {
    const trialDateTime = new Date(`${scheduledDate.split('T')[0]}T${scheduledTime}`);
    const now = currentTime;
    const diffMs = trialDateTime.getTime() - now.getTime();
    const endTime = new Date(trialDateTime.getTime() + 150 * 60 * 1000); // 150 minutes later

    if (now >= endTime) {
      return { status: 'ended', canJoin: false, timeText: 'Trial Ended' };
    }

    if (diffMs <= 0) {
      const minutesSinceStart = Math.floor((now.getTime() - trialDateTime.getTime()) / 60000);
      return { 
        status: 'active', 
        canJoin: true, 
        timeText: `In Progress (${minutesSinceStart} min)` 
      };
    }

    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);

    return {
      status: 'upcoming',
      canJoin: false,
      timeText: `Starts in ${hours}h ${minutes}m ${seconds}s`
    };
  };

  // Handle admin joining trial
  const handleAdminJoinTrial = async (caseId: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/trial/admin-join/${caseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        window.open(`/admin/trial/${caseId}`, '_blank');
      } else {
        alert('Failed to join trial');
      }
    } catch (error) {
      console.error('Error joining trial:', error);
      alert('Failed to join trial');
    }
  };

  // Filter active trials (not ended)
  const activeTrials = todaysTrials.filter(trial => {
    const status = getTrialStatus(trial.ScheduledDate, trial.ScheduledTime);
    return status.status !== 'ended';
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, attRes, jurRes, casesRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/dashboard`),
        fetch(`${API_BASE}/api/admin/attorneys`),
        fetch(`${API_BASE}/api/admin/jurors`),
        fetch(`${API_BASE}/api/admin/cases/pending`),
      ]);

      const dashboardData = await dashboardRes.json();
      const attData = await attRes.json();
      const jurData = await jurRes.json();
      const casesData = await casesRes.json();

      if (dashboardData.success) {
        setStats(dashboardData.stats);
        setPendingCases(dashboardData.pendingCases || []);
      }

      const attorneysList = Array.isArray(attData.attorneys) 
        ? attData.attorneys 
        : (Array.isArray(attData) ? attData : []);

      setAttorneys(attorneysList);

      const jurorsList = Array.isArray(jurData.jurors) 
        ? jurData.jurors 
        : (Array.isArray(jurData) ? jurData : []);

      setJurors(jurorsList.map((j: any) => ({
        JurorId: j.JurorId ?? j.id,
        Name: j.Name ?? j.name,
        Email: j.Email ?? j.email,
        County: j.County ?? j.county,
        State: j.State ?? j.state,
        IsVerified: j.IsVerified ?? j.verified,
        IsActive: j.IsActive ?? j.isActive,
        OnboardingCompleted: j.OnboardingCompleted ?? j.onboardingCompleted,
        CreatedAt: j.CreatedAt ?? j.createdAt,
        VerificationStatus: j.VerificationStatus,
        CriteriaResponses: j.CriteriaResponses ?? j.criteriaResponses ?? [],
      })));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCase = async (caseId: number) => {
    setCaseActionLoading(caseId);
    try {
      const response = await fetch(`${API_BASE}/api/admin/cases/${caseId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          decision: "approved",
          comments: "Case approved by admin"
        }),
      });

      if (response.ok) {
        setPendingCases(prev => prev.filter(c => c.CaseId !== caseId));
        fetchDashboardData();
        alert("Case approved successfully!");
      } else {
        const error = await response.json();
        alert(`Failed to approve case: ${error.message}`);
      }
    } catch (error) {
      console.error("Error approving case:", error);
      alert("Failed to approve case");
    } finally {
      setCaseActionLoading(null);
    }
  };

  const handleRejectCase = (caseId: number) => {
    setRejectCaseId(caseId);
    setRejectionReason("");
    setRejectComments("");
    setSuggestedSlots([
      { date: "", time: "" },
      { date: "", time: "" },
      { date: "", time: "" }
    ]);
    setShowCaseRejectModal(true);
  };

  const confirmRejectCase = async () => {
    if (!rejectCaseId || !rejectionReason) return;
    
    if (rejectionReason === "scheduling_conflict") {
      const validSlots = suggestedSlots.filter(slot => slot.date && slot.time);
      if (validSlots.length === 0) {
        alert("Please provide at least one alternative time slot");
        return;
      }
    }

    if (rejectionReason === "other" && !rejectComments.trim()) {
      alert("Please provide comments for 'Other' rejection reason");
      return;
    }

    setCaseActionLoading(rejectCaseId);
    try {
      const validSlots = suggestedSlots.filter(slot => slot.date && slot.time);
      
      const response = await fetch(`${API_BASE}/api/admin/cases/${rejectCaseId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          decision: "rejected",
          rejectionReason,
          comments: rejectComments || "",
          suggestedSlots: rejectionReason === "scheduling_conflict" ? validSlots : []
        }),
      });

      if (response.ok) {
        setPendingCases(prev => prev.filter(c => c.CaseId !== rejectCaseId));
        setShowCaseRejectModal(false);
        setRejectCaseId(null);
        setRejectionReason("");
        setRejectComments("");
        fetchDashboardData();
        alert("Case rejected successfully!");
      } else {
        const error = await response.json();
        alert(`Failed to reject case: ${error.message}`);
      }
    } catch (error) {
      console.error("Error rejecting case:", error);
      alert("Failed to reject case");
    } finally {
      setCaseActionLoading(null);
    }
  };

  const handleVerifyAttorney = async (attorneyId: number) => {
    setActionLoading(attorneyId);
    try {
      const response = await fetch(`${API_BASE}/api/admin/attorneys/${attorneyId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "verified" }),
      });
      if (response.ok) {
        setAttorneys((prev) =>
          prev.map((a) => a.AttorneyId === attorneyId ? { ...a, VerificationStatus: "verified", IsVerified: true } : a)
        );
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error verifying attorney:", error);
      alert("Failed to verify attorney");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineAttorney = (attorneyId: number) => {
    setDeclineType("attorney");
    setDeclineId(attorneyId);
    setDeclineReason("");
    setShowDeclineModal(true);
  };

  const handleVerifyJuror = async (jurorId: number) => {
    setActionLoading(jurorId);
    try {
      const response = await fetch(`${API_BASE}/api/admin/jurors/${jurorId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "verified" }),
      });
      if (response.ok) {
        setJurors((prev) =>
          prev.map((j) => j.JurorId === jurorId ? { ...j, VerificationStatus: "verified", IsVerified: true } : j)
        );
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error verifying juror:", error);
      alert("Failed to verify juror");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineJuror = (jurorId: number) => {
    setDeclineType("juror");
    setDeclineId(jurorId);
    setDeclineReason("");
    setShowDeclineModal(true);
  };

  const confirmDecline = async () => {
    if (!declineId) return;
    setActionLoading(declineId);
    try {
      const endpoint = declineType === "attorney"
        ? `${API_BASE}/api/admin/attorneys/${declineId}/verify`
        : `${API_BASE}/api/admin/jurors/${declineId}/verify`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "declined", comments: declineReason || "No reason provided" }),
      });
      if (response.ok) {
        if (declineType === "attorney") {
          setAttorneys((prev) =>
            prev.map((a) => a.AttorneyId === declineId ? { ...a, VerificationStatus: "declined", IsVerified: false } : a)
          );
        } else {
          setJurors((prev) =>
            prev.map((j) => j.JurorId === declineId ? { ...j, VerificationStatus: "declined", IsVerified: false } : j)
          );
        }
        setShowDeclineModal(false);
        fetchDashboardData();
      }
    } catch (error) {
      console.error(`Error declining ${declineType}:`, error);
      alert(`Failed to decline ${declineType}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAttorneys = attorneys.filter((a) => {
    if (attorneyFilter === "verified") return a.IsVerified;
    if (attorneyFilter === "not_verified") return !a.IsVerified && a.VerificationStatus !== "declined";
    if (attorneyFilter === "declined") return a.VerificationStatus === "declined";
    return true;
  });
  const paginatedAttorneys = filteredAttorneys.slice((attorneyPage - 1) * PAGE_SIZE, attorneyPage * PAGE_SIZE);

  const filteredJurors = jurors.filter((j) => {
    if (jurorFilter === "verified") return j.IsVerified;
    if (jurorFilter === "not_verified") return !j.IsVerified && j.VerificationStatus !== "declined";
    if (jurorFilter === "declined") return j.VerificationStatus === "declined";
    return true;
  });
  const paginatedJurors = filteredJurors.slice((jurorPage - 1) * PAGE_SIZE, jurorPage * PAGE_SIZE);

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
              <h1 className="text-3xl font-bold" style={{ color: BLUE }}>Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage attorneys, jurors, and system operations</p>
            </div>
            <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Cases</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingCases}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Trials Section - NEW */}
        {activeTrials.length > 0 && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-sm p-6 border-2 border-purple-200">
            <div className="flex items-center mb-4">
              <Video className="h-6 w-6 mr-3 text-purple-600" />
              <h2 className="text-xl font-semibold text-purple-900">Active Trials - Join to Monitor</h2>
              <span className="ml-3 px-3 py-1 bg-purple-600 text-white text-sm font-medium rounded-full">
                {activeTrials.length} Today
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTrials.map((trial) => {
                const trialStatus = getTrialStatus(trial.ScheduledDate, trial.ScheduledTime);
                
                return (
                  <div 
                    key={trial.CaseId} 
                    className="bg-white rounded-lg shadow-md border-2 border-purple-100 p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-sm mb-1">{trial.CaseTitle}</h3>
                        <p className="text-xs text-gray-600">Case #{trial.CaseId}</p>
                      </div>
                      {trialStatus.status === 'active' && (
                        <span className="flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          <span className="animate-pulse w-2 h-2 bg-green-600 rounded-full mr-1"></span>
                          Live
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center text-xs text-gray-600">
                        <Building2 className="h-3 w-3 mr-2" />
                        {trial.AttorneyName} - {trial.LawFirmName}
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        <Calendar className="h-3 w-3 mr-2" />
                        {new Date(trial.ScheduledDate).toLocaleDateString()} at {trial.ScheduledTime}
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        <FileText className="h-3 w-3 mr-2" />
                        {trial.CaseType} - {trial.County}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="flex items-center text-xs font-medium">
                        <Timer className="h-3 w-3 mr-1" style={{ color: trialStatus.canJoin ? '#10b981' : '#f59e0b' }} />
                        <span style={{ color: trialStatus.canJoin ? '#10b981' : '#f59e0b' }}>
                          {trialStatus.timeText}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handleAdminJoinTrial(trial.CaseId)}
                        disabled={!trialStatus.canJoin}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          trialStatus.canJoin
                            ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {trialStatus.canJoin ? 'Join Trial' : 'Not Started'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions and Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-semibold mb-4" style={{ color: BLUE }}>Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full bg-white rounded-lg p-4 text-left font-medium hover:shadow-md transition-all border border-gray-200 group" onClick={() => attorneySectionRef.current?.scrollIntoView({ behavior: "smooth" })}>
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  <span className="ml-3 text-gray-900 group-hover:text-blue-600">Attorneys Excel Sheet</span>
                </div>
              </button>
              <button className="w-full bg-white rounded-lg p-4 text-left font-medium hover:shadow-md transition-all border border-gray-200 group" onClick={() => jurorSectionRef.current?.scrollIntoView({ behavior: "smooth" })}>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  <span className="ml-3 text-gray-900 group-hover:text-blue-600">Jurors Excel Sheet</span>
                </div>
              </button>
              <button className="w-full bg-white rounded-lg p-4 text-left font-medium hover:shadow-md transition-all border border-gray-200 group" onClick={() => casesSectionRef.current?.scrollIntoView({ behavior: "smooth" })}>
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

          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <Calendar className="h-6 w-6 mr-3" style={{ color: BLUE }} />
              <h2 className="text-xl font-semibold" style={{ color: BLUE }}>Interactive Calendar</h2>
            </div>
            <div className="flex flex-col items-center justify-center min-h-[300px] bg-gray-50 rounded-lg">
              <Calendar className="h-16 w-16 text-gray-400 mb-4" />
              <div className="text-lg font-semibold text-gray-600 mb-2">Calendar Component</div>
              <div className="text-sm text-gray-500 text-center">
                Cases identified by Case No.<br />Integration pending
              </div>
            </div>
          </div>
        </div>

        {/* Pending Cases */}
        <div ref={casesSectionRef} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center mb-4">
            <FileText className="h-6 w-6 mr-3" style={{ color: BLUE }} />
            <h3 className="text-xl font-semibold" style={{ color: BLUE }}>Pending Cases Requiring Approval</h3>
            <span className="ml-3 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">{pendingCases.length} pending</span>
          </div>
          {pendingCases.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="font-medium">No cases pending approval</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingCases.map((caseItem) => (
                <div key={caseItem.CaseId} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-blue-900 text-lg">{caseItem.CaseTitle}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Attorney:</span> {caseItem.AttorneyName} ({caseItem.LawFirmName})
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Location:</span> {caseItem.County} | {caseItem.CaseType}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Scheduled:</span> {new Date(caseItem.ScheduledDate).toLocaleDateString()} at {caseItem.ScheduledTime}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button 
                        onClick={() => handleApproveCase(caseItem.CaseId)}
                        disabled={caseActionLoading === caseItem.CaseId}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50 inline-flex items-center"
                      >
                        {caseActionLoading === caseItem.CaseId ? (
                          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </>
                        )}
                      </button>
                      <button 
                        onClick={() => handleRejectCase(caseItem.CaseId)}
                        disabled={caseActionLoading === caseItem.CaseId}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50 inline-flex items-center"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
                <select className="border rounded px-2 py-1 text-sm text-black bg-white" value={attorneyFilter} onChange={(e) => { setAttorneyFilter(e.target.value as any); setAttorneyPage(1); }}>
                  <option value="all">All</option>
                  <option value="verified">Verified</option>
                  <option value="not_verified">Not Verified</option>
                  <option value="declined">Declined</option>
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Attorney Info</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Law Firm</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Bar Number</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedAttorneys.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No attorneys found</p>
                    </td>
                  </tr>
                ) : (
                  paginatedAttorneys.map((attorney) => (
                    <tr key={attorney.AttorneyId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{attorney.FirstName} {attorney.LastName}</div>
                        <div className="text-sm text-gray-600">{attorney.Email}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{attorney.LawFirmName}</td>
                      <td className="px-6 py-4 text-gray-900">{attorney.State}</td>
                      <td className="px-6 py-4 text-gray-900 font-mono text-sm">{attorney.StateBarNumber}</td>
                      <td className="px-6 py-4">
                        {attorney.VerificationStatus === "declined" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />Declined
                          </span>
                        ) : attorney.IsVerified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="h-3 w-3 mr-1" />Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(attorney.CreatedAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        {!attorney.IsVerified && attorney.VerificationStatus !== "declined" && (
                          <div className="flex justify-center space-x-2">
                            <button onClick={() => handleVerifyAttorney(attorney.AttorneyId)} disabled={actionLoading === attorney.AttorneyId} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-white hover:shadow-md disabled:opacity-50" style={{ backgroundColor: BLUE }}>
                              {actionLoading === attorney.AttorneyId ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : <><CheckCircle2 className="h-4 w-4 mr-1" />Verify</>}
                            </button>
                            <button onClick={() => handleDeclineAttorney(attorney.AttorneyId)} disabled={actionLoading === attorney.AttorneyId} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">
                              <XCircle className="h-4 w-4 mr-1" />Decline
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
          <div className="flex justify-between items-center px-6 py-4 bg-gray-50">
            <button className="px-3 py-1 rounded bg-gray-200 text-black disabled:opacity-50" disabled={attorneyPage === 1} onClick={() => setAttorneyPage(attorneyPage - 1)}>Previous</button>
            <span className="text-sm text-black">Page {attorneyPage} of {Math.max(1, Math.ceil(filteredAttorneys.length / PAGE_SIZE))}</span>
            <button className="px-3 py-1 rounded bg-gray-200 text-black disabled:opacity-50" disabled={attorneyPage * PAGE_SIZE >= filteredAttorneys.length} onClick={() => setAttorneyPage(attorneyPage + 1)}>Next</button>
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
                <select className="border rounded px-2 py-1 text-sm text-black bg-white" value={jurorFilter} onChange={(e) => { setJurorFilter(e.target.value as any); setJurorPage(1); }}>
                  <option value="all">All</option>
                  <option value="verified">Verified</option>
                  <option value="not_verified">Not Verified</option>
                  <option value="declined">Declined</option>
                </select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Juror Info</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Verification</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Onboarding</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedJurors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No jurors found</p>
                    </td>
                  </tr>
                ) : (
                  paginatedJurors.map((juror) => (
                    <tr key={juror.JurorId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{juror.Name}</div>
                        <div className="text-sm text-gray-600">{juror.Email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{juror.County}</div>
                        <div className="text-sm text-gray-600">{juror.State}</div>
                      </td>
                      <td className="px-6 py-4">
                        {juror.VerificationStatus === "declined" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />Declined
                          </span>
                        ) : juror.IsVerified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="h-3 w-3 mr-1" />Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {juror.IsActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Inactive</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {juror.OnboardingCompleted ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Complete</span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Pending</span>
                          )}
                          {juror.CriteriaResponses && juror.CriteriaResponses.length > 0 && (
                            <button className="px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-blue-800 hover:bg-blue-100" onClick={() => { setCurrentCriteriaResponses(juror.CriteriaResponses!); setShowCriteriaPopup(true); }}>View</button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(juror.CreatedAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        {!juror.IsVerified && juror.VerificationStatus !== "declined" && (
                          <div className="flex justify-center space-x-2">
                            <button onClick={() => handleVerifyJuror(juror.JurorId)} disabled={actionLoading === juror.JurorId} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-white hover:shadow-md disabled:opacity-50" style={{ backgroundColor: BLUE }}>
                              {actionLoading === juror.JurorId ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : <><CheckCircle2 className="h-4 w-4 mr-1" />Verify</>}
                            </button>
                            <button onClick={() => handleDeclineJuror(juror.JurorId)} disabled={actionLoading === juror.JurorId} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">
                              <XCircle className="h-4 w-4 mr-1" />Decline
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
          <div className="flex justify-between items-center px-6 py-4 bg-gray-50">
            <button className="px-3 py-1 rounded bg-gray-200 text-black disabled:opacity-50" disabled={jurorPage === 1} onClick={() => setJurorPage(jurorPage - 1)}>Previous</button>
            <span className="text-sm text-black">Page {jurorPage} of {Math.max(1, Math.ceil(filteredJurors.length / PAGE_SIZE))}</span>
            <button className="px-3 py-1 rounded bg-gray-200 text-black disabled:opacity-50" disabled={jurorPage * PAGE_SIZE >= filteredJurors.length} onClick={() => setJurorPage(jurorPage + 1)}>Next</button>
          </div>
        </div>
      </div>

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <XCircle className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Decline {declineType === "attorney" ? "Attorney" : "Juror"}</h3>
            </div>
            <p className="text-gray-600 mb-4">Provide a reason for declining. This will be sent via email.</p>
            <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" rows={4} placeholder="Enter reason (optional)" value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} />
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowDeclineModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
              <button onClick={confirmDecline} disabled={actionLoading !== null} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium disabled:opacity-50 inline-flex items-center">
                {actionLoading ? <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>Declining...</> : "Confirm Decline"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Criteria Popup */}
      {showCriteriaPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[300px] max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-3 text-blue-900">Criteria Responses</h3>
            <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto">
              {currentCriteriaResponses.map((resp, idx) => (
                <div key={idx} className="text-sm text-gray-800 border-b pb-2">
                  <span className="font-semibold">{resp.question}:</span> {resp.answer}
                </div>
              ))}
              {currentCriteriaResponses.length === 0 && <div className="text-sm text-gray-400">No responses</div>}
            </div>
            <button className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700" onClick={() => setShowCriteriaPopup(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Case Rejection Modal */}
      {showCaseRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center mb-4">
              <XCircle className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Reject Case</h3>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason *</label>
              <select 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              >
                <option value="">Select a reason...</option>
                {REJECTION_REASONS.map(reason => (
                  <option key={reason.value} value={reason.value}>{reason.label}</option>
                ))}
              </select>
            </div>

            {rejectionReason === "scheduling_conflict" && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-900 mb-3">Suggest Alternative Time Slots (at least 1 required)</h4>
                <div className="space-y-3">
                  {suggestedSlots.map((slot, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="date"
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={slot.date}
                        onChange={(e) => {
                          const newSlots = [...suggestedSlots];
                          newSlots[idx].date = e.target.value;
                          setSuggestedSlots(newSlots);
                        }}
                      />
                      <input
                        type="time"
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={slot.time}
                        onChange={(e) => {
                          const newSlots = [...suggestedSlots];
                          newSlots[idx].time = e.target.value;
                          setSuggestedSlots(newSlots);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Comments {rejectionReason === "other" && <span className="text-red-600">*</span>}
              </label>
              <textarea 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500" 
                rows={4} 
                placeholder="Enter additional details..." 
                value={rejectComments} 
                onChange={(e) => setRejectComments(e.target.value)} 
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setShowCaseRejectModal(false);
                  setRejectCaseId(null);
                  setRejectionReason("");
                  setRejectComments("");
                }} 
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={confirmRejectCase} 
                disabled={caseActionLoading !== null || !rejectionReason}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium disabled:opacity-50 inline-flex items-center"
              >
                {caseActionLoading ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                    Rejecting...
                  </>
                ) : (
                  "Confirm Reject"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}