'use client';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [picks, setPicks] = useState([]);
  const [bucket, setBucket] = useState("");

  useEffect(() => {
    const storedBucket = localStorage.getItem("risk_bucket");
    if (!storedBucket) {
      window.location.href = "/";
      return;
    }

    setBucket(storedBucket);

    fetch("http://localhost:5050/api/dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ risk_bucket: storedBucket })
    })
      .then((res) => res.json())
      .then((data) => setPicks(data.picks))
      .catch((err) => console.error("API error", err));
  }, []);

  return (
  <div className="min-h-screen bg-gray-50 text-black p-8">
  <h1 className="text-4xl font-bold mb-6">Dashboard</h1>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Risk Profile Card */}
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-2xl font-semibold mb-2">Risk Profile</h2>
      <p className="text-2xl font-bold text-purple-600">{bucket}</p>
      <p className="text-sm text-gray-600 mt-2">
        Your profile suggests a mix of growth and stability aligned with a {bucket.toLowerCase()} risk tolerance.
      </p>
    </div>

    {/* Recommended Picks Card */}
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-2xl font-semibold mb-4">Recommended Holdings</h2>
      <ul className="space-y-2 text-sm">
        {picks.map((pick: any) => (
          <li key={pick.ticker} className="flex justify-between border-b pb-1">
            <span>{pick.ticker} - {pick.company}</span>
            <span className="text-green-600 font-medium">{pick.pred_return}%</span>
          </li>
        ))}
      </ul>
    </div>
  </div>

  {/* Download Button */}
  <div className="mt-8">
    <a
      className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      href={`http://localhost:5050/api/download/${bucket}`}
      download
    >
      Download Picks (CSV)
    </a>
  </div>
</div>

  );
}
