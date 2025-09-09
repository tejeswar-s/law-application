"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Briefcase, Calendar, Bell, User, LogOut, Info } from "lucide-react";
import { useState } from "react";

export default function PaymentDetails() {
  const router = useRouter();
  const [form, setForm] = useState({
    nameOnCard: "",
    cardNumber: "",
    expMonth: "",
    expYear: "",
    billing1: "",
    billing2: "",
    city: "",
    state: "",
    zip: "",
    agree: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    // Optionally save payment data to localStorage:
    localStorage.setItem("case_payment", JSON.stringify(form));
    router.push("/cases/new/review");
  };

  return (
    <div className="min-h-screen flex bg-[#F7F6F3] font-sans">
      {/* Sidebar */}
      <aside className="w-[260px] bg-[#16305B] text-white flex flex-col justify-between py-6 px-4">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <img src="/logo.png" alt="Quick Verdicts" className="h-8 w-8" />
            <span className="font-bold text-lg tracking-wide">QUICK VERDICTS</span>
          </div>
          <nav className="flex flex-col gap-2">
            <Link href="/profile" className="flex items-center gap-2 py-2 px-3 rounded hover:bg-[#1e417a]">
              <User size={18} /> Profile
            </Link>
            <Link href="/notifications" className="flex items-center gap-2 py-2 px-3 rounded hover:bg-[#1e417a]">
              <Bell size={18} /> Notifications
            </Link>
            <div className="mt-6 mb-2 text-xs text-[#e0e6f1] uppercase tracking-wide">Main</div>
            <Link href="/attorney" className="flex items-center gap-2 py-2 px-3 rounded hover:bg-[#1e417a]">
              <Home size={18} /> Home
            </Link>
            <Link href="/cases" className="flex items-center gap-2 py-2 px-3 rounded bg-[#F7F6F3] text-[#16305B] font-semibold">
              <Briefcase size={18} /> Cases
            </Link>
            <Link href="/calendar" className="flex items-center gap-2 py-2 px-3 rounded hover:bg-[#1e417a]">
              <Calendar size={18} /> Calendar
            </Link>
          </nav>
        </div>
        <div>
          <Link href="/logout" className="flex items-center gap-2 py-2 px-3 rounded hover:bg-[#1e417a]">
            <LogOut size={18} /> <span>Sign Out</span>
          </Link>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 px-10 py-8">
        {/* Top bar */}
        <div className="flex items-center mb-6">
          <button
            className="text-[#16305B] font-medium hover:underline mr-4"
            onClick={() => router.back()}
          >
            &larr; Back
          </button>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[#16305B] font-medium">Help</span>
          </div>
        </div>
        {/* Stepper */}
        <div className="flex items-center gap-6 mb-8">
          <span className="text-[#6B7280]">Case Details</span>
          <span className="h-1 w-8 bg-[#e0e6f1] rounded"></span>
          <span className="text-[#6B7280]">Plaintiff Details</span>
          <span className="h-1 w-8 bg-[#e0e6f1] rounded"></span>
          <span className="text-[#6B7280]">Defendant Details</span>
          <span className="h-1 w-8 bg-[#e0e6f1] rounded"></span>
          <span className="text-[#6B7280]">Voir Dire Part 1 & 2</span>
          <span className="h-1 w-8 bg-[#e0e6f1] rounded"></span>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full border-2 border-[#16305B] flex items-center justify-center bg-white text-[#16305B] font-bold">5</span>
            <span className="font-semibold text-[#16305B]">Payment</span>
          </div>
          <span className="h-1 w-8 bg-[#e0e6f1] rounded"></span>
          <span className="text-[#6B7280]">Review</span>
          <span className="h-1 w-8 bg-[#e0e6f1] rounded"></span>
          <span className="text-[#6B7280]">Schedule</span>
        </div>
        <h1 className="text-2xl font-bold text-[#16305B] mb-2">Payment</h1>
        <p className="mb-2 text-[#16305B] font-semibold">
          Fill in payment details to pay for Trial Case Filing cost.
        </p>
        <p className="mb-8 text-[#6B7280]">
          New Trial Case Filing Total Cost: <span className="text-2xl text-[#16305B] font-bold">$80</span> <Info size={18} className="inline text-[#bfc6d1]" />
        </p>
        <form className="max-w-2xl" onSubmit={handleNext}>
          <div className="mb-4">
            <label className="block font-medium text-[#16305B] mb-1">
              Full Name on Card <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nameOnCard"
              value={form.nameOnCard}
              onChange={handleChange}
              className="w-full border border-[#bfc6d1] rounded px-4 py-2 bg-white text-[#16305B] focus:outline-[#16305B]"
              placeholder="Full Name on Card"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block font-medium text-[#16305B] mb-1">
              Credit Card Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="cardNumber"
              value={form.cardNumber}
              onChange={handleChange}
              className="w-full border border-[#bfc6d1] rounded px-4 py-2 bg-white text-[#16305B] focus:outline-[#16305B]"
              placeholder="Credit Card Number"
              required
            />
          </div>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block font-medium text-[#16305B] mb-1">
                Expiration Month
              </label>
              <select
                name="expMonth"
                value={form.expMonth}
                onChange={handleChange}
                className="w-full border border-[#bfc6d1] rounded px-4 py-2 bg-white text-[#16305B] focus:outline-[#16305B]"
                required
              >
                <option value="">Month</option>
                <option value="01">01</option>
                <option value="02">02</option>
                <option value="03">03</option>
                <option value="04">04</option>
                <option value="05">05</option>
                <option value="06">06</option>
                <option value="07">07</option>
                <option value="08">08</option>
                <option value="09">09</option>
                <option value="10">10</option>
                <option value="11">11</option>
                <option value="12">12</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block font-medium text-[#16305B] mb-1">
                Expiration Year <span className="text-red-500">*</span>
              </label>
              <select
                name="expYear"
                value={form.expYear}
                onChange={handleChange}
                className="w-full border border-[#bfc6d1] rounded px-4 py-2 bg-white text-[#16305B] focus:outline-[#16305B]"
                required
              >
                <option value="">Year</option>
                {Array.from({ length: 15 }, (_, i) => (
                  <option key={i} value={2025 + i}>{2025 + i}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block font-medium text-[#16305B] mb-1">
              Billing Address 1 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="billing1"
              value={form.billing1}
              onChange={handleChange}
              className="w-full border border-[#bfc6d1] rounded px-4 py-2 bg-white text-[#16305B] focus:outline-[#16305B]"
              placeholder="Billing Address 1"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block font-medium text-[#16305B] mb-1">
              Billing Address 2
            </label>
            <input
              type="text"
              name="billing2"
              value={form.billing2}
              onChange={handleChange}
              className="w-full border border-[#bfc6d1] rounded px-4 py-2 bg-white text-[#16305B] focus:outline-[#16305B]"
              placeholder="Billing Address 2"
            />
          </div>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block font-medium text-[#16305B] mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                className="w-full border border-[#bfc6d1] rounded px-4 py-2 bg-white text-[#16305B] focus:outline-[#16305B]"
                placeholder="City"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block font-medium text-[#16305B] mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <select
                name="state"
                value={form.state}
                onChange={handleChange}
                className="w-full border border-[#bfc6d1] rounded px-4 py-2 bg-white text-[#16305B] focus:outline-[#16305B]"
                required
              >
                <option value="">State</option>
                <option value="CA">California</option>
                <option value="TX">Texas</option>
                <option value="NY">New York</option>
                {/* Add more states */}
              </select>
            </div>
            <div className="flex-1">
              <label className="block font-medium text-[#16305B] mb-1">
                Zip Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="zip"
                value={form.zip}
                onChange={handleChange}
                className="w-full border border-[#bfc6d1] rounded px-4 py-2 bg-white text-[#16305B] focus:outline-[#16305B]"
                placeholder="ZIP Code"
                required
              />
            </div>
          </div>
          <div className="mb-8 flex items-start gap-2">
            <input
              type="checkbox"
              name="agree"
              checked={form.agree}
              onChange={handleChange}
              className="mt-1"
              required
            />
            <label className="text-[#16305B] text-sm">
              By clicking on the check box, you acknowledge that you understand that you have 10 days to submit all files to war room, and will receive a reminder email 3 days before files are deleted from completed trial case.
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-[#16305B] text-white font-semibold px-8 py-2 rounded-md hover:bg-[#0A2342] transition"
          >
            Next
          </button>
        </form>
      </main>
    </div>
  );
}