"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, HelpCircle, X, ArrowLeft } from "lucide-react";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

type Attorney = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  lawFirmName: string;
  phoneNumber?: string;
  verified?: boolean;
  verificationStatus?: string;
};

interface AttorneyProfileSectionProps {
  onBack: () => void;
}

export default function AttorneyProfileSection({ onBack }: AttorneyProfileSectionProps) {
  const [attorney, setAttorney] = useState<Attorney | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editData, setEditData] = useState({ firstName: "", lastName: "", email: "", phoneNumber: "" });
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchAttorney = async () => {
      setLoading(true);
      setError(null);
      try {
        let token = null;
        if (typeof document !== "undefined") {
          const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
          token = match ? decodeURIComponent(match[1]) : null;
        }
        const res = await fetch(`${API_BASE}/api/attorney/profile`, {
          method: "GET",
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
          },
        });
        const data = await res.json();
        if (data.success) {
          const attorneyData = {
            ...data.attorney,
            phoneNumber: data.attorney.phoneNumber || data.attorney.PhoneNumber || "",
          };
          setAttorney(attorneyData);
        } else {
          setAttorney(null);
          setError("Failed to fetch attorney details");
        }
      } catch (err) {
        setAttorney(null);
        setError("Failed to fetch attorney details");
      } finally {
        setLoading(false);
      }
    };
    fetchAttorney();
  }, []);

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  }

  async function handleEditProfile(e: React.FormEvent) {
    e.preventDefault();
    setUpdating(true);
    try {
      let token = null;
      if (typeof document !== "undefined") {
        const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
        token = match ? decodeURIComponent(match[1]) : null;
      }

      const res = await fetch(`${API_BASE}/api/attorney/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          firstName: editData.firstName,
          lastName: editData.lastName,
          phoneNumber: editData.phoneNumber,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.attorney) {
          setAttorney(data.attorney);
        } else {
          setAttorney(j => j ? { ...j, firstName: editData.firstName, lastName: editData.lastName, phoneNumber: editData.phoneNumber } : j);
        }
        setShowEdit(false);
      } else {
        alert(data.message || "Failed to update profile");
      }
    } catch (err) {
      alert("Failed to update profile");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      let token = null;
      if (typeof document !== "undefined") {
        const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
        token = match ? decodeURIComponent(match[1]) : null;
      }

      const res = await fetch(`${API_BASE}/api/attorney/profile`, {
        method: "DELETE",
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = "/login";
      } else {
        alert(data.message || "Failed to delete account");
      }
    } catch (err) {
      alert("Failed to delete account");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[60vh]">
          <div className="animate-spin rounded-full h-20 w-20 border-t-8 border-b-8 border-[#16305B] mb-6" />
          <span className="text-lg text-[#16305B] font-semibold">Loading profile...</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="text-center">
          <div className="text-red-600 text-xl font-semibold mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#16305B] text-white rounded hover:bg-[#1e417a]"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-screen overflow-y-auto p-0">
      <div className="p-8 md:p-10 bg-[#F7F6F3] min-h-screen w-full">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-[#16305B] hover:text-[#1e417a] transition-colors"
              aria-label="Go back to home"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-[#16305B]">Profile</h1>
          </div>
          <button className="text-gray-500 text-sm flex items-center gap-1 hover:underline" style={{ marginRight: 8 }}>
            <HelpCircle size={16} className="inline-block align-middle" />
            <span className="inline-block align-middle">Help</span>
          </button>
        </div>

        {/* Main content grid */}
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-7xl mx-auto">
          {/* My Info */}
          <div className="flex flex-col gap-8 md:w-[55%] w-full">
            <div className="bg-white rounded shadow p-10 w-full" style={{ minHeight: 340, maxWidth: 480, marginLeft: 8, color: "black" }}>
              <h2 className="font-semibold text-lg mb-6" style={{ color: "black" }}>My Info</h2>
              <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-[15px] font-medium mb-2 text-[#222]">First Name</label>
                  <input
                    type="text"
                    value={attorney?.firstName || ""}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-4 py-2 bg-[#F7F7F7] text-[15px] text-black focus:outline-none focus:ring-2 focus:ring-[#16305B] transition"
                  />
                </div>
                <div>
                  <label className="block text-[15px] font-medium mb-2 text-[#222]">Last Name</label>
                  <input
                    type="text"
                    value={attorney?.lastName || ""}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-4 py-2 bg-[#F7F7F7] text-[15px] text-black focus:outline-none focus:ring-2 focus:ring-[#16305B] transition"
                  />
                </div>
                <div>
                  <label className="block text-[15px] font-medium mb-2 text-[#222]">Email Address</label>
                  <input
                    type="email"
                    value={attorney?.email || ""}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-4 py-2 bg-[#F7F7F7] text-[15px] text-black focus:outline-none focus:ring-2 focus:ring-[#16305B] transition"
                  />
                </div>
                <div>
                  <label className="block text-[15px] font-medium mb-2 text-[#222]">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={"************"}
                      disabled
                      className="w-full border border-gray-300 rounded-md px-4 py-2 bg-[#F7F7F7] text-[15px] pr-10 text-black focus:outline-none focus:ring-2 focus:ring-[#16305B] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[15px] font-medium mb-2 text-[#222]">Phone Number</label>
                  <input
                    type="text"
                    value={attorney?.phoneNumber || ""}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-4 py-2 bg-[#F7F7F7] text-[15px] text-black focus:outline-none focus:ring-2 focus:ring-[#16305B] transition"
                  />
                </div>
                <button
                  type="button"
                  className="mt-2 px-5 py-2 bg-[#16305B] text-white rounded-md hover:bg-[#1e417a] text-[15px] font-medium shadow-sm transition"
                  style={{ width: 130 }}
                  onClick={() => {
                    setEditData({
                      firstName: attorney?.firstName || "",
                      lastName: attorney?.lastName || "",
                      email: attorney?.email || "",
                      phoneNumber: attorney?.phoneNumber || ""
                    });
                    setShowEdit(true);
                  }}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* Manage Account */}
          <div className="flex flex-col gap-6 md:w-[45%] w-full">
            <div className="bg-white rounded shadow p-8 w-full" style={{ minHeight: 120, maxWidth: 420, color: "black" }}>
              <h2 className="font-semibold text-lg mb-4" style={{ color: "black" }}>Manage Account</h2>
              <button
                className="w-full border border-gray-400 rounded py-2 hover:bg-gray-100 transition-colors text-[15px] font-medium text-black"
                onClick={() => setShowDelete(true)}
              >
                Delete Account
              </button>
            </div>
          </div>

          {/* Spacer for 20% width on the right */}
          <div className="hidden md:block md:w-[20%]" />
        </div>

        {/* Edit Profile Modal */}
        {showEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
            <div
              className="absolute inset-0 bg-black/10"
              onClick={() => !updating && setShowEdit(false)}
            ></div>
            <div className="relative bg-white rounded-lg shadow-2xl p-8 w-full max-w-md border-4" style={{ borderColor: '#16305B' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: '#16305B' }}>Edit Profile</h2>
                <button
                  onClick={() => !updating && setShowEdit(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={updating}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-800 font-medium mb-1">First Name</label>
                  <input
                    name="firstName"
                    type="text"
                    value={editData.firstName}
                    onChange={handleEditChange}
                    className="w-full border text-gray-800 rounded px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-800 font-medium mb-1">Last Name</label>
                  <input
                    name="lastName"
                    type="text"
                    value={editData.lastName}
                    onChange={handleEditChange}
                    className="w-full border rounded px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-800 font-medium mb-1">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    value={editData.email}
                    disabled
                    className="w-full border rounded px-3 py-2 bg-gray-100 text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-800 font-medium mb-1">Phone Number</label>
                  <input
                    name="phoneNumber"
                    type="text"
                    value={editData.phoneNumber}
                    onChange={handleEditChange}
                    className="w-full border rounded px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={handleEditProfile}
                    className="px-4 py-2 bg-[#16305B] text-white rounded hover:bg-[#1e417a] min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={updating}
                  >
                    {updating ? "Updating..." : "Update"}
                  </button>
                  <button
                    onClick={() => setShowEdit(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                    disabled={updating}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
            <div
              className="absolute inset-0 bg-black/10"
              onClick={() => !deleting && setShowDelete(false)}
            ></div>
            <div className="relative bg-white rounded-xl shadow-xl p-7 w-full max-w-lg" style={{ minWidth: 380, maxWidth: 440, color: "black" }}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold" style={{ color: "black" }}>Delete Account</h2>
                <button
                  className="text-gray-500 text-xl hover:text-gray-700"
                  onClick={() => !deleting && setShowDelete(false)}
                  disabled={deleting}
                  aria-label="Close"
                >
                  <X size={22} />
                </button>
              </div>
              <div className="mb-6 mt-1 text-[15px]" style={{ color: "black" }}>Are you sure you want to delete your account?</div>
              <div className="flex gap-2 justify-end">
                <button
                  className="px-6 py-2 bg-[#B3261E] text-white rounded shadow-sm font-medium text-[16px] hover:bg-[#a11d17] focus:outline-none focus:ring-2 focus:ring-red-400 border border-[#B3261E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
                <button
                  className="px-6 py-2 bg-white text-[#222] rounded shadow-sm font-medium text-[16px] border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                  onClick={() => setShowDelete(false)}
                  disabled={deleting}
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}