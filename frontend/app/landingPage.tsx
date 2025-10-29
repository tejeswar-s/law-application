"use client";

import Image from "next/image";

export default function LandingPage() {
  return (
    <main className="bg-white">
      {/* Hero Section */}
      <section className="bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            A Virtual Courtroom Where Justice Moves Fast—
            <br /> and Jurors Get Paid.
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            QuickVerdict delivers faster justice and pays real jurors for their
            time, all online.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">
              Start a Trial
            </button>
            <button className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
              Become a Juror
            </button>
          </div>
          <div className="mt-10 flex justify-center">
            <Image
              src="/image.png"
              alt="Scales of Justice"
              width={500}
              height={300}
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Small Claims & Juror Section */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12">
        <div className="bg-white border rounded-lg shadow p-6">
          <Image
            src="/images/attorney.jpg"
            alt="Attorney"
            width={500}
            height={300}
            className="rounded-md mb-4"
          />
          <h2 className="text-2xl font-semibold text-gray-900">
            Start a Small Claims Trial
          </h2>
          <p className="mt-2 text-gray-600">
            File and resolve disputes online quickly and affordably.
          </p>
          <ul className="mt-4 text-gray-700 list-disc list-inside space-y-1">
            <li>Simple filing process</li>
            <li>Lower costs than traditional courts</li>
            <li>Faster verdicts</li>
          </ul>
        </div>
        <div className="bg-white border rounded-lg shadow p-6">
          <Image
            src="/images/juror.jpg"
            alt="Juror"
            width={500}
            height={300}
            className="rounded-md mb-4"
          />
          <h2 className="text-2xl font-semibold text-gray-900">
            Get Paid to Be a Juror
          </h2>
          <p className="mt-2 text-gray-600">
            Participate from home, review cases, and earn money for your time.
          </p>
          <ul className="mt-4 text-gray-700 list-disc list-inside space-y-1">
            <li>Work remotely</li>
            <li>Flexible schedule</li>
            <li>Earn real money</li>
          </ul>
        </div>
      </section>

      {/* Learn More */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Learn More About Quick Verdicts
            </h2>
            <p className="text-gray-600 mb-4">
              With Quick Verdicts, justice is faster, more accessible, and more
              affordable than ever.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Easy case filing process</li>
              <li>Online trial participation</li>
              <li>Jurors compensated fairly</li>
            </ul>
          </div>
          <div>
            <Image
              src="/images/lawyer.jpg"
              alt="Lawyer"
              width={500}
              height={300}
              className="rounded-lg shadow-md"
            />
          </div>
        </div>
      </section>

      {/* Secure Section */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <Image
            src="/images/lock.png"
            alt="Secure Icon"
            width={80}
            height={80}
            className="mx-auto mb-6"
          />
          <h2 className="text-2xl font-semibold text-gray-900">
            Secure, Confidential. Built for Legal Professionals.
          </h2>
          <p className="mt-4 text-gray-600">
            Every case is handled with strict confidentiality and legal-grade
            security. Your data is always safe with us.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-800">
                What is Quick Verdict?
              </h3>
              <p className="text-gray-600">
                It’s a virtual courtroom platform that resolves disputes quickly
                with real jurors.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">
                How do I become a juror?
              </h3>
              <p className="text-gray-600">
                Sign up, complete your profile, and get notified when cases are
                available.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">
                Is it legally binding?
              </h3>
              <p className="text-gray-600">
                Yes, verdicts delivered through Quick Verdict are enforceable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-beige-100 py-16 text-center border-t">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Ready to Join a Trial — or Start One?
        </h2>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">
          Get Started
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-8 mt-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm">&copy; {new Date().getFullYear()} Quick Verdict. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Terms</a>
            <a href="#" className="hover:underline">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
