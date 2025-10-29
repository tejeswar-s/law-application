"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, HelpCircle, X } from "lucide-react";
import { SiVenmo, SiCashapp } from "react-icons/si";
import { FaPaypal } from "react-icons/fa";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";


type Juror = {
  id: string;
  name: string;
  email: string;
  county?: string;
  verified?: boolean;
  verificationStatus?: string;
  onboardingCompleted?: boolean;
  phone?: string;
};

export default function ProfileSection() {
  const [juror, setJuror] = useState<Juror | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editData, setEditData] = useState({ name: "", email: "", password: "", phone: "" });
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchJuror = async () => {
      setLoading(true);
      setError(null);
      try {
        let token = null;
        if (typeof document !== "undefined") {
          const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
          token = match ? decodeURIComponent(match[1]) : null;
        }
        const res = await fetch(`${API_BASE}/api/juror/profile`, {
          method: "GET",
          headers: {
            "Authorization": token ? `Bearer ${token}` : "",
          },
        });
        const data = await res.json();
        if (data.success) {
          setJuror(data.juror);
        } else {
          setJuror(null);
          setError("Failed to fetch juror details");
        }
      } catch (err) {
        setJuror(null);
        setError("Failed to fetch juror details");
      } finally {
        setLoading(false);
      }
    };
    fetchJuror();
  }, []);

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  }

  if (loading) {
    return (
      <main className="flex-1 min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[60vh]">
          <div className="animate-spin rounded-full h-20 w-20 border-t-8 border-b-8 border-[#0C2D57] mb-6" />
          <span className="text-lg text-[#0C2D57] font-semibold">Loading profile...</span>
        </div>
      </main>
    );
  }

  // If juror is null after loading, show empty fields

  async function handleEditProfile(e: React.FormEvent) {
    e.preventDefault();
    setUpdating(true);
    try {
      // Get token from cookies
      let token = null;
      if (typeof document !== "undefined") {
        const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
        token = match ? decodeURIComponent(match[1]) : null;
      }
      
      // Simulate API call for demo
      setTimeout(() => {
        if (juror) {
          setJuror({ ...juror, name: editData.name, phone: editData.phone });
        }
        setShowEdit(false);
        setUpdating(false);
      }, 1500);

        const res = await fetch(`${API_BASE}/api/juror/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          name: editData.name,
          email: editData.email,
          password: editData.password,
          phone: editData.phone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.juror) {
          setJuror(data.juror);
        } else {
          setJuror(j => j ? { ...j, name: editData.name, phone: editData.phone } : j);
        }
        setShowEdit(false);
      } else {
        alert(data.message || "Failed to update profile");
      }
    } catch (err) {
      alert("Failed to update profile");
      setUpdating(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      // Get token from cookies
      let token = null;
      if (typeof document !== "undefined") {
        const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
        token = match ? decodeURIComponent(match[1]) : null;
      }
      
      // Simulate API call for demo
      setTimeout(() => {
        alert("Account deleted successfully");
        // In real app: window.location.href = "/juror/login";
        setShowDelete(false);
        setDeleting(false);
      }, 1500);

      const res = await fetch(`${API_BASE}/api/juror/profile`, {
        method: "DELETE",
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = "/login/juror";
      } else {
        alert(data.message || "Failed to delete account");
      }
    } catch (err) {
      alert("Failed to delete account");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[60vh]">
          <div className="animate-spin rounded-full h-20 w-20 border-t-8 border-b-8 border-[#0C2D57] mb-6" />
          <span className="text-lg text-[#0C2D57] font-semibold">Loading profile...</span>
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
            className="px-4 py-2 bg-[#0C2D57] text-white rounded hover:bg-[#0a2342]"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-screen overflow-y-auto p-0">
      <div className="p-8 md:p-10 bg-[#FAF9F6] min-h-screen w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#0C2D57]">Profile</h1>
          <button className="text-gray-500 text-sm flex items-center gap-1 hover:underline" style={{ marginRight: 8 }}>
            <HelpCircle size={16} className="inline-block align-middle" />
            <span className="inline-block align-middle">Help</span>
          </button>
        </div>

        {/* Main content grid */}
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-7xl mx-auto">
          {/* My Info */}
          <div className="flex flex-col gap-8 md:w-[55%] w-full">
            {/* My Info section */}
            <div className="bg-white rounded shadow p-10 w-full" style={{ minHeight: 340, maxWidth: 480, marginLeft: 8, color: "black" }}>
              <h2 className="font-semibold text-lg mb-6" style={{ color: "black" }}>My Info</h2>
              <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-[15px] font-medium mb-2" style={{ color: "black" }}>Full Name</label>
                  <input
                    type="text"
                    value={juror?.name || ""}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-4 py-2 bg-[#F7F7F7] text-[15px] text-black focus:outline-none focus:ring-2 focus:ring-[#0C2D57] transition"
                  />
                </div>
                <div>
                  <label className="block text-[15px] font-medium mb-2" style={{ color: "black" }}>Email Address</label>
                  <input
                    type="email"
                    value={juror?.email || ""}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-4 py-2 bg-[#F7F7F7] text-[15px] text-black focus:outline-none focus:ring-2 focus:ring-[#0C2D57] transition"
                  />
                </div>
                <div>
                  <label className="block text-[15px] font-medium mb-2" style={{ color: "black" }}>Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={"************"}
                      disabled
                      className="w-full border border-gray-300 rounded-md px-4 py-2 bg-[#F7F7F7] text-[15px] pr-10 text-black focus:outline-none focus:ring-2 focus:ring-[#0C2D57] transition"
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
                  <label className="block text-[15px] font-medium mb-2" style={{ color: "black" }}>Phone Number</label>
                  <input
                    type="text"
                    value={juror?.phone || ""}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-4 py-2 bg-[#F7F7F7] text-[15px] text-black focus:outline-none focus:ring-2 focus:ring-[#0C2D57] transition"
                  />
                </div>
                <button
                  type="button"
                  className="mt-2 px-5 py-2 bg-[#0C2D57] text-white rounded-md hover:bg-[#0a2342] text-[15px] font-medium shadow-sm transition"
                  style={{ width: 130 }}
                  onClick={() => {
                    setEditData({
                      name: juror?.name || "",
                      email: juror?.email || "",
                      password: "",
                      phone: juror?.phone || ""
                    });
                    setShowEdit(true);
                  }}
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Connected Accounts */}
            {/* Connected Accounts section */}
            <div className="bg-white rounded shadow p-7 w-full mt-6" style={{ maxWidth: 480, marginLeft: 8, color: "black" }}>
              <h2 className="font-semibold text-lg mb-5" style={{ color: "black" }}>Connected Accounts</h2>
              <div className="flex flex-col gap-3">
                {/* Venmo */}
                <div className="flex items-center border border-gray-300 rounded-md bg-[#F3F6FA] px-4 py-2" style={{ minHeight: 44, color: "black" }}>
                  <SiVenmo className="text-[#3D95CE] text-2xl mr-3" />
                  <span className="font-semibold text-[15px]">Venmo</span>
                  <span className="ml-auto text-green-700 font-bold text-base">✓</span>
                </div>

                {/* PayPal */}
                <div className="flex items-center border border-gray-300 rounded-md bg-white px-4 py-2 hover:bg-[#F3F6FA] cursor-pointer" style={{ minHeight: 44, color: "black" }}>
                  <FaPaypal className="text-[#003087] text-2xl mr-3" />
                  <span className="font-semibold text-[15px]">Paypal</span>
                </div>

                {/* CashApp */}
                <div className="flex items-center border border-gray-300 rounded-md bg-white px-4 py-2 hover:bg-[#F3F6FA] cursor-pointer" style={{ minHeight: 44, color: "black" }}>
                  <SiCashapp className="text-[#00C244] text-2xl mr-3" />
                  <span className="font-semibold text-[15px]">Cashapp</span>
                </div>
              </div>
            </div>
          </div>

          {/* Manage Account */}
          {/* Manage Account section */}
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
            {/* Lighter subtle grey overlay to highlight modal */}
            <div
            className="absolute inset-0 bg-black/10"
            onClick={() => !updating && setShowEdit(false)}
            ></div>
            {/* Modal content */}
            <div className="relative bg-white rounded-lg shadow-2xl p-8 w-full max-w-md border-4" style={{ borderColor: '#0C2D57' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: '#0C2D57' }}>Edit Profile</h2>
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
                  <label className="block text-sm text-gray-800 font-medium mb-1">Full Name</label>
                  <input 
                    name="name" 
                    type="text" 
                    value={editData.name} 
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
                  <label className="block text-sm text-gray-800 font-medium mb-1">Password</label>
                  <input 
                    name="password" 
                    type="password" 
                    value={editData.password} 
                    disabled 
                    className="w-full border rounded px-3 py-2 bg-gray-100 text-black" 
                    placeholder="Leave blank to keep current password"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-800 font-medium mb-1">Phone Number</label>
                  <input 
                    name="phone" 
                    type="text" 
                    value={editData.phone} 
                    onChange={handleEditChange} 
                    className="w-full border rounded px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div className="flex gap-2 mt-6">
                  <button 
                    onClick={handleEditProfile}
                    className="px-4 py-2 bg-[#0C2D57] text-white rounded hover:bg-[#0a2342] min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
                    disabled={updating}
                  >
                    {updating ? "Updating..." : "Update"}
                  </button>
                  <button 
                    onClick={() => setShowEdit(false)} 
                    className="px-4 py-2 text-gray-800 bg-gray-200 rounded hover:bg-gray-300 transition-colors" 
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
            {/* Subtle overlay */}
            <div
              className="absolute inset-0 bg-black/10"
              onClick={() => !deleting && setShowDelete(false)}
            ></div>
            {/* Modal content styled to match provided image */}
            <div className="relative bg-white rounded-xl shadow-xl p-7 w-full max-w-lg" style={{ minWidth: 380, maxWidth: 440 }}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-[#222]">Delete Account</h2>
                <button
                  className="text-gray-500 text-xl hover:text-gray-700"
                  onClick={() => !deleting && setShowDelete(false)}
                  disabled={deleting}
                  aria-label="Close"
                >
                  <X size={22} />
                </button>
              </div>
              <div className="mb-6 mt-1 text-[15px] text-gray-800">Are you sure you want to delete your account?</div>
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