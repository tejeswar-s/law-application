import Image from "next/image";

// Accept onBack prop for navigation
export default function AttorneyContact({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex-1 bg-[#f9f7f2] min-h-screen font-sans transition-all duration-300 ease-in-out">
      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-10">
          <button 
            onClick={onBack} 
            className="text-[#0A2342] text-base flex items-center mb-2 cursor-pointer focus:outline-none hover:bg-[#e6eefc] rounded px-2 py-1 transition" 
            type="button" 
            style={{ textDecoration: 'none' }}
          >
            <span className="mr-2 text-xl">&#8592;</span> Back
          </button>
          <h1 className="text-2xl font-bold text-[#222] mt-2">Contact Us</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center transition-all duration-300 ease-in-out">
          {/* Left: Contact Info */}
          <div 
            className="flex flex-col items-start pl-2 md:pl-8 text-[19px] leading-relaxed w-full transition-all duration-300 ease-in-out" 
            style={{ minHeight: '420px' }}
          >
            <div className="mb-10">
              <div className="font-semibold mb-4 text-[16px]">Business Hours</div>
              <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                <div>Monday ~ Friday</div>
                <div className="text-[#444]">8:00 AM ~ 5:00 PM</div>
                <div>Saturday</div>
                <div className="text-[#444]">8:00 AM ~ 2:00 PM</div>
                <div>Sunday</div>
                <div className="text-[#444]">Closed</div>
              </div>
            </div>
            <div className="mb-10">
              <div className="font-semibold mb-4 text-[20px]">Phone</div>
              <div className="text-[#444]">(123) 456-7890</div>
            </div>
            <div className="mb-2">
              <div className="font-semibold mb-4 text-[20px]">Email</div>
              <a
                href="mailto:support@quickverdict.com"
                className="text-[#0A2342] underline hover:text-[#1a3666]"
              >
                support@quickverdict.com
              </a>
            </div>
          </div>

          {/* Right: Image */}
          <div className="flex justify-center md:justify-end w-full transition-all duration-300 ease-in-out">
            <div className="w-full md:w-[400px] lg:w-[550px] max-w-[95vw] transition-all duration-300 ease-in-out">
              <Image
                src="/contact_image.png"
                alt="Contact Support"
                width={800}
                height={600}
                className="rounded-md object-cover shadow-md w-full h-auto transition-all duration-300 ease-in-out"
                style={{ minHeight: '250px', maxHeight: '380px', width: '100%', objectFit: 'cover' }}
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
