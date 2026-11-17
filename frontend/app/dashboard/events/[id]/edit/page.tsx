'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { ApiError, fetchEvent, updateEvent } from '@/lib/api';
import type { OrganizerEvent, UpdateEventPayload } from '@/lib/api';

const CATEGORIES = ['music', 'sports', 'workshops', 'food', 'tech'];

const inputStyles =
  'w-full rounded-xl bg-[#2a1b47] border border-[#3d2a63] px-4 py-3 text-sm text-white placeholder-purple-200/50 outline-none focus:border-[#c026a3] transition-colors';

function Row({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[160px_1fr] items-start">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-purple-200 sm:pt-3">
        {label}
      </label>
      <div>{children}</div>
    </div>
  );
}

export default function EditEventPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<OrganizerEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states matching Page 10
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [capacity, setCapacity] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venue, setVenue] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    fetchEvent(params.id)
      .then((ev) => {
        if (ignore) return;
        setEvent(ev);
        setTitle(ev.title);
        setCategory(ev.category.toLowerCase());
        setCapacity(String(ev.capacity));
        setVenue(ev.venue);
        setLocation(ev.location);
        setDescription(ev.description);

        // Parse ISO start/end into date, time
        const start = new Date(ev.start_time);
        const end = new Date(ev.end_time);
        const pad = (n: number) => n.toString().padStart(2, '0');

        setDate(`${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`);
        setStartTime(`${pad(start.getHours())}:${pad(start.getMinutes())}`);
        setEndTime(`${pad(end.getHours())}:${pad(end.getMinutes())}`);
      })
      .catch((e) => {
        if (ignore) return;
        if (e instanceof ApiError) setError(e.message);
        else setError('Failed to load event details.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [params.id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError('Please provide a valid date and times');
      return;
    }
    if (end <= start) {
      setError('End time must be after start time');
      return;
    }

    const capNum = parseInt(capacity, 10);
    if (!Number.isInteger(capNum) || capNum <= 0) {
      setError('Max seats must be a whole number greater than 0');
      return;
    }

    if (event && capNum < (event.rsvp_count || 0)) {
      setError(`Capacity cannot be lower than current confirmed RSVPs (${event.rsvp_count})`);
      return;
    }

    setSaving(true);
    try {
      const payload: UpdateEventPayload = {
        title: title.trim(),
        description: description.trim(),
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        venue: venue.trim(),
        location: location.trim(),
        capacity: capNum,
        category: category.trim(),
      };

      const updated = await updateEvent(params.id, payload);
      setEvent(updated);
      setSuccess(`"${updated.title}" was updated successfully.`);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="min-h-screen text-white flex"
      style={{
        backgroundColor: '#120726',
        backgroundImage:
          'radial-gradient(circle at 10% 15%, #4c1d95 0%, transparent 40%), radial-gradient(circle at 90% 85%, #831843 0%, transparent 45%)',
      }}
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area matching Page 10 in PDF */}
      <main className="flex-1 p-8 lg:p-10 max-w-5xl overflow-x-hidden">
        {/* Back Link & Search */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/dashboard"
            className="text-xs text-purple-300 hover:text-white underline transition-colors"
          >
            ← Back to Dashboard
          </Link>

          <input
            type="text"
            placeholder="Search events..."
            className="w-64 bg-[#1e1038] border border-[#3d2766] rounded-full px-4 py-2 text-xs text-white placeholder-purple-300/50 outline-none focus:border-[#c026a3] transition-colors"
          />
        </div>

        {/* Title */}
        <h1 className="font-serif text-4xl lg:text-5xl font-medium tracking-tight mb-8">
          Edit Event
        </h1>

        {loading ? (
          <p className="text-purple-300/70 py-10">Loading event details...</p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 rounded-3xl bg-[#1b0d36]/90 border border-[#351d5c] p-8 shadow-2xl"
          >
            {/* Feedback Banners */}
            {error && (
              <p className="rounded-xl bg-pink-500/10 border border-pink-500/30 p-3.5 text-sm text-pink-300">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-xl bg-emerald-400/10 border border-emerald-400/30 p-3.5 text-sm text-emerald-300">
                {success}
              </p>
            )}

            {/* Event Title */}
            <Row label="Event Title:" htmlFor="title">
              <input
                id="title"
                type="text"
                maxLength={120}
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Intro to React & Tailwind"
                className={inputStyles}
              />
              <p className="mt-1 text-xs text-purple-300/50">{title.length}/120 characters</p>
            </Row>

            {/* Category and Max Seats Row */}
            <Row label="Category:" htmlFor="category">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <select
                  id="category"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`${inputStyles} flex-1 capitalize`}
                >
                  <option value="" className="bg-[#1b0d36] text-purple-300">
                    Select Category
                  </option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-[#1b0d36] text-white capitalize">
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-2">
                  <label htmlFor="capacity" className="whitespace-nowrap text-sm font-semibold text-purple-200">
                    Max Seats:
                  </label>
                  <input
                    id="capacity"
                    type="number"
                    min={event?.rsvp_count || 1}
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className={`${inputStyles} !w-24 text-center`}
                  />
                </div>
              </div>
              {event && (
                <p className="mt-1.5 text-xs text-purple-300/60">
                  Confirmed RSVPs: <span className="text-[#5ce1e6] font-semibold">{event.rsvp_count}</span> (capacity cannot be lowered below this count).
                </p>
              )}
            </Row>

            {/* Date & Time Row */}
            <Row label="Date & Time:" htmlFor="date">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  id="date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`${inputStyles} !w-auto flex-1 min-w-[150px]`}
                />
                <input
                  id="startTime"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={`${inputStyles} !w-auto flex-1 min-w-[120px]`}
                />
                <span className="text-sm text-purple-200">to</span>
                <input
                  id="endTime"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={`${inputStyles} !w-auto flex-1 min-w-[120px]`}
                />
              </div>
            </Row>

            {/* Venue */}
            <Row label="Venue/Location:" htmlFor="venue">
              <input
                id="venue"
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Auditorium A, Hall 3"
                className={inputStyles}
              />
            </Row>

            {/* Area / City */}
            <Row label="Area / City:" htmlFor="location">
              <input
                id="location"
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Clifton (used for feed filtering)"
                className={inputStyles}
              />
            </Row>

            {/* Description & Requirements */}
            <Row label="Description & Requirements:" htmlFor="description">
              <textarea
                id="description"
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter event details, agenda, speaker info, etc..."
                className={inputStyles}
              />
            </Row>

            {/* Action Buttons matching Page 10 */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[#351d5c]/60">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="rounded-full border border-[#c026a3] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#c026a3]/20 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#c026a3] px-6 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(192,38,163,0.5)] hover:brightness-110 disabled:opacity-60 transition-all"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
