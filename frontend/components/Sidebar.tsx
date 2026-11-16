'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar({ organizerName = 'Organizer' }: { organizerName?: string }) {
  const pathname = usePathname();

  const isOverview = pathname === '/dashboard';
  const isEvents = pathname.startsWith('/dashboard/events');

  return (
    <aside className="w-64 shrink-0 flex flex-col justify-between p-6 min-h-screen text-white select-none">
      <div>
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#c026a3] flex items-center justify-center font-bold text-lg text-white shadow-[0_0_15px_rgba(192,38,163,0.5)]">
            G
          </div>
          <span className="font-serif text-3xl font-normal tracking-wide">Gathr</span>
        </Link>

        {/* User Card */}
        <div className="bg-[#1f103b]/80 border border-[#371f63] rounded-2xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#5ce1e6] text-[#130924] font-bold flex items-center justify-center text-sm shadow-[0_0_10px_rgba(92,225,230,0.4)]">
            {organizerName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{organizerName}</p>
            <p className="text-xs text-purple-300">Organizer</p>
            <Link href="/profile" className="text-[11px] text-[#5ce1e6] hover:underline">
              My Profile
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2">
          <Link
            href="/dashboard"
            className={`flex items-center px-4 py-3 rounded-full text-sm font-medium transition-all ${
              isOverview && !pathname.includes('/events')
                ? 'bg-[#c026a3] text-white shadow-[0_0_20px_rgba(192,38,163,0.5)] font-semibold'
                : 'text-purple-200 hover:text-white hover:bg-white/5'
            }`}
          >
            Overview
          </Link>
          <Link
            href="/dashboard"
            className={`flex items-center px-4 py-3 rounded-full text-sm font-medium transition-all ${
              isEvents
                ? 'bg-[#c026a3] text-white shadow-[0_0_20px_rgba(192,38,163,0.5)] font-semibold'
                : 'text-purple-200 hover:text-white hover:bg-white/5'
            }`}
          >
            My Events
          </Link>
          <button
            type="button"
            className="flex items-center px-4 py-3 rounded-full text-sm font-medium text-purple-200/70 hover:text-white hover:bg-white/5 text-left"
          >
            Attendee Rosters
          </button>
        </nav>
      </div>

      {/* Logout */}
      <div className="pt-6">
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('access_token');
              localStorage.removeItem('gathr_token');
              window.location.href = '/login';
            }
          }}
          className="text-xs text-purple-300 hover:text-white transition-colors"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
