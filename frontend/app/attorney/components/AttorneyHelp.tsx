import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

const tutorialVideos = [
  {
    src: "/help_video1.png",
    title: "Lesson #01 - What is Quick Verdict?",
    length: "3 mins",
  },
  {
    src: "/help_video2.png",
    title: "Lesson #02 - How to set new trial?",
    length: "7 mins",
  },
  {
    src: "/help_video3.png",
    title: "Lesson #03 - How do I use my War Room?",
    length: "3 mins",
  },
  {
    src: "/help_video1.png",
    title: "Lesson #04 - What is Quick Verdict?",
    length: "3 mins",
  },
  {
    src: "/help_video2.png",
    title: "Lesson #05 - How to set new trial?",
    length: "7 mins",
  },
  {
    src: "/help_video3.png",
    title: "Lesson #06 - How do I use my War Room?",
    length: "3 mins",
  },
];

const faqs = [
  {
    q: "What is Quick Verdicts?",
    a: `Quick Verdicts is an online platform designed to streamline the trial experience for both attorneys and jurors. Attorneys can present real cases in a secure, efficient digital environment, while jurors have the opportunity to participate, deliberate, and earn compensation—all from the comfort of their own home. Each case is designed to be quick and focused, lasting no more than 8 hours total, including introductions, trial presentations, and jury deliberation. Attorneys benefit from valuable insights, and jurors are paid for their time and perspective.`,
  },
  {
    q: "As a potential juror, how do I sign up for trial cases?",
    a: "To sign up for trial cases, register on the Quick Verdicts platform and complete the onboarding process. Once your profile is set up, you will be notified about available cases and can choose to participate in those that match your interests and qualifications.",
  },
  {
    q: "As a potential juror, how do I qualify to be a jury?",
    a: "To qualify as a juror, you must complete the onboarding steps, watch the introduction video, and pass the qualification quiz with a perfect score. This ensures you understand the process and your responsibilities before participating in any trial.",
  },
  {
    q: "How do jurors get paid?",
    a: "Jurors are compensated for their participation in each case. After successfully completing a trial, payment is processed electronically and sent to the account details provided during registration. You will receive a notification once your payment is issued.",
  },
  {
    q: "As an attorney, how do I submit my trial cases?",
    a: "Attorneys can submit new trial cases directly from their dashboard by clicking the '+ New Case' button. You will be guided through entering case details, uploading necessary documents, and scheduling the trial for review and approval.",
  },
];

