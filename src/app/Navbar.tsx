'use client';
import Link from 'next/link';
import { useUser } from './UserContext';

export default function Navbar() {
  const { username, logout } = useUser();

  return (
    <nav className="bg-black text-white px-6 py-3 flex justify-between items-center">
      <div className="text-green-400 font-bold text-lg">AI<span className="text-white">4</span>INVEST</div>
      <div className="flex items-center gap-4">
        <Link href="/" className="text-sm">Home</Link>
        {!username ? (
          <>
            <Link href="/create" className="border border-green-400 text-green-400 rounded-full px-3 py-1 text-sm hover:bg-green-400 hover:text-black transition">Create</Link>
            <Link href="/login" className="bg-green-400 text-black rounded-full px-4 py-1 text-sm hover:bg-green-500">Log In</Link>
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-300">Hi, {username}</span>
            <button onClick={logout} className="text-xs text-red-400 hover:text-red-300">Log out</button>
          </div>
        )}
      </div>
    </nav>
  );
}
