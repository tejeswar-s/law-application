import Image from "next/image";
import Link from "next/link";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { FaTwitter, FaInstagram, FaFacebook, FaLinkedin } from "react-icons/fa";
import { FaGavel, FaMoneyBillWave } from "react-icons/fa";

export default function LandingPage() {
  return (
    <div className="bg-[#f9f7f2] text-[#0A2342] font-sans">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="pt-42 pb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-semibold text-[#0A2342] leading-snug">
          A Virtual Courtroom Where Justice Moves Fast—
          <br />
          and Jurors Get Paid.
        </h1>
        <p className="mt-4 text-[#455A7C] font-semibold max-w-4xl mx-auto text-base">
          Quick Verdicts is where small claims trials happen—quickly, securely,
          and virtually.
          <br /> Start your case online or get paid to serve as a remote juror.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            href="/signup/attorney"
            className="px-5 py-2.5 bg-[#0A2342] text-white font-semibold rounded-md hover:bg-[#1a3666] transition flex items-center gap-2"
          >
            <FaGavel />
            <span>Start a Trial Now</span>
          </Link>
          <Link
            href="/signup/juror"
            className="px-5 py-2.5 bg-[#e6f4ea] text-[#1a7f37] border border-[#b7e0c3] rounded-md font-semibold hover:bg-[#d2ecd8] transition flex items-center gap-2"
          >
            <FaMoneyBillWave />
            <span>Get Paid to be a Juror</span>
          </Link>
        </div>
        <div className="mt-10 mb-20 flex justify-center">
          <Image
            src="/Image1.png"
            alt="Scales of Justice"
            width={700}
            height={500}
            className="rounded-md shadow-md"
            priority
          />
        </div>
      </section>

      {/* Two Column Intro Heading */}
      <section className="max-w-8xl mx-auto text-center px-6">
        <h2 className="text-2xl md:text-4xl font-semibold text-[#0A2342] leading-snug">
          Start a Small Claims Trial or Get Paid to Be a Juror—All Online.
        </h2>
        <p className="mt-4 text-[#455A7C] font-semibold max-w-5xl mx-auto text-base">
          Whether you're an attorney looking to resolve small claims disputes
          quickly, or a citizen ready to serve as a paid juror, Quick Verdicts
          offers a secure, all-virtual courtroom experience that makes justice
          accessible from anywhere.
        </p>
      </section>

      {/* Two Column Section */}
      <section
        id="how"
        className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-8 items-stretch"
      >
        {/* Attorneys */}
        <div className="bg-white border border-[#e3e3e3] rounded-lg p-0 shadow-sm flex flex-col">
          <Image
            src="/image2.png"
            alt="Attorney"
            width={520}
            height={300}
            className="rounded-t-lg object-cover w-full h-[300px]"
          />
          <div className="p-6 flex flex-col flex-grow">
            <h3 className="mt-2 text-xl font-semibold text-[#0A2342]">
              We Speed Up Justice for Attorneys
            </h3>
            <p className="mt-2 text-[#1a3666] text-base">
              Resolve your small claims cases faster with Quick Verdicts. Set up
              a case, upload your materials, and let us handle the rest.
            </p>
            <div className="mt-4 space-y-4 text-[#0A2342] text-sm">
              <div>
                <p className="font-semibold">1. Start Your Trial</p>
                <p>Create an account and open a small claims case in minutes.</p>
              </div>
              <div>
                <p className="font-semibold">2. Prepare Your Case</p>
                <p>
                  Upload evidence and documents into the secure Virtual War Room.
                </p>
              </div>
              <div>
                <p className="font-semibold">3. Hold Your Trial Online</p>
                <p>
                  Schedule and conduct your hearing with a real jury—100%
                  virtually.
                </p>
              </div>
            </div>
            <div className="mt-auto">
              <Link
                href="/signup/attorney"
                className="inline-block mt-6 px-4 py-2 bg-[#0A2342] text-white rounded-md font-medium hover:bg-[#1a3666] transition"
              >
                Start a Trial Now
              </Link>
            </div>
          </div>
        </div>

        {/* Jurors */}
        <div className="bg-white border border-[#e3e3e3] rounded-lg p-0 shadow-sm flex flex-col">
          <Image
            src="/image3.png"
            alt="Juror"
            width={520}
            height={300}
            className="rounded-t-lg object-cover w-full h-[300px]"
          />
          <div className="p-6 flex flex-col flex-grow">
            <h3 className="mt-2 text-xl font-semibold text-[#0A2342]">
              We Pay Jurors to Deliberate Online
            </h3>
            <p className="mt-2 text-[#1a3666] text-base">
              Serving on a jury is now more accessible—and rewarding. Sign up,
              find a case, and join the trial on the scheduled date. All online.
              All paid.
            </p>
            <div className="mt-4 space-y-4 text-[#0A2342] text-sm">
              <div>
                <p className="font-semibold">1. Sign Up to Serve</p>
                <p>
                  Create a free account and get verified as a potential juror.
                </p>
              </div>
              <div>
                <p className="font-semibold">2. Find a Trial to Join</p>
                <p>Browse upcoming small claims cases on the Juror Job Board.</p>
              </div>
              <div>
                <p className="font-semibold">3. Join the Live Trial</p>
                <p>
                  Log in on the scheduled date to participate in the virtual
                  courtroom.
                </p>
              </div>
            </div>
            <div className="mt-auto">
              <Link
                href="/signup/juror"
                className="inline-block mt-6 px-4 py-2 bg-[#e6f4ea] text-[#1a7f37] border border-[#b7e0c3] rounded-md font-medium hover:bg-[#d2ecd8] transition"
              >
                Get Paid to be a Juror
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* More about quick verdicts */}
      <section className="bg-[#f9f7f2] py-12 px-6">
        <h1 className="text-3xl md:text-4xl font-semibold text-[#0A2342] text-center mb-10">
          Learn More About Quick Verdicts
        </h1>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          {/* Text */}
          <div>
            <h2 className="text-2xl font-semibold text-[#0A2342] mb-4">
              With Quick Verdicts justice is faster, more accessible, and more
              affordable for everyone.
            </h2>
            <ul className="mt-4 text-[#455A7C] space-y-4 text-base font-semibold list-none">
              <li>
                Whether you're an attorney looking to resolve a dispute quickly,
                or a citizen interested in serving as a paid juror, Quick Verdicts
                lets you participate securely and remotely from anywhere.
              </li>
              <li>
                We support real legal cases, real jurors, and real outcomes—with
                the convenience of digital tools and the integrity of a
                traditional courtroom. Watch the video to learn more about QV.
              </li>
            </ul>
          </div>
          {/* Image */}
          <div className="flex justify-center md:justify-end">
            <Image
              src="/image4.png"
              alt="Attorney at desk"
              width={600}
              height={380}
              className="rounded-md object-cover shadow-md"
            />
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="bg-[#f9f7f2] py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          {/* Image */}
          <div className="flex justify-center md:justify-start">
            <Image
              src="/image5.png"
              alt="Security shield"
              width={600}
              height={380}
              className="rounded-md object-cover shadow-md"
            />
          </div>
          {/* Text */}
          <div>
            <h2 className="text-2xl font-semibold text-[#0A2342] mb-4">
              Secure. Confidential. Built for Legal Integrity.
            </h2>
            <ul className="mt-4 text-[#455A7C] space-y-4 text-base font-semibold list-none">
              <li>
                Quick Verdicts uses end-to-end encryption, secure document
                storage, and private virtual courtrooms to ensure every case and
                every juror is protected.
              </li>
              <li>
                We comply with state and federal guidelines for small claims
                proceedings and jury service.
              </li>
              <li>
                Built for speed and simplicity. Compliant with small claims and
                jury regulations. 100% virtual, secure, and accessible.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-20 py-16 text-left">
        <h2 className="text-4xl font-semibold text-[#0A2342] mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-8 divide-y divide-[#C6CDD9]">
          <div className="pb-6">
            <h3 className="font-semibold text-[#0A2342]">
              What is Quick Verdicts?
            </h3>
            <p className="text-[#1a3666] mt-2">
              Quick Verdict is a virtual courtroom platform where attorneys can present small claims cases to real, local jurors.
            </p>
          </div>
          <div className="pt-6 pb-6">
            <h3 className="font-semibold text-[#0A2342]">How does it work?</h3>
            <p className="text-[#1a3666] mt-2">
              Attorneys upload case materials, evidence, and questions. Jurors are selected from the local county, then join a secure virtual courtroom to review the case and render a decision. You receive a full report with juror feedback, verdicts, and damages recommendations-typically within 48 hours.
            </p>
          </div>
          <div className="pt-6 pb-6">
            <h3 className="font-semibold text-[#0A2342]">
              What types of cases work best?
            </h3>
            <p className="text-[#1a3666] mt-2">
              Small claims, personal injury, contract disputes, landlord/tenant
              cases, and other civil matters under $25,000.
            </p>
          </div>
          <div className="pt-6">
            <h3 className="font-semibold text-[#0A2342]">
              What does a juror do on Quick Verdicts?
            </h3>
            <p className="text-[#1a3666] mt-2">
              As a juror, you join a secure virtual courtroom to review real small claims cases. You'll examine case files, watch short video statements (if available), and answer structured questions to help attorneys understand how a local jury might view their case.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#EEE7D5] py-16 text-center border-t border-[#ede3cf] m-0">
        <h2 className="text-4xl font-semibold text-[#0A2342] mb-2">
          Ready to Join a Trial—or Start One?
        </h2>
        <p className="mt-2 text-[#1a3666] font-semibold max-w-4xl mx-auto">
          Whether you’re here to serve or to litigate, Quick Verdicts is ready
          when you are. Join thousands <br /> of people participating in a faster,
          smarter justice system.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            href="/signup/attorney"
            className="px-5 py-2.5 bg-[#0A2342] text-white font-semibold rounded-md hover:bg-[#1a3666] transition flex items-center gap-2"
          >
            <FaGavel />
            <span>Start a Trial Now</span>
          </Link>
          <Link
            href="/signup/juror"
            className="px-5 py-2.5 bg-[#e6f4ea] text-[#1a7f37] border border-[#b7e0c3] rounded-md font-semibold hover:bg-[#d2ecd8] transition flex items-center gap-2"
          >
            <FaMoneyBillWave />
            <span>Get Paid to be a Juror</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
