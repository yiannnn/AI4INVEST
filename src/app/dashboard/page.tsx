'use client';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [bucket, setBucket] = useState('');
  const [picks, setPicks] = useState<any[]>([]);

  useEffect(() => {
    const storedBucket = localStorage.getItem('risk_bucket');
    const username = localStorage.getItem('username');

    if (!username || !storedBucket) {
      window.location.href = '/login';
      return;
    }

    setBucket(storedBucket);

    fetch('http://localhost:5050/api/dashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ risk_bucket: storedBucket }),
    })
      .then((res) => res.json())
      .then((data) => setPicks(data.picks))
      .catch((err) => console.error('API error', err));
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
            Your profile suggests a mix of growth and stability aligned with a{' '}
            {bucket.toLowerCase()} risk tolerance.
          </p>
        </div>

        {/* Recommended Picks Card */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recommended Holdings</h2>

          <div className="grid grid-cols-2 text-sm font-medium text-gray-700 mb-2">
            <div>Ticker</div>
            <div>Return</div>
          </div>

          {picks.map((pick: any) => {
            const percent = pick.pred_return * 100;
            const isPositive = percent >= 0;

            return (
              <div
                key={pick.ticker}
                className="grid grid-cols-2 items-center text-sm py-2"
              >
                <div>{pick.ticker}</div>
                <div>
                  <div className="bg-gray-200 h-3 rounded overflow-hidden">
                    <div
                      className={`h-3 ${
                        isPositive ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{
                        width: `${Math.min(Math.abs(percent), 100)}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {percent.toFixed(2)}%
                  </p>
                </div>
              </div>
            );
          })}
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
