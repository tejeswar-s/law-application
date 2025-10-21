// ===== PAYMENT DETAILS PAGE =====
// app/attorney/state/payment-details/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Stepper from "../../components/Stepper";

export default function PaymentDetailsPage() {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  useEffect(() => {
    setPaymentMethod(localStorage.getItem("paymentMethod") || "");
    setPaymentAmount(localStorage.getItem("paymentAmount") || "");
  }, []);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!paymentMethod) errors.paymentMethod = "Payment method is required";
    if (!paymentAmount) errors.paymentAmount = "Payment amount is required";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    localStorage.setItem("paymentMethod", paymentMethod);
    localStorage.setItem("paymentAmount", paymentAmount);
    router.push("/attorney/state/review-details");
  };

  return (
    <div className="min-h-screen flex bg-[#faf8f3] font-sans">
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
      <section className="flex-1 flex flex-col min-h-screen bg-[#faf8f3] px-0 md:px-0 mb-20">
        <div className="w-full max-w-6xl mx-auto px-20">
          <Stepper currentStep={4} />
        </div>
        <div className="flex-1 flex flex-col pl-28">
          <div className="w-full max-w-2xl">
            <h1 className="text-3xl font-bold text-[#16305B] mb-8 mt-2">Payment Details</h1>
            <form className="space-y-6" onSubmit={handleNext}>
              <div>
                <label className="block mb-1 text-[#16305B] font-medium">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                >
                  <option value="">Select Method</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
                {validationErrors.paymentMethod && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.paymentMethod}</p>
                )}
              </div>
              <div>
                <label className="block mb-1 text-[#16305B] font-medium">
                  Payment Amount <span className="text-red-500">*</span>
                </label>
                <select
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-[#bfc6d1] rounded-md bg-white text-[#16305B] focus:outline-[#16305B]"
                >
                  <option value="">Select Amount</option>
                  <option value="2500">$2,500</option>
                  <option value="3000">$3,000</option>
                  <option value="4000">$4,000</option>
                </select>
                {validationErrors.paymentAmount && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.paymentAmount}</p>
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