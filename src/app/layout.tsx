'use client';
import './globals.css'; 
import Navbar from './Navbar'; // ← 注意相對路徑
import { UserProvider } from './UserContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
    <body className="font-sans min-h-screen">
      <UserProvider>
        <Navbar />
        <main>{children}</main>
      </UserProvider>
    </body>
  </html>
  );
}
