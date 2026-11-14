'use client';
import { useState } from 'react';
import Link from 'next/link';

const heading = { className: 'font-serif' };
const body = { className: 'font-sans' };

const events = [
  { tag: 'Music', title: 'Indie Band Showcase', time: 'Nov 25 · 8:00 PM', image: '/music.jpg', color: 'bg-[#7c4dff]', rotate: '-rotate-3' },
  { tag: 'Social', title: 'Open Mic & Poetry Night', time: 'Nov 18 · 6:30 PM', image: '/social.jpg', color: 'bg-[#c026a3]', rotate: 'rotate-2' },
  { tag: 'Tech', title: 'Backyard Movie Night', time: 'Nov 20 · 10:00 AM', image: '/music.jpg', color: 'bg-[#5ce1e6]', rotate: '-rotate-2' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleLogin(e) {
    e.preventDefault();
    setError('');

    // Placeholder: Supabase login gets connected here later.
    setError('Invalid email or password');
  }
  return (
 <div
  className={`${body.className} min-h-screen text-white flex flex-col`}
  style={{
    backgroundColor: '#1a0b2e',
    backgroundImage:
      'radial-gradient(circle at 15% 20%, #6d28d9 0%, transparent 45%), radial-gradient(circle at 85% 75%, #a21caf 0%, transparent 45%)',
  }}
>

      {/* Header */}
      <header className="flex items-center gap-3 px-8 py-6">
        <div className="w-10 h-10 rounded-xl bg-[#c026a3] flex items-center justify-center font-bold">
          G
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-between gap-10 px-8 lg:px-16 pb-10">
        {/* Left side */}
        <div className="flex-1">
          <h1 className={`${heading.className} text-8xl font-medium`}>Gathr</h1>
          <p className={`${heading.className} italic text-4xl text-pink-300 mt-4`}>
            Discover and Manage Events Across the City
          </p>
          <p className="mt-4 text-sm">
            Meetups, workshops, concerts and career fairs, all in one place.
          </p>

          {/* Event cards with photo backgrounds */}
          <div className="flex flex-wrap gap-4 mt-12">
            {events.map((ev) => (
              <div
                key={ev.title}
                className={`${ev.color} ${ev.rotate} relative overflow-hidden w-44 h-32 rounded-2xl p-4 shadow-lg`}
              >
                {/* Background photo */}
                <img
                  src={ev.image}
                  alt={ev.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Dark layer so the text stays readable */}
                <div className="absolute inset-0 bg-black/40" />

                {/* Text on top */}
                <div className="relative text-white">
                  <span className="inline-block bg-white/80 text-black text-xs font-medium rounded-full px-3 py-1">
                    {ev.tag}
                  </span>
                  <p className="mt-2 font-bold text-sm">{ev.title}</p>
                  <p className="text-xs opacity-90">{ev.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Login card */}
        <div className="w-full max-w-md bg-[#1a0f2e] rounded-3xl p-8 shadow-2xl">
          <h2 className={`${heading.className} text-center text-4xl mb-6`}>
            Log in to your account
          </h2>

          <form onSubmit={handleLogin} className="flex flex-col gap-2">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-[#2a1b47] border border-[#3d2a63] rounded-xl p-3 mb-3 placeholder-purple-200/60 outline-none focus:border-[#c026a3]"
            />

            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-[#2a1b47] border border-[#3d2a63] rounded-xl p-3 mb-3 placeholder-purple-200/60 outline-none focus:border-[#c026a3]"
            />

            {error && <p className="text-pink-300 text-sm">{error}</p>}

            <button
              type="submit"
              className="bg-[#c026a3] rounded-full p-3 mt-2 font-bold shadow-[0_0_20px_rgba(192,38,163,0.5)] hover:brightness-110"
            >
              Log in
            </button>
          </form>

          <p className="text-center text-sm mt-5">or</p>
          <p className="text-center text-sm mb-3 opacity-80">
            Don't have an account?
          </p>
          <Link
            href="/signup"
            className="block text-center bg-[#5ce1e6] text-[#1a0f2e] rounded-full p-3 font-bold hover:brightness-110"
          >
            Sign up
          </Link>
        </div>
      </main>
    </div>
  );
}