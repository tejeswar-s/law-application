"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, AlertCircle, CheckCircle2, MessageSquare } from "lucide-react";

const BLUE = "#0A2342";
const BG = "#FAF9F6";
const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '')
  : "http://localhost:4000";

type RescheduleRequest = {
  RequestId: number;
  CaseId: number;
  CaseTitle: string;
  OriginalDate: string;
  OriginalTime: string;
  RejectionReason: string;
  AdminComments: string;
  SuggestedSlots: string; // JSON string
  AttorneyResponse: string;
  CreatedAt: string;
};

type TimeSlot = {
  date: string;
  time: string;
};

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

export default function RescheduleRequestsPage() {
  const [requests, setRequests] = useState<RescheduleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RescheduleRequest | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [message, setMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  useEffect(() => {
    fetchRescheduleRequests();
  }, []);

  const fetchRescheduleRequests = async () => {
    try {
      const token = getCookie("token");
      const response = await fetch(`${API_BASE}/api/attorney/reschedule-requests`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.rescheduleRequests || []);
      }
    } catch (error) {
      console.error("Error fetching reschedule requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptSlot = async (requestId: number, slot: TimeSlot) => {
    setActionLoading(true);
    try {
      const token = getCookie("token");
      const response = await fetch(
        `${API_BASE}/api/attorney/reschedule-requests/${requestId}/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ selectedSlot: slot })
        }
      );

      if (response.ok) {
        alert("Time slot accepted successfully! Your case has been approved.");
        fetchRescheduleRequests();
        setSelectedRequest(null);
        setSelectedSlot(null);
      } else {
        const error = await response.json();
        alert(`Failed to accept slot: ${error.message}`);
      }
    } catch (error) {
      console.error("Error accepting slot:", error);
      alert("Failed to accept time slot");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestDifferent = async (requestId: number) => {
    if (!message.trim()) {
      alert("Please provide a message explaining your preferred times");
      return;
    }

    setActionLoading(true);
    try {
      const token = getCookie("token");
      const response = await fetch(
        `${API_BASE}/api/attorney/reschedule-requests/${requestId}/request-different`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ message })
        }
      );

      if (response.ok) {
        alert("Your request has been sent to the admin");
        setShowMessageModal(false);
        setMessage("");
        fetchRescheduleRequests();
      } else {
        const error = await response.json();
        alert(`Failed to send request: ${error.message}`);
      }
    } catch (error) {
      console.error("Error requesting different slots:", error);
      alert("Failed to send request");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5); // Get HH:MM
  };

  if (loading) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: BG }}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: BLUE }}></div>
          <p className="text-lg font-medium" style={{ color: BLUE }}>Loading reschedule requests...</p>
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
              <h1 className="text-3xl font-bold" style={{ color: BLUE }}>Reschedule Requests</h1>
              <p className="text-gray-600 mt-1">Review and respond to case reschedule requests from admin</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {requests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Pending Reschedule Requests</h2>
            <p className="text-gray-600">All your cases are scheduled and approved!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => {
              const suggestedSlots: TimeSlot[] = JSON.parse(request.SuggestedSlots || "[]");
              const isExpanded = selectedRequest?.RequestId === request.RequestId;

              return (
                <div 
                  key={request.RequestId} 
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Request Header */}
                  <div className="p-6 border-b border-gray-200 bg-yellow-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <AlertCircle className="h-6 w-6 text-yellow-600" />
                          <h3 className="text-xl font-semibold text-gray-900">{request.CaseTitle}</h3>
                          <span className="px-3 py-1 bg-yellow-200 text-yellow-800 text-sm font-medium rounded-full">
                            Needs Rescheduling
                          </span>
                        </div>
                        <div className="ml-9 space-y-1 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">Original Schedule:</span>
                            <span>{formatDate(request.OriginalDate)} at {formatTime(request.OriginalTime)}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 mt-0.5" />
                            <div>
                              <span className="font-medium">Admin's Note:</span>
                              <p className="text-gray-600">{request.AdminComments || "No additional comments"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedRequest(isExpanded ? null : request)}
                        className="px-4 py-2 rounded-lg font-medium transition-colors"
                        style={{ 
                          backgroundColor: isExpanded ? BG : BLUE,
                          color: isExpanded ? BLUE : "white"
                        }}
                      >
                        {isExpanded ? "Collapse" : "View Options"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Select an Alternative Time Slot
                      </h4>
                      
                      {suggestedSlots.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>No suggested slots available. Please request different times.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          {suggestedSlots.map((slot, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedSlot(slot)}
                              className={`p-4 border-2 rounded-lg text-left transition-all ${
                                selectedSlot?.date === slot.date && selectedSlot?.time === slot.time
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="h-5 w-5 text-blue-600" />
                                <span className="font-medium text-gray-900">
                                  {formatDate(slot.date)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 ml-7">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-700">{formatTime(slot.time)}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => selectedSlot && handleAcceptSlot(request.RequestId, selectedSlot)}
                          disabled={!selectedSlot || actionLoading}
                          className="flex-1 py-3 px-6 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
                        >
                          {actionLoading ? (
                            <>
                              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-5 w-5" />
                              Accept Selected Slot
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setShowMessageModal(true)}
                          disabled={actionLoading}
                          className="flex-1 py-3 px-6 border-2 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                          style={{ borderColor: BLUE, color: BLUE }}
                        >
                          Request Different Times
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Message Modal */}
      {showMessageModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <MessageSquare className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Request Different Times</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Explain your preferred times or availability to the admin.
            </p>
            <textarea 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" 
              rows={5} 
              placeholder="Example: I'm available on weekdays after 2 PM, or any time on Fridays..." 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
            />
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setShowMessageModal(false);
                  setMessage("");
                }} 
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleRequestDifferent(selectedRequest.RequestId)} 
                disabled={actionLoading || !message.trim()}
                className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 inline-flex items-center gap-2"
                style={{ backgroundColor: BLUE }}
              >
                {actionLoading ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Sending...
                  </>
                ) : (
                  "Send Request"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}