export default function AttorneyHelp({ onContact }: { onContact: () => void }) {
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [search, setSearch] = useState("");
  const [videoStart, setVideoStart] = useState(0);
  const router = useRouter();
  
  // Filtered videos for search (searches title)
  const filteredVideos = tutorialVideos.filter(v =>
    v.title.toLowerCase().includes(search.toLowerCase())
  );
  
  // For slider: show 3 at a time, move window with arrows
  const visibleVideos = filteredVideos.slice(videoStart, videoStart + 3);
  
  // Filtered FAQs for search (searches question and answer)
  const filteredFaqs = faqs.filter(faq =>
    faq.q.toLowerCase().includes(search.toLowerCase()) ||
    faq.a.toLowerCase().includes(search.toLowerCase())
  );
  
  const canSlideLeft = videoStart > 0;
  const canSlideRight = videoStart + 3 < filteredVideos.length;
  
  const handleLeft = () => {
    if (canSlideLeft) setVideoStart(videoStart - 1);
  };
  
  const handleRight = () => {
    if (canSlideRight) setVideoStart(videoStart + 1);
  };
  
  // Reset slider if search changes or filteredVideos shrinks
  React.useEffect(() => {
    if (videoStart + 3 > filteredVideos.length) {
      setVideoStart(Math.max(0, filteredVideos.length - 3));
    }
  }, [search, filteredVideos.length]);

  
  return (
    <div className="flex-1 bg-[#f9f7f2] min-h-screen font-sans transition-all duration-300 ease-in-out">
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8 transition-all duration-300 ease-in-out">
        
        {/* Header buttons */}
        <div className="flex flex-col gap-4 mb-8 w-full transition-all duration-300 ease-in-out">
          <div className="flex items-center justify-between w-full">
            <button
              className="text-[#222] text-base flex items-center cursor-pointer focus:outline-none hover:bg-[#e6eefc] rounded px-2 py-1 transition"
              style={{ textDecoration: 'none' }}
              onClick={() => window.location.assign('/attorney')}
            >
              <span className="mr-2 text-xl">&#8592;</span> Back
            </button>
            <button
              onClick={onContact}
              className="bg-[#16305B] text-white px-5 py-2 rounded-md font-semibold hover:bg-[#1e417a] transition flex items-center gap-2 cursor-pointer"
              style={{ minWidth: 120, textDecoration: 'none' }}
            >
              Contact Us
            </button>
          </div>

          {/* Title + Search */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
            <h1 className="text-3xl font-bold text-[#222]">Help &amp; Feedback</h1>
            <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-end max-w-lg">
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="border border-gray-300 rounded px-4 py-2 w-64 bg-white focus:outline-none focus:ring-2 focus:ring-[#16305B]"
              />
              <button
                className="bg-[#16305B] text-white px-5 py-2 rounded-md font-semibold hover:bg-[#1e417a] transition cursor-pointer"
                onClick={() => {}}
                style={{ minWidth: 90, textDecoration: 'none' }}
              >
                Search
              </button>
            </div>
          </div>
        </div>

        
        <div className="mb-8 w-full">
          <div className="font-semibold text-lg mb-1">Tutorial Videos</div>
          <div className="text-sm text-gray-600 mb-4">Video tutorials to help you understand Quick Verdict</div>
          <div className="w-full pb-2 min-h-[270px] flex justify-center">
            <div
              className="flex gap-6 justify-center items-stretch w-full max-w-7xl transition-all duration-300 ease-in-out"
              style={{ width: '100%', minWidth: 0, maxWidth: '100%' }}
            >
              {visibleVideos.length === 0 ? (
                Array.from({ length: 3 }).map((_, idx) =>
                  idx === 0 ? (
                    <div key="no-videos" className="min-w-[320px] max-w-[340px] flex-shrink-0 flex items-center justify-center bg-white rounded-lg shadow p-3 min-h-[220px] text-gray-500 italic text-lg">
                      No videos found.
                    </div>
                  ) : (
                    <div key={"placeholder-empty-" + idx} className="min-w-[320px] max-w-[340px] flex-shrink-0 bg-transparent" style={{ border: 'none', pointerEvents: 'none' }} />
                  )
                )
              ) : (
                Array.from({ length: 3 }).map((_, idx) => {
                  const v = visibleVideos[idx];
                  if (v) {
                    return (
                      <div key={v.title} className="bg-white rounded-lg shadow p-3 min-w-[320px] max-w-[340px] flex-shrink-0 transition-all duration-300 ease-in-out">
                        <div className="relative w-full h-48 rounded overflow-hidden mb-2">
                          <Image src={v.src} alt={v.title} fill className="object-cover rounded" />
                          <div className="absolute bottom-2 left-2 flex items-center">
                            <button className="bg-white/90 rounded-full p-1 shadow">
                              <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="#fff" fillOpacity="0.7"/><polygon points="13,11 13,21 22,16" fill="#222"/></svg>
                            </button>
                          </div>
                        </div>
                        <div className="font-medium text-[15px] mb-1 truncate">{v.title}</div>
                        <div className="text-xs text-gray-600">Video Length: {v.length}</div>
                      </div>
                    );
                  } else {
                    return <div key={"placeholder-" + idx} className="min-w-[320px] max-w-[340px] flex-shrink-0 bg-transparent transition-all duration-300 ease-in-out" style={{ border: 'none', pointerEvents: 'none' }} />;
                  }
                })
              )}
            </div>
          </div>
        </div>
        
        <div className="mb-8 flex justify-center gap-4 w-full">
          <button
            className={`rounded-full border px-3 py-1 text-xl text-[#222] hover:bg-gray-100 transition cursor-pointer ${!canSlideLeft ? 'opacity-40 cursor-not-allowed' : ''}`}
            onClick={handleLeft}
            disabled={!canSlideLeft}
            style={{ textDecoration: 'none' }}
          >&#8592;</button>
          <button
            className={`rounded-full border px-3 py-1 text-xl text-[#222] hover:bg-gray-100 transition cursor-pointer ${!canSlideRight ? 'opacity-40 cursor-not-allowed' : ''}`}
            onClick={handleRight}
            disabled={!canSlideRight}
            style={{ textDecoration: 'none' }}
          >&#8594;</button>
        </div>
        
        <div className="mb-8 w-full">
          <div className="font-semibold text-lg mb-2">FAQ</div>
          <div className="text-sm text-gray-600 mb-4">Some frequently asked questions</div>
          <div className="w-full max-w-5xl mx-auto min-h-[220px] transition-all duration-300 ease-in-out">
            {filteredFaqs.length === 0 ? (
              <div className="flex items-center justify-center w-full min-h-[120px] text-gray-500 italic text-lg">No FAQs found.</div>
            ) : (
              filteredFaqs.map((faq, i) => (
                <div key={i} className="mb-4 w-full">
                  <div className="flex w-full items-stretch">
                    <button
                      className="flex-1 text-left font-semibold text-[17px] flex items-center py-2 pr-10 relative"
                      onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                      style={{ wordBreak: 'break-word', minHeight: '40px' }}
                    >
                      <span>{faq.q}</span>
                    </button>
                    <button
                      className="flex items-center justify-end w-12 min-w-[48px] select-none focus:outline-none"
                      aria-label={faqOpen === i ? 'Collapse answer' : 'Expand answer'}
                      onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                      tabIndex={0}
                    >
                      <ChevronDown 
                        className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                          faqOpen === i ? 'rotate-180' : 'rotate-0'
                        }`} 
                      />
                    </button>
                  </div>
                  {faqOpen === i && (
                    <div className="text-gray-700 text-[15px] pl-2 pb-2 w-full max-w-4xl transition-all duration-300 ease-in-out" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>{faq.a}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}