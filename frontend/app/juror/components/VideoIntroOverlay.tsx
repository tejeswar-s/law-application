"use client";

import { useRef, useState, useEffect } from "react";
import { X } from "lucide-react";


interface VideoIntroOverlayProps {
  open: boolean;
  onClose: () => void;
  onNext: () => void;
}

export default function VideoIntroOverlay({ open, onClose, onNext }: VideoIntroOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280); // default expanded

  // Responsive sidebar width detection
  useEffect(() => {
    function updateSidebarWidth() {
      // Try to detect sidebar width by DOM or fallback to 72px (collapsed) or 280px (expanded)
      const sidebar = document.querySelector('[data-sidebar]');
      if (sidebar) {
        setSidebarWidth((sidebar as HTMLElement).offsetWidth || 72);
      } else {
        // fallback: check body class or window width
        setSidebarWidth(window.innerWidth > 600 ? 280 : 72);
      }
    }
    updateSidebarWidth();
    window.addEventListener('resize', updateSidebarWidth);
    return () => window.removeEventListener('resize', updateSidebarWidth);
  }, []);

  if (!open) return null;

  // Overlay left margin matches sidebar width
  return (
    <div
      className="fixed inset-y-0 right-0 z-50 bg-black/40 flex items-stretch justify-stretch"
      style={{ left: sidebarWidth }}
    >
      <div className="relative bg-white w-full h-full flex flex-col overflow-hidden rounded-none shadow-none">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="12" rx="2" fill="#222" fillOpacity="0.08"/><rect x="3" y="6" width="18" height="12" rx="2" stroke="#222" strokeWidth="1.5"/><rect x="7.5" y="10.5" width="1.5" height="3" rx="0.75" fill="#222"/><rect x="11" y="10.5" width="1.5" height="3" rx="0.75" fill="#222"/><rect x="14.5" y="10.5" width="1.5" height="3" rx="0.75" fill="#222"/></svg>
            <span className="font-semibold text-lg text-[#222]">Introduction to Quick Verdicts</span>
          </div>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </div>
        {/* Video Section */}
        <div className="flex-1 flex flex-col bg-[#f9f9f9]">
          <div className="flex-1 flex items-center justify-center relative bg-black">
            {/* Video or Play Button */}
            {!playing && (
              <>
                <img
                  src="/introduction_video.png"
                  alt="Introduction Preview"
                  className="w-full h-full object-cover absolute inset-0"
                  style={{ filter: 'brightness(0.7)' }}
                />
                <button
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/80 rounded-full p-6 shadow-lg hover:bg-white"
                  onClick={() => {
                    setPlaying(true);
                    setTimeout(() => {
                      videoRef.current?.play();
                    }, 100);
                  }}
                  aria-label="Play Video"
                >
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="32" fill="#fff" fillOpacity="0.85" />
                    <polygon points="27,22 27,42 45,32" fill="#222" />
                  </svg>
                </button>
              </>
            )}
            <video
              ref={videoRef}
              src="/introduction_demo_video.mp4"
              className={`w-full h-full object-cover absolute inset-0 ${playing ? '' : 'hidden'}`}
              controls={false}
              onEnded={() => setEnded(true)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              disablePictureInPicture
              controlsList="nodownload noremoteplayback nofullscreen noplaybackrate"
              tabIndex={-1}
            />
            {/* Custom Controls: Backward, Play/Pause */}
            {playing && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-10 items-center bg-black/60 px-10 py-5 rounded-full shadow-xl border border-white/20">
                <button
                  className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20 hover:bg-[#0C2D57]/80 border-2 border-white/30 transition-all duration-200 shadow-lg focus:outline-none"
                  aria-label="Backward 10 seconds"
                  onClick={() => {
                    if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
                  }}
                >
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="18" fill="#fff" fillOpacity="0.18"/><path d="M23 26L15 18L23 10" stroke="#0C2D57" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button
                  className="flex items-center justify-center w-16 h-16 rounded-full bg-[#0C2D57] hover:bg-[#0a2342] border-4 border-white/40 transition-all duration-200 shadow-lg focus:outline-none"
                  aria-label={playing ? "Pause" : "Play"}
                  onClick={() => {
                    if (videoRef.current) {
                      if (playing) videoRef.current.pause();
                      else videoRef.current.play();
                    }
                  }}
                >
                  {playing ? (
                    <svg width="38" height="38" viewBox="0 0 38 38" fill="none"><circle cx="19" cy="19" r="19" fill="#fff" fillOpacity="0.18"/><rect x="13" y="11" width="4" height="16" rx="2" fill="#fff"/><rect x="21" y="11" width="4" height="16" rx="2" fill="#fff"/></svg>
                  ) : (
                    <svg width="38" height="38" viewBox="0 0 38 38" fill="none"><circle cx="19" cy="19" r="19" fill="#fff" fillOpacity="0.18"/><polygon points="15,13 15,25 27,19" fill="#fff"/></svg>
                  )}
                </button>
              </div>
            )}
          </div>
          {/* Description Section */}
          <div className="bg-white px-8 py-7 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-[#222] mb-2">Welcome to Quick Verdicts</h2>
            <p className="text-[15px] text-gray-700">Watch this short video to learn how Quick Verdicts works. You’ll view a mock trial and see how it will work in real time.</p>
          </div>
        </div>
        {/* Next Button */}
        <div className="flex justify-end items-center px-8 py-4 bg-white border-t border-gray-200">
          <button
            className={`px-6 py-2 rounded font-semibold text-white text-lg transition-colors ${ended ? 'bg-[#0C2D57] hover:bg-[#0a2342] cursor-pointer' : 'bg-gray-300 cursor-not-allowed'}`}
            disabled={!ended}
            onClick={ended ? onNext : undefined}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
