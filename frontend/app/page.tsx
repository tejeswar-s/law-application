import Image from "next/image";
import Link from "next/link";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { FaTwitter, FaInstagram, FaFacebook, FaLinkedin } from "react-icons/fa";

export default function LandingPage() {
  return (
    <div className="bg-[#f9f7f2] text-[#0A2342] font-sans">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-[#0A2342] leading-snug">
          A Virtual Courtroom Where Justice Moves Fast—<br />and Jurors Get Paid.
        </h1>
        <p className="mt-4 text-[#1a3666] max-w-2xl mx-auto text-base">
          Quick Verdicts is where small claims trials happen—quickly, securely, and virtually.<br />
          Start your case online or get paid to serve as a remote juror.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            href="#"
            className="px-5 py-2.5 bg-[#0A2342] text-white font-semibold rounded-md hover:bg-[#1a3666] transition flex items-center gap-2"
          >
            <span>Start a Trial Now</span>
          </Link>
          <Link
            href="#"
            className="px-5 py-2.5 bg-[#e6f4ea] text-[#1a7f37] border border-[#b7e0c3] rounded-md font-semibold hover:bg-[#d2ecd8] transition flex items-center gap-2"
          >
            <span>Get Paid to be a Juror</span>
          </Link>
        </div>
        <div className="mt-10 flex justify-center">
          <Image
            src="/Image1.png"
            alt="Scales of Justice"
            width={520}
            height={340}
            className="rounded-md shadow-md"
            priority
          />
        </div>
      </section>

      {/* Two Column Section */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-8">
        {/* Attorneys */}
        <div className="bg-white border border-[#e3e3e3] rounded-lg p-6 shadow-sm flex flex-col">
          <Image
            src="/image2.png"
            alt="Attorney"
            width={480}
            height={280}
            className="rounded-md object-cover"
          />
          <h3 className="mt-4 text-xl font-bold text-[#0A2342]">
            We Speed Up Justice for Attorneys
          </h3>
          <p className="mt-2 text-[#1a3666] text-base">
            Resolve your small claims cases faster with Quick Verdicts. Set up a case, upload your materials, and let us handle the rest.
          </p>
          <ul className="mt-4 text-[#0A2342] text-sm space-y-1">
            <li><span className="font-semibold">1. Start Your Trial</span> — Create an account and open a small claims case in minutes.</li>
            <li><span className="font-semibold">2. Prepare Your Case</span> — Upload evidence and documents into the secure Virtual War Room.</li>
            <li><span className="font-semibold">3. Hold Your Trial Online</span> — Schedule and conduct your hearing with a real jury—100% virtually.</li>
          </ul>
          <Link
            href="#"
            className="inline-block mt-5 px-4 py-2 bg-[#0A2342] text-white rounded-md font-medium hover:bg-[#1a3666] transition"
          >
            Start a Trial Now
          </Link>
        </div>

        {/* Jurors */}
        <div className="bg-white border border-[#e3e3e3] rounded-lg p-6 shadow-sm flex flex-col">
          <Image
            src="/image3.png"
            alt="Juror"
            width={480}
            height={280}
            className="rounded-md object-cover"
          />
          <h3 className="mt-4 text-xl font-bold text-[#0A2342]">
            We Pay Jurors to Deliberate Online
          </h3>
          <p className="mt-2 text-[#1a3666] text-base">
            Serving on a jury is now more accessible—and rewarding. Sign up, find a case, and join the trial on the scheduled date. All online. All paid.
          </p>
          <ul className="mt-4 text-[#0A2342] text-sm space-y-1">
            <li><span className="font-semibold">1. Sign Up to Serve</span> — Create a free account and get verified as a potential juror.</li>
            <li><span className="font-semibold">2. Find a Trial to Join</span> — Browse upcoming small claims cases on the Juror Job Board.</li>
            <li><span className="font-semibold">3. Join the Live Trial</span> — Log in on the scheduled date to participate in the virtual courtroom.</li>
          </ul>
          <Link
            href="#"
            className="inline-block mt-5 px-4 py-2 bg-[#e6f4ea] text-[#1a7f37] border border-[#b7e0c3] rounded-md font-medium hover:bg-[#d2ecd8] transition"
          >
            Get Paid to be a Juror
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#0A2342] mb-2">Learn More About Quick Verdicts</h2>
          <p className="mt-4 text-[#1a3666]">
            With Quick Verdicts justice is faster, more accessible, and more affordable for everyone.
          </p>
          <p className="mt-2 text-[#1a3666]">
            Whether you’re an attorney looking to resolve a dispute quickly, or a citizen interested in serving as a paid juror, Quick Verdicts lets you participate securely and remotely from anywhere.
          </p>
          <p className="mt-2 text-[#1a3666]">
            We support real legal cases, real jurors, and real outcomes—with the convenience of digital tools and the integrity of a traditional courtroom.
          </p>
        </div>
        <Image
          src="/images/judge.jpg"
          alt="Judge"
          width={480}
          height={280}
          className="rounded-md object-cover"
        />
      </section>

      {/* Security Section */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div className="flex justify-center md:justify-start">
            <Image
              src="/image4.png"
              alt="Security"
              width={120}
              height={120}
              className="rounded-md"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#0A2342] mb-2">Secure. Confidential. Built for Legal Integrity.</h2>
            <ul className="mt-4 text-[#1a3666] list-disc list-inside space-y-2 text-base">
              <li>Quick Verdicts uses end-to-end encryption, secure document storage, and private virtual courtrooms to ensure every case and every juror is protected.</li>
              <li>We comply with state and federal guidelines for small claims proceedings and jury service.</li>
              <li>
                <span className="font-semibold">• Built for speed and simplicity<br />
                • Compliant with small claims and jury regulations<br />
                • 100% virtual, secure, and accessible</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-[#0A2342] mb-6">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-[#0A2342]">What is Quick Verdicts?</h3>
            <p className="text-[#1a3666]">
              Quick Verdicts is a virtual courtroom platform where attorneys can present small claims cases to real, local jurors.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-[#0A2342]">How does it work?</h3>
            <p className="text-[#1a3666]">
              Attorneys upload case materials, evidence, and jurors deliberate online—decisions within 48 hours.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-[#0A2342]">What types of cases work best?</h3>
            <p className="text-[#1a3666]">
              Small claims, personal injury, contract disputes, landlord/tenant cases, and other civil matters under $25,000.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-[#0A2342]">What does a juror do on Quick Verdicts?</h3>
            <p className="text-[#1a3666]">
              Jurors review real small claims cases, examine evidence, and provide structured feedback to attorneys.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#f9f7f2] py-16 text-center border-t border-[#ede3cf]">
        <h2 className="text-2xl font-bold text-[#0A2342] mb-2">Ready to Join a Trial—or Start One?</h2>
        <p className="mt-2 text-[#1a3666] max-w-2xl mx-auto">
          Whether you’re here to serve or to litigate, Quick Verdicts is ready when you are. Join thousands of people participating in a faster, smarter justice system.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            href="#"
            className="px-5 py-2.5 bg-[#0A2342] text-white font-semibold rounded-md hover:bg-[#1a3666] transition flex items-center gap-2"
          >
            <span>Start a Trial Now</span>
          </Link>
          <Link
            href="#"
            className="px-5 py-2.5 bg-[#e6f4ea] text-[#1a7f37] border border-[#b7e0c3] rounded-md font-semibold hover:bg-[#d2ecd8] transition flex items-center gap-2"
          >
            <span>Get Paid to be a Juror</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />


    </div>
  );
}
