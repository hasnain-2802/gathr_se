'use client';
import { useState, FormEvent, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API, getToken } from '@/lib/api';

const CATEGORIES = ['music', 'sports', 'workshops', 'food', 'tech'];

const input =
  'w-full rounded-lg bg-[#2a1b47] border border-[#3d2a63] px-4 py-3 text-sm placeholder-purple-200/50 outline-none focus:border-[#c026a3]';

const empty = {
  title: '', category: '', capacity: '', date: '', startTime: '', endTime: '',
  venue: '', location: '', description: '',
};

function Row({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[150px_1fr]">
      <label htmlFor={htmlFor} className="text-sm font-semibold sm:pt-3">{label}</label>
      <div>{children}</div>
    </div>
  );
}

export default function CreateEventPage() {
  const router = useRouter();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const bind = (k: keyof typeof empty) => ({
    id: k,
    value: form[k],
    onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value })),
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Local (Pakistan) time -> UTC ISO strings for the API
    const start = new Date(`${form.date}T${form.startTime}`);
    const end = new Date(`${form.date}T${form.endTime}`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return setError('Pick a valid date and times');
    if (end <= start) return setError('End time must be after start time');
    if (start <= new Date()) return setError('Start time must be in the future');
    const capacity = Number(form.capacity);
    if (!Number.isInteger(capacity) || capacity <= 0)
      return setError('Max seats must be a whole number greater than 0');

    setLoading(true);
    try {
      const res = await fetch(`${API}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          venue: form.venue,
          location: form.location,
          capacity,
          category: form.category,
        }),
      });
      const json = await res.json();
      if (!res.ok) return setError(json.message ?? 'Something went wrong');
      setSuccess(`"${json.data.title}" is published and now appears in the discovery feed.`);
      setForm(empty);
    } catch {
      setError('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen px-6 py-8 text-white"
      style={{
        backgroundColor: '#1a0b2e',
        backgroundImage:
          'radial-gradient(circle at 15% 20%, #6d28d9 0%, transparent 45%), radial-gradient(circle at 85% 75%, #a21caf 0%, transparent 45%)',
      }}
    >
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard" className="text-xs underline opacity-80 hover:opacity-100">
          ← Back to Dashboard
        </Link>
        <h1 className="mb-6 mt-3 font-serif text-5xl">Create New Event</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-3xl bg-[#1a0f2e]/90 p-8 shadow-2xl">
          {error && <p role="alert" className="rounded-lg bg-pink-500/10 p-3 text-sm text-pink-300">{error}</p>}
          {success && <p role="status" className="rounded-lg bg-emerald-400/10 p-3 text-sm text-emerald-300">{success}</p>}

          <Row label="Event Title:" htmlFor="title">
            <input {...bind('title')} className={input} maxLength={120} required
                   placeholder="e.g., Intro to React & Tailwind" />
          </Row>

          <Row label="Category:" htmlFor="category">
            <div className="flex items-center gap-3">
              <select {...bind('category')} className={input} required>
                <option value="">Select Category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
              <label htmlFor="capacity" className="whitespace-nowrap text-sm font-semibold">Max Seats:</label>
              <input {...bind('capacity')} className={`${input} !w-24`} type="number" min={1} step={1}
                     required placeholder="50" />
            </div>
          </Row>

          <Row label="Date & Time:" htmlFor="date">
            <div className="flex flex-wrap items-center gap-3">
              <input {...bind('date')} className={`${input} !w-auto flex-1`} type="date" required />
              <input {...bind('startTime')} aria-label="Start time" className={`${input} !w-auto flex-1`} type="time" required />
              <span className="text-sm">to</span>
              <input {...bind('endTime')} aria-label="End time" className={`${input} !w-auto flex-1`} type="time" required />
            </div>
          </Row>

          <Row label="Venue/Location:" htmlFor="venue">
            <input {...bind('venue')} className={input} required placeholder="Auditorium A, Hall 3" />
          </Row>

          <Row label="Area / City:" htmlFor="location">
            <input {...bind('location')} className={input} required placeholder="e.g., Clifton (used for feed filtering)" />
          </Row>

          <Row label="Description & Requirements:" htmlFor="description">
            <textarea {...bind('description')} className={input} rows={6} required
                      placeholder="Enter event details, agenda, speaker info, etc..." />
          </Row>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => router.back()}
                    className="rounded-full border border-[#c026a3] px-6 py-2.5 text-sm font-medium hover:bg-[#c026a3]/20">
              Cancel
            </button>
            <button type="button" disabled title="Drafts are not supported by the API yet"
                    className="rounded-full bg-[#5ce1e6] px-6 py-2.5 text-sm font-bold text-[#1a0f2e] opacity-50">
              Save Draft
            </button>
            <button disabled={loading}
                    className="rounded-full bg-[#c026a3] px-6 py-2.5 text-sm font-bold shadow-[0_0_20px_rgba(192,38,163,0.5)] hover:brightness-110 disabled:opacity-60">
              {loading ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}