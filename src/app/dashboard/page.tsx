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
    <div className="min-h-screen bg-white text-black p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard - {bucket} Risk</h1>
      <ul className="space-y-2">
        {picks.map((pick: any) => (
          <li key={pick.ticker}>
            {pick.ticker} - {pick.company} - Expected Return: {pick.pred_return}%
          </li>
        ))}
      </ul>
      <a
        className="mt-6 inline-block bg-green-600 text-white px-4 py-2 rounded"
        href={`http://localhost:5050/api/download/${bucket}`}
        download
      >
        Download Picks (CSV)
      </a>
    </div>
  );
}
