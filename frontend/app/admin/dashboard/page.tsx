"use client";
import { useEffect, useState } from "react";

const BLUE = "#0A2342";
const BG = "#FAF9F6";

type Attorney = {
  id: string;
  name: string;
  email: string;
  barNumber: string;
  verified: boolean;
};

type Juror = {
  id: string;
  name: string;
  email: string;
  age: string;
  county: string;
  verified: boolean;
};

export default function AdminDashboard() {
  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  const [jurors, setJurors] = useState<Juror[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [attRes, jurRes] = await Promise.all([
        fetch("http://localhost:4000/api/admin/attorneys"),
        fetch("http://localhost:4000/api/admin/jurors"),
      ]);
      const attData = await attRes.json();
      const jurData = await jurRes.json();
      console.log(attData);
      console.log(jurData);
      setAttorneys(attData.attorneys || attData);
      setJurors(jurData.jurors || jurData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleVerifyAttorney = async (attorneyId: number) => {
    await fetch(
      `http://localhost:4000/api/admin/attorneys/${attorneyId}/verify`,
      {
        method: "POST",
      }
    );
    setAttorneys((prev) =>
      prev.map((a) =>
        a.AttorneyId === attorneyId
          ? { ...a, VerificationStatus: "verified", IsVerified: true }
          : a
      )
    );
  };

  const handleVerifyJuror = async (jurorId: number) => {
    await fetch(`http://localhost:4000/api/admin/jurors/${jurorId}/verify`, {
      method: "POST",
    });
    setJurors((prev) =>
      prev.map((j) =>
        j.JurorId === jurorId
          ? { ...j, VerificationStatus: "verified", IsVerified: true }
          : j
      )
    );
  };

  return (
    <main
      className="min-h-screen w-full flex flex-col items-center"
      style={{ backgroundColor: BG, fontFamily: "inherit" }}
    >
      <div className="w-full max-w-7xl px-8 py-8">
        <h1 className="text-3xl font-bold mb-8" style={{ color: BLUE }}>
          Admin Dashboard
        </h1>
        <div className="grid grid-cols-4 gap-8 mb-10">
          {/* Left column: Links */}
          <div className="col-span-1 flex flex-col gap-4">
            <button className="bg-white rounded p-4 text-left font-medium hover:bg-[#f9f7f2] border border-gray-200 text-black">
              Link to Pending Cases Excel Sheet
            </button>
            <button className="bg-white rounded p-4 text-left font-medium hover:bg-[#f9f7f2] border border-gray-200 text-black">
              Link to attorneys excel sheet
            </button>
            <button className="bg-white rounded p-4 text-left font-medium hover:bg-[#f9f7f2] border border-gray-200 text-black">
              Link to Jurors excel sheet
            </button>
          </div>
          {/* Center column: Agreements */}
          <div className="col-span-1 flex flex-col gap-4">
            <button className="bg-white border-2 border-[#0A2342] rounded p-4 text-left font-medium hover:bg-[#e6ecf5] text-black">
              Link to Attorneys signed Agreements
            </button>
            <button className="bg-white rounded p-4 text-left font-medium hover:bg-[#f9f7f2] border border-gray-200 text-black">
              Link to Jurors signed Agreements
            </button>
            <button className="bg-white rounded p-4 text-left font-medium hover:bg-[#f9f7f2] border border-gray-200 text-black">
              Link to an in progress War Room if the Attorney gets stuck on something?
            </button>
          </div>
          {/* Right column: Calendar */}
          <div className="col-span-2 bg-white rounded p-6 flex flex-col items-center justify-center min-h-[300px] border border-gray-200">
            <div className="text-lg font-semibold mb-2 text-black">Calendar (interactive)</div>
            <div className="text-sm text-gray-700">
              (Cases need to be identified by Case No.)
            </div>
            {/* You can embed a calendar component here */}
          </div>
        </div>
        {/* Today's Trials and Notifications */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div className="bg-white rounded p-6 border border-gray-200">
            <div className="font-semibold mb-2 text-black">Today's Trials</div>
            <div className="mb-3">
              <div className="font-medium text-black">Case No. 1 Start Time Scheduled ______</div>
              <div className="ml-4 text-sm text-black">
                Link to ACS Courtroom No. 1<br />
                (if not available on calendar)<br />
                Debriefing Starts _____<br />
                Actual Ending Time _____<br />
                Notes: <input className="border rounded px-2 py-1 ml-2 text-black bg-[#f9f7f2]" />
              </div>
            </div>
            <div>
              <div className="font-medium text-black">Case No. 2 Start Time Scheduled ______</div>
              <div className="ml-4 text-sm text-black">
                Link to ACS Courtroom No. 2<br />
                Debriefing Starts _____<br />
                Actual Ending Time _____<br />
                Notes: <input className="border rounded px-2 py-1 ml-2 text-black bg-[#f9f7f2]" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded p-6 border border-gray-200">
            <div className="font-semibold mb-2 text-black">Today's Notifications to be sent</div>
            <div className="flex flex-col gap-2">
              <div className="text-black">
                Case No. ____ <input className="border rounded px-2 py-1 ml-2 text-black bg-[#f9f7f2]" />
              </div>
              <div className="text-black">
                Case No. ____ <input className="border rounded px-2 py-1 ml-2 text-black bg-[#f9f7f2]" />
              </div>
            </div>
          </div>
        </div>
        {/* Attorneys and Jurors Tables */}
        <div className="grid grid-cols-2 gap-8">
          {/* Attorneys Table */}
          <div className="bg-white rounded shadow p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4" style={{ color: BLUE }}>
              Attorneys
            </h2>
            <div className="w-full overflow-x-auto">
              <table className="min-w-[900px] w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-3 text-black whitespace-nowrap">First Name</th>
                    <th className="py-2 px-3 text-black whitespace-nowrap">Last Name</th>
                    <th className="py-2 px-3 text-black whitespace-nowrap">Law Firm</th>
                    <th className="py-2 px-3 text-black whitespace-nowrap">Email</th>
                    <th className="py-2 px-3 text-black whitespace-nowrap">State</th>
                    <th className="py-2 px-3 text-black whitespace-nowrap">State Bar Number</th>
                    <th className="py-2 px-3 text-black whitespace-nowrap">Verification Status</th>
                    <th className="py-2 px-3 text-black whitespace-nowrap">Is Verified</th>
                    <th className="py-2 px-3 text-black whitespace-nowrap">Created At</th>
                    <th className="py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {attorneys.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center text-gray-500 py-4">No attorneys found.</td>
                    </tr>
                  ) : (
                    attorneys.map((a) => (
                      <tr key={a.AttorneyId} className="border-b">
                        <td className="py-2 px-3 text-black whitespace-nowrap">{a.FirstName}</td>
                        <td className="py-2 px-3 text-black whitespace-nowrap">{a.LastName}</td>
                        <td className="py-2 px-3 text-black whitespace-nowrap">{a.LawFirmName}</td>
                        <td className="py-2 px-3 text-black whitespace-nowrap">{a.Email}</td>
                        <td className="py-2 px-3 text-black whitespace-nowrap">{a.State}</td>
                        <td className="py-2 px-3 text-black whitespace-nowrap">{a.StateBarNumber}</td>
                        <td className="py-2 px-3 text-black whitespace-nowrap">{a.VerificationStatus}</td>
                        <td className="py-2 px-3">
                          {a.IsVerified ? (
                            <span className="text-green-600 font-bold">Yes</span>
                          ) : (
                            <span className="text-red-600 font-bold">No</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-black whitespace-nowrap">{new Date(a.CreatedAt).toLocaleString()}</td>
                        <td className="py-2 px-3">
                          {!a.IsVerified && (
                            <button
                              className="px-3 py-1 rounded bg-black text-white hover:bg-[#0A2342]"
                              onClick={() => handleVerifyAttorney(a.AttorneyId)}
                            >
                              Mark Verified
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* Jurors Table */}
          <div className="bg-white rounded shadow p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4" style={{ color: BLUE }}>
              Jurors
            </h2>
            <div className="w-full overflow-x-auto">
              <table className="min-w-[900px] w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-3 text-black whitespace-nowrap">Juror Name</th>
                    <th className="py-2 px-3 text-black whitespace-nowrap">Email</th>
                    <th className="py-2 px-3 text-black whitespace-nowrap">County</th>
                    <th className="py-2 px-3 text-black whitespace-nowrap">State</th>
                    <th className="py-2 px-3 text-black whitespace-nowrap">Verification Status</th>
                    <th className="py-2 px-3 text-black whitespace-nowrap">Is Verified</th>
                    <th className="py-2 px-3 text-black whitespace-nowrap">Is Active</th>
                    <th className="py-2 px-3 text-black whitespace-nowrap">Onboarding Completed</th>
                    <th className="py-2 px-3 text-black whitespace-nowrap">Created At</th>
                    <th className="py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {jurors.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center text-gray-500 py-4">No jurors found.</td>
                    </tr>
                  ) : (
                    jurors.map((j) => (
                      <tr key={j.JurorId} className="border-b">
                        <td className="py-2 px-3 text-black whitespace-nowrap">{j.Name}</td>
                        <td className="py-2 px-3 text-black whitespace-nowrap">{j.Email}</td>
                        <td className="py-2 px-3 text-black whitespace-nowrap">{j.County}</td>
                        <td className="py-2 px-3 text-black whitespace-nowrap">{j.State}</td>
                        <td className="py-2 px-3 text-black whitespace-nowrap">{j.VerificationStatus}</td>
                        <td className="py-2 px-3">
                          {j.IsVerified ? (
                            <span className="text-green-600 font-bold">Yes</span>
                          ) : (
                            <span className="text-red-600 font-bold">No</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-black whitespace-nowrap">
                          {j.IsActive ? (
                            <span className="text-green-600 font-bold">Yes</span>
                          ) : (
                            <span className="text-red-600 font-bold">No</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-black whitespace-nowrap">
                          {j.OnboardingCompleted ? (
                            <span className="text-green-600 font-bold">Yes</span>
                          ) : (
                            <span className="text-red-600 font-bold">No</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-black whitespace-nowrap">{new Date(j.CreatedAt).toLocaleString()}</td>
                        <td className="py-2 px-3">
                          {!j.IsVerified && (
                            <button
                              className="px-3 py-1 rounded bg-black text-white hover:bg-[#0A2342]"
                              onClick={() => handleVerifyJuror(j.JurorId)}
                            >
                              Mark Verified
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}