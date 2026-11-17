'use client';
// Sign-up page for Gathr
// GTR-8:  sign up with name, email and password
// GTR-12: tell the user if their email is already registered
// GTR-13: choose a role (Attendee or Organizer) while signing up
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

const heading = { className: 'font-serif' };
const body = { className: 'font-sans' };

const inputClass =
  'bg-[#2a1b47] border border-[#3d2a63] rounded-xl p-3 placeholder-purple-200/60 outline-none focus:border-[#c026a3]';

const DUPLICATE_EMAIL_MSG = 'This email is already registered.';

// GTR-13: the two roles a user can pick
const roles = [
  { value: 'attendee', title: 'Attendee', text: 'Find and RSVP to events' },
  { value: 'organizer', title: 'Organizer', text: 'Create and manage events' },
];

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // GTR-8 + GTR-13: check the form before sending it
  function validate() {
    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = 'Please enter a valid email address.';
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters.';
    if (!role) newErrors.role = 'Please choose Attendee or Organizer.';
    return newErrors;
  }

  async function handleSignup(e) {
    e.preventDefault();
    setMessage('');

    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);

    // GTR-8: create the account in Supabase Auth.
    // Name, role and organization are saved as user data; a database trigger
    // (database/signup_trigger.sql) copies them into the profiles table.
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role, // GTR-13
          organization_name: role === 'organizer' ? organizationName.trim() : null,
        },
      },
    });

    setLoading(false);

    if (error) {
      // GTR-12: Supabase says the email is taken (when email confirmation is OFF)
      if (error.code === 'user_already_exists' || /already registered/i.test(error.message)) {
        setErrors({ email: DUPLICATE_EMAIL_MSG });
      } else if (error.code === 'weak_password') {
        setErrors({ password: 'Please choose a stronger password.' });
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' });
      }
      return;
    }

    // GTR-12: when email confirmation is ON, Supabase doesn't send an error for a taken email.
    // Instead it returns a user with no identities, so we check for that.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setErrors({ email: DUPLICATE_EMAIL_MSG });
      return;
    }

    if (data.session) {
      // Signed in straight away (email confirmation is OFF)
      router.push('/'); // placeholder: the role-based redirect comes later
    } else {
      // Email confirmation is ON
      setMessage('Account created! Check your email to confirm it, then log in.');
    }
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
      {/* Header (The Logo) */}
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
            Join as an attendee to find events, or as an organizer to host your own.
          </p>
        </div>

        {/* Sign-up card */}
        <div className="w-full max-w-md bg-[#1a0f2e] rounded-3xl p-8 shadow-2xl">
          <h2 className={`${heading.className} text-center text-4xl mb-6`}>
            Create your account
          </h2>

          <form onSubmit={handleSignup} noValidate className="flex flex-col gap-2">
            {/* GTR-8: name */}
            <label className="text-sm font-medium">Full name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
            />
            {errors.fullName && <p className="text-pink-300 text-sm">{errors.fullName}</p>}

            {/* GTR-8 + GTR-12: email */}
            <label className="text-sm font-medium mt-3">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
            {errors.email && (
              <p className="text-pink-300 text-sm">
                {errors.email}{' '}
                {errors.email === DUPLICATE_EMAIL_MSG && (
                  <Link href="/login" className="underline font-bold">
                    Log in instead
                  </Link>
                )}
              </p>
            )}

            {/* GTR-8: password */}
            <label className="text-sm font-medium mt-3">Password</label>
            <input
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            {errors.password && <p className="text-pink-300 text-sm">{errors.password}</p>}

            {/* GTR-13: role selection */}
            <label className="text-sm font-medium mt-3">I want to join as</label>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`text-left rounded-xl p-3 border-2 transition ${
                    role === r.value
                      ? 'border-[#c026a3] bg-[#c026a3]/20 shadow-[0_0_20px_rgba(192,38,163,0.4)]'
                      : 'border-[#3d2a63] bg-[#2a1b47] hover:border-[#c026a3]/60'
                  }`}
                >
                  <p className="font-bold">{r.title}</p>
                  <p className="text-xs opacity-80">{r.text}</p>
                </button>
              ))}
            </div>
            {errors.role && <p className="text-pink-300 text-sm">{errors.role}</p>}

            {/* Organizers can add their organization (optional, saved to profiles.organization_name) */}
            {role === 'organizer' && (
              <>
                <label className="text-sm font-medium mt-3">Organization name (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. IBA Music Society"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className={inputClass}
                />
              </>
            )}

            {errors.general && <p className="text-pink-300 text-sm">{errors.general}</p>}
            {message && <p className="text-[#5ce1e6] text-sm">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-[#c026a3] rounded-full p-3 mt-4 font-bold shadow-[0_0_20px_rgba(192,38,163,0.5)] hover:brightness-110 disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <p className="text-center text-sm mt-5 opacity-80">Already have an account?</p>
          <Link
            href="/login"
            className="block text-center bg-[#5ce1e6] text-[#1a0f2e] rounded-full p-3 mt-3 font-bold hover:brightness-110"
          >
            Log in
          </Link>
        </div>
      </main>
    </div>
  );
}
