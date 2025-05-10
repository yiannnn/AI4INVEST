// src/app/page.tsx
'use client';
import React from "react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="flex justify-center">
        <div className="w-[400px] h-[300px] bg-gray-300 flex items-center justify-center text-gray-700 text-sm">
          rotate slide
        </div>
      </div>
    </div>
  );
}